-- 스드메의 문단속 — 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run 하면 됩니다.
--
-- 설계의 핵심:
--   vendor_addons 가 "업체가 입점할 때 선언한 추가금의 전부"입니다.
--   여기에 없는 명목으로 청구된 금액은 전부 보증 대상입니다.
--   is_declared() 함수가 그 판정을 DB 안에서 직접 합니다.

-- ──────────────────────────────────────────────
-- 1. 업체
-- ──────────────────────────────────────────────
create table if not exists vendors (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  category      text not null check (category in ('studio', 'dress', 'makeup')),
  name          text not null,
  area          text not null,
  description   text,
  base_price    integer not null check (base_price >= 0),
  rating        numeric(2,1) not null default 0,
  review_count  integer not null default 0,
  tags          text[] not null default '{}',
  -- pending: 입점 신청만 된 상태, active: 노출, suspended: 미고지 반복으로 제한
  status        text not null default 'pending'
                check (status in ('pending', 'active', 'suspended')),
  created_at    timestamptz not null default now()
);

create index if not exists vendors_category_status_idx on vendors (category, status);

-- ──────────────────────────────────────────────
-- 2. 선언된 추가금  ← 이 테이블이 보증의 근거입니다
-- ──────────────────────────────────────────────
create table if not exists vendor_addons (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references vendors(id) on delete cascade,
  name        text not null,
  amount      integer not null check (amount >= 0),
  -- required: 어차피 내야 하는 비용. 체크 해제가 불가능하고 총액에 항상 포함됩니다.
  required    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (vendor_id, name)
);

create index if not exists vendor_addons_vendor_idx on vendor_addons (vendor_id, sort_order);

-- ──────────────────────────────────────────────
-- 3. 업체가 연 슬롯 (캘린더 전체를 받지 않고, 열어준 날만 받습니다)
-- ──────────────────────────────────────────────
create table if not exists vendor_slots (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references vendors(id) on delete cascade,
  date       date not null,
  slot       text not null check (slot in ('am', 'pm')),
  is_open    boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (vendor_id, date, slot)
);

create index if not exists vendor_slots_lookup_idx on vendor_slots (date, slot, is_open);

-- ──────────────────────────────────────────────
-- 4. 견적서
-- ──────────────────────────────────────────────
create table if not exists quotes (
  id              uuid primary key default gen_random_uuid(),
  -- 공유용 짧은 코드 (URL: /quotes/AB3F9K)
  code            text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  user_id         uuid references auth.users(id) on delete set null,
  wedding_date    date,
  shoot_date      date,
  shoot_slot      text check (shoot_slot in ('am', 'pm')),
  base_total      integer not null default 0,
  addon_total     integer not null default 0,
  bundle_discount integer not null default 0,
  date_discount   integer not null default 0,
  total           integer not null default 0,
  -- 보증은 "확정 총액"이 잡힌 견적에만 붙습니다
  guaranteed      boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists quote_items (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references quotes(id) on delete cascade,
  vendor_id       uuid not null references vendors(id),
  category        text not null,
  base_price      integer not null,
  -- 고객이 체크한 추가금 스냅샷. 이 기록 자체가 분쟁 시 증거가 됩니다.
  selected_addons jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists quote_items_quote_idx on quote_items (quote_id);

-- ──────────────────────────────────────────────
-- 5. 보증 신청
-- ──────────────────────────────────────────────
create table if not exists guarantee_claims (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid references quotes(id) on delete set null,
  user_id        uuid references auth.users(id) on delete set null,
  vendor_id      uuid references vendors(id),
  claimed_name   text not null,                 -- 현장에서 청구받은 항목의 명목
  claimed_amount integer not null check (claimed_amount >= 0),
  evidence_note  text,
  -- 접수 시점에 DB가 스스로 판정한 결과를 그대로 저장합니다
  was_declared   boolean,
  status         text not null default 'received'
                 check (status in ('received', 'reviewing', 'approved', 'rejected')),
  created_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 6. 업체 입점 신청
-- ──────────────────────────────────────────────
create table if not exists partner_applications (
  id                uuid primary key default gen_random_uuid(),
  business_name     text not null,
  category          text not null check (category in ('studio', 'dress', 'makeup')),
  area              text,
  contact_name      text,
  contact_phone     text,
  contact_email     text,
  base_price        integer,
  -- 선언할 추가금 목록 [{name, amount, required}]
  declared_addons   jsonb not null default '[]'::jsonb,
  -- 총액 보증 약관 동의. 이게 false면 입점이 성립하지 않습니다.
  agreed_guarantee  boolean not null default false,
  status            text not null default 'received'
                    check (status in ('received', 'reviewing', 'approved', 'rejected')),
  created_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 7. 핵심 함수 — 이 금액이 선언된 것인가?
-- ──────────────────────────────────────────────
create or replace function is_declared(p_vendor_id uuid, p_name text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from vendor_addons
    where vendor_id = p_vendor_id
      and lower(trim(name)) = lower(trim(p_name))
  );
$$;

-- 보증 신청이 들어오면 판정 결과를 자동으로 박아둡니다
create or replace function set_claim_declared()
returns trigger
language plpgsql
as $$
begin
  new.was_declared := is_declared(new.vendor_id, new.claimed_name);
  return new;
end;
$$;

drop trigger if exists guarantee_claims_declared on guarantee_claims;
create trigger guarantee_claims_declared
  before insert on guarantee_claims
  for each row execute function set_claim_declared();

-- ──────────────────────────────────────────────
-- 8. RLS (행 수준 보안)
-- ──────────────────────────────────────────────
alter table vendors              enable row level security;
alter table vendor_addons        enable row level security;
alter table vendor_slots         enable row level security;
alter table quotes               enable row level security;
alter table quote_items          enable row level security;
alter table guarantee_claims     enable row level security;
alter table partner_applications enable row level security;

-- 활성 업체와 그 추가금·슬롯은 누구나 읽을 수 있습니다 (가격 공개가 전제이므로)
drop policy if exists "활성 업체 공개" on vendors;
create policy "활성 업체 공개" on vendors
  for select using (status = 'active');

drop policy if exists "활성 업체의 추가금 공개" on vendor_addons;
create policy "활성 업체의 추가금 공개" on vendor_addons
  for select using (
    exists (select 1 from vendors v where v.id = vendor_id and v.status = 'active')
  );

drop policy if exists "활성 업체의 슬롯 공개" on vendor_slots;
create policy "활성 업체의 슬롯 공개" on vendor_slots
  for select using (
    exists (select 1 from vendors v where v.id = vendor_id and v.status = 'active')
  );

-- 견적서는 코드를 아는 사람이 열 수 있고, 저장은 누구나 할 수 있습니다
drop policy if exists "견적서 조회" on quotes;
create policy "견적서 조회" on quotes for select using (true);

drop policy if exists "견적서 저장" on quotes;
create policy "견적서 저장" on quotes for insert with check (true);

drop policy if exists "견적 항목 조회" on quote_items;
create policy "견적 항목 조회" on quote_items for select using (true);

drop policy if exists "견적 항목 저장" on quote_items;
create policy "견적 항목 저장" on quote_items for insert with check (true);

-- 보증 신청은 접수만 공개. 조회는 본인 것만.
drop policy if exists "보증 신청 접수" on guarantee_claims;
create policy "보증 신청 접수" on guarantee_claims for insert with check (true);

drop policy if exists "본인 보증 신청 조회" on guarantee_claims;
create policy "본인 보증 신청 조회" on guarantee_claims
  for select using (auth.uid() is not null and user_id = auth.uid());

-- 입점 신청은 접수만. 내용은 운영자(service_role)만 봅니다.
drop policy if exists "입점 신청 접수" on partner_applications;
create policy "입점 신청 접수" on partner_applications for insert with check (true);
