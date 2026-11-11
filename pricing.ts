import type { Slot } from "./types";

/**
 * 가격 계산은 전부 여기 한 곳에만 있습니다.
 * 화면에 보이는 숫자와 DB에 저장되는 숫자가 갈라지면 보증이 성립하지 않기 때문입니다.
 */

export const WEEKDAY_DISCOUNT = 100_000;
export const OFF_SEASON_DISCOUNT = 100_000;
export const FIRST_SLOT_DISCOUNT = 100_000;
export const BUNDLE_2 = 200_000;
export const BUNDLE_3 = 400_000;

/** 보증 한도 — 건당 */
export const GUARANTEE_CAP = 500_000;
/** 보상액 중 업체에 구상하는 비율 */
export const VENDOR_RECOURSE_RATE = 0.5;

const OFF_SEASON_MONTHS = [11, 12, 1, 2, 7, 8];

export function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, last));
  return r;
}

export function isOffSeason(d: Date): boolean {
  return OFF_SEASON_MONTHS.includes(d.getMonth() + 1);
}

export function isWeekday(d: Date): boolean {
  const w = d.getDay();
  return w >= 1 && w <= 5;
}

export interface DiscountLine {
  label: string;
  amount: number;
}

export function dateDiscount(
  dateStr: string | null,
  slot: Slot | null
): { total: number; lines: DiscountLine[] } {
  if (!dateStr) return { total: 0, lines: [] };
  const d = parseYMD(dateStr);
  const lines: DiscountLine[] = [];
  if (isWeekday(d)) lines.push({ label: "평일 촬영", amount: WEEKDAY_DISCOUNT });
  if (isOffSeason(d)) lines.push({ label: "비수기", amount: OFF_SEASON_DISCOUNT });
  if (slot === "am") lines.push({ label: "첫 타임", amount: FIRST_SLOT_DISCOUNT });
  return { total: lines.reduce((s, l) => s + l.amount, 0), lines };
}

export function bundleDiscount(count: number): number {
  if (count >= 3) return BUNDLE_3;
  if (count === 2) return BUNDLE_2;
  return 0;
}

export const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function won(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function manwon(n: number): string {
  return (Math.round((n / 10000) * 10) / 10).toLocaleString("ko-KR") + "만";
}

export function stars(r: number): string {
  const f = Math.round(r);
  return "★★★★★".slice(0, f) + "☆☆☆☆☆".slice(0, 5 - f);
}
