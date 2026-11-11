import type { VendorWithAddons, Slot } from "./types";

/**
 * Supabase 환경변수가 아직 없을 때 쓰는 대체 데이터.
 * 배포만 먼저 해놓고 DB를 나중에 붙여도 사이트가 돌아가도록 하기 위한 것입니다.
 * 내용은 supabase/seed.sql 과 동일합니다.
 */

type Raw = Omit<VendorWithAddons, "id" | "addons"> & {
  addons: { name: string; amount: number; required: boolean }[];
};

const RAW: Raw[] = [
  {
    slug: "mui", category: "studio", name: "무이스튜디오", area: "서울 강남구 논현동",
    description: "층고 6m 자연광 스튜디오. 오전 타임은 남향 직광이 들어옵니다.",
    base_price: 1800000, rating: 4.8, review_count: 312, tags: ["자연광", "원본 전체"], status: "active",
    addons: [
      { name: "헬퍼비", amount: 150000, required: true },
      { name: "원본 파일 전체", amount: 270000, required: false },
      { name: "작가 지정", amount: 200000, required: false },
      { name: "야간 로드씬", amount: 200000, required: false },
    ],
  },
  {
    slug: "terra", category: "studio", name: "테라스튜디오", area: "서울 성동구 성수동",
    description: "콘크리트와 우드 베이스의 모던 세트 3종. 앨범 기본 20페이지.",
    base_price: 1450000, rating: 4.6, review_count: 208, tags: ["모던", "실내 3세트"], status: "active",
    addons: [
      { name: "헬퍼비", amount: 150000, required: true },
      { name: "원본 파일 전체", amount: 450000, required: false },
      { name: "앨범 페이지 추가", amount: 350000, required: false },
    ],
  },
  {
    slug: "aura", category: "studio", name: "아우라필름", area: "경기 파주시 탄현면",
    description: "필름 톤 보정과 야외 로드씬이 강점. 보정 기간 약 8주.",
    base_price: 2200000, rating: 4.9, review_count: 151, tags: ["필름", "야외 로드"], status: "active",
    addons: [
      { name: "헬퍼비", amount: 150000, required: true },
      { name: "한옥씬 촬영", amount: 100000, required: false },
    ],
  },
  {
    slug: "nicol", category: "dress", name: "니콜스포사", area: "서울 강남구 청담동",
    description: "수입 라인 중심. 피팅 2벌 기본, 본식과 촬영 각 1벌 선택.",
    base_price: 2500000, rating: 4.7, review_count: 264, tags: ["수입", "프리미엄"], status: "active",
    addons: [
      { name: "피팅비", amount: 50000, required: true },
      { name: "프리미엄 라인", amount: 550000, required: false },
    ],
  },
  {
    slug: "rahel", category: "dress", name: "라헬르", area: "서울 서초구 잠원동",
    description: "국내 제작 심플 라인. 수선 1회 포함, 사이즈 대응 폭이 넓습니다.",
    base_price: 1800000, rating: 4.5, review_count: 189, tags: ["국내 제작", "심플"], status: "active",
    addons: [
      { name: "피팅비", amount: 50000, required: true },
      { name: "베일 업그레이드", amount: 120000, required: false },
    ],
  },
  {
    slug: "vera", category: "dress", name: "베라모드", area: "서울 광진구 자양동",
    description: "기본 라인 위주. 비수기 평일 예약이 비교적 수월합니다.",
    base_price: 1300000, rating: 4.3, review_count: 97, tags: ["합리적", "빠른 예약"], status: "active",
    addons: [{ name: "피팅비", amount: 50000, required: true }],
  },
  {
    slug: "seol", category: "makeup", name: "설영", area: "서울 강남구 신사동",
    description: "본식 리터치 1회 포함. 얼리스타트는 별도 선언 항목입니다.",
    base_price: 800000, rating: 4.9, review_count: 401, tags: ["원장 직접", "리터치 포함"], status: "active",
    addons: [
      { name: "원장 지정", amount: 150000, required: false },
      { name: "헤어피스", amount: 130000, required: false },
      { name: "얼리스타트 (04:00~04:30)", amount: 200000, required: false },
    ],
  },
  {
    slug: "hiel", category: "makeup", name: "히엘", area: "서울 마포구 연남동",
    description: "내추럴 메이크업 중심. 혼주 동시 진행이 가능합니다.",
    base_price: 720000, rating: 4.6, review_count: 233, tags: ["내추럴", "혼주 동시"], status: "active",
    addons: [
      { name: "부원장 지정", amount: 100000, required: false },
      { name: "헤어피스", amount: 160000, required: false },
    ],
  },
  {
    slug: "bora", category: "makeup", name: "보라", area: "경기 성남시 분당구",
    description: "수도권 남부 출장 가능. 촬영과 본식을 묶으면 할인됩니다.",
    base_price: 650000, rating: 4.4, review_count: 118, tags: ["합리적", "출장"], status: "active",
    addons: [{ name: "헤어피스", amount: 130000, required: false }],
  },
];

export const DEMO_VENDORS: VendorWithAddons[] = RAW.map((v) => ({
  ...v,
  id: `demo-${v.slug}`,
  addons: v.addons.map((a, i) => ({
    ...a,
    id: `demo-${v.slug}-${i}`,
    vendor_id: `demo-${v.slug}`,
    sort_order: i,
  })),
}));

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** DB 없이도 날짜마다 다른 가용성이 나오도록 — 같은 날짜면 항상 같은 결과 */
export function demoSlots(vendorId: string, date: string): Slot[] {
  const h = hash(`${vendorId}|${date}`);
  if (h % 10 === 0) return [];
  const d = hash(date);
  const out: Slot[] = [];
  if ((d & 3) !== 0) out.push("am");
  if ((d & 12) !== 0) out.push("pm");
  return out;
}
