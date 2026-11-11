import { createClient, isConfigured } from "./supabase/server";
import { DEMO_VENDORS, demoSlots } from "./demo-data";
import type { Addon, SlotMap, Vendor, VendorWithAddons, Slot } from "./types";

/**
 * Supabase 가 설정돼 있으면 DB 에서, 아니면 데모 데이터로 읽습니다.
 * 두 경로의 반환 타입이 같으므로 화면 코드는 어느 쪽인지 몰라도 됩니다.
 */

export async function getVendors(): Promise<VendorWithAddons[]> {
  if (!isConfigured()) return DEMO_VENDORS;

  try {
    const supabase = await createClient();
    const [{ data: vendors, error: ve }, { data: addons, error: ae }] = await Promise.all([
      supabase.from("vendors").select("*").eq("status", "active").order("rating", { ascending: false }),
      supabase.from("vendor_addons").select("*").order("sort_order"),
    ]);
    if (ve || ae || !vendors?.length) return DEMO_VENDORS;

    const byVendor = new Map<string, Addon[]>();
    for (const a of (addons ?? []) as Addon[]) {
      const list = byVendor.get(a.vendor_id) ?? [];
      list.push(a);
      byVendor.set(a.vendor_id, list);
    }
    return (vendors as Vendor[]).map((v) => ({ ...v, addons: byVendor.get(v.id) ?? [] }));
  } catch {
    return DEMO_VENDORS;
  }
}

export async function getVendorBySlug(slug: string): Promise<VendorWithAddons | null> {
  const all = await getVendors();
  return all.find((v) => v.slug === slug) ?? null;
}

/** from~to 구간에서 각 업체가 열어둔 슬롯 */
export async function getSlotMap(from: string, to: string): Promise<SlotMap> {
  const vendors = await getVendors();
  const map: SlotMap = {};

  if (!isConfigured() || vendors === DEMO_VENDORS) {
    for (const v of vendors) {
      map[v.id] = {};
      for (const d of dateRange(from, to)) {
        const s = demoSlots(v.id, d);
        if (s.length) map[v.id][d] = s;
      }
    }
    return map;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vendor_slots")
      .select("vendor_id, date, slot")
      .eq("is_open", true)
      .gte("date", from)
      .lte("date", to);
    if (error) return map;

    for (const row of (data ?? []) as { vendor_id: string; date: string; slot: Slot }[]) {
      map[row.vendor_id] ??= {};
      map[row.vendor_id][row.date] ??= [];
      map[row.vendor_id][row.date].push(row.slot);
    }
    return map;
  } catch {
    return map;
  }
}

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export { isConfigured };
