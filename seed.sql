-- 스드메의 문단속 — 시드 데이터
-- schema.sql 을 먼저 돌린 뒤 이 파일을 SQL Editor 에 붙여넣고 Run 하세요.
--
-- 주의: 여기 들어가는 업체는 전부 가상입니다.
--       실제 업체를 넣으려면 입점 신청(/partner)을 통해 동의를 받은 뒤에만 넣으세요.

begin;

-- 업체 ----------------------------------------------------------------
insert into vendors (slug, category, name, area, description, base_price, rating, review_count, tags, status) values
('mui',   'studio', '무이스튜디오',   '서울 강남구 논현동',   '층고 6m 자연광 스튜디오. 오전 타임은 남향 직광이 들어옵니다.',        1800000, 4.8, 312, '{"자연광","원본 전체"}',    'active'),
('terra', 'studio', '테라스튜디오',   '서울 성동구 성수동',   '콘크리트와 우드 베이스의 모던 세트 3종. 앨범 기본 20페이지.',          1450000, 4.6, 208, '{"모던","실내 3세트"}',     'active'),
('aura',  'studio', '아우라필름',     '경기 파주시 탄현면',   '필름 톤 보정과 야외 로드씬이 강점. 보정 기간 약 8주.',                 2200000, 4.9, 151, '{"필름","야외 로드"}',      'active'),
('nicol', 'dress',  '니콜스포사',     '서울 강남구 청담동',   '수입 라인 중심. 피팅 2벌 기본, 본식과 촬영 각 1벌 선택.',              2500000, 4.7, 264, '{"수입","프리미엄"}',       'active'),
('rahel', 'dress',  '라헬르',         '서울 서초구 잠원동',   '국내 제작 심플 라인. 수선 1회 포함, 사이즈 대응 폭이 넓습니다.',       1800000, 4.5, 189, '{"국내 제작","심플"}',      'active'),
('vera',  'dress',  '베라모드',       '서울 광진구 자양동',   '기본 라인 위주. 비수기 평일 예약이 비교적 수월합니다.',                1300000, 4.3,  97, '{"합리적","빠른 예약"}',    'active'),
('seol',  'makeup', '설영',           '서울 강남구 신사동',   '본식 리터치 1회 포함. 얼리스타트는 별도 선언 항목입니다.',              800000, 4.9, 401, '{"원장 직접","리터치 포함"}','active'),
('hiel',  'makeup', '히엘',           '서울 마포구 연남동',   '내추럴 메이크업 중심. 혼주 동시 진행이 가능합니다.',                    720000, 4.6, 233, '{"내추럴","혼주 동시"}',    'active'),
('bora',  'makeup', '보라',           '경기 성남시 분당구',   '수도권 남부 출장 가능. 촬영과 본식을 묶으면 할인됩니다.',               650000, 4.4, 118, '{"합리적","출장"}',         'active')
on conflict (slug) do nothing;

-- 선언된 추가금 ---------------------------------------------------------
-- 이 목록이 각 업체가 청구할 수 있는 금액의 전부입니다.
insert into vendor_addons (vendor_id, name, amount, required, sort_order)
select v.id, a.name, a.amount, a.required, a.sort_order
from vendors v
join (values
  ('mui',   '헬퍼비',                   150000, true,  0),
  ('mui',   '원본 파일 전체',           270000, false, 1),
  ('mui',   '작가 지정',                200000, false, 2),
  ('mui',   '야간 로드씬',              200000, false, 3),
  ('terra', '헬퍼비',                   150000, true,  0),
  ('terra', '원본 파일 전체',           450000, false, 1),
  ('terra', '앨범 페이지 추가',         350000, false, 2),
  ('aura',  '헬퍼비',                   150000, true,  0),
  ('aura',  '한옥씬 촬영',              100000, false, 1),
  ('nicol', '피팅비',                    50000, true,  0),
  ('nicol', '프리미엄 라인',            550000, false, 1),
  ('rahel', '피팅비',                    50000, true,  0),
  ('rahel', '베일 업그레이드',          120000, false, 1),
  ('vera',  '피팅비',                    50000, true,  0),
  ('seol',  '원장 지정',                150000, false, 0),
  ('seol',  '헤어피스',                 130000, false, 1),
  ('seol',  '얼리스타트 (04:00~04:30)', 200000, false, 2),
  ('hiel',  '부원장 지정',              100000, false, 0),
  ('hiel',  '헤어피스',                 160000, false, 1),
  ('bora',  '헤어피스',                 130000, false, 0)
) as a(slug, name, amount, required, sort_order) on a.slug = v.slug
on conflict (vendor_id, name) do nothing;

-- 슬롯 -----------------------------------------------------------------
-- 오늘부터 540일치를 깝니다. 비수기(11,12,1,2,7,8월)와 평일은 개방률을 높이고,
-- 성수기 주말은 대부분 닫습니다 — "우리는 플래너가 못 채우는 자리만 받는다"는 전제 그대로입니다.
insert into vendor_slots (vendor_id, date, slot, is_open)
select
  v.id,
  d::date,
  s.slot,
  case
    when extract(isodow from d) in (6, 7)
         and extract(month from d) not in (11, 12, 1, 2, 7, 8)
      then random() < 0.10                                  -- 성수기 주말: 거의 없음
    when extract(isodow from d) in (6, 7)
      then random() < 0.35                                  -- 비수기 주말
    when extract(month from d) in (11, 12, 1, 2, 7, 8)
      then random() < 0.88                                  -- 비수기 평일: 대부분 열림
    else random() < 0.62                                    -- 성수기 평일
  end
from vendors v
cross join generate_series(current_date, current_date + 540, interval '1 day') d
cross join (values ('am'), ('pm')) as s(slot)
where v.status = 'active'
on conflict (vendor_id, date, slot) do nothing;

commit;

-- 확인용
-- select category, count(*) from vendors group by 1;
-- select v.name, count(*) filter (where s.is_open) as 열린슬롯 from vendors v join vendor_slots s on s.vendor_id = v.id group by 1 order by 2 desc;
