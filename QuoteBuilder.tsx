"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { demoSlots } from "@/lib/demo-data";
import { photo } from "@/lib/photo";
import {
  CATEGORIES, CATEGORY_LABEL, type Category, type Slot, type VendorWithAddons,
} from "@/lib/types";
import {
  DOW, addMonths, bundleDiscount, dateDiscount, manwon, parseYMD, stars, won, ymd,
} from "@/lib/pricing";

type SortKey = "rec" | "low" | "high" | "rate";

export default function QuoteBuilder({
  vendors, dbReady,
}: {
  vendors: VendorWithAddons[];
  dbReady: boolean;
}) {
  const router = useRouter();

  const [wedding, setWedding] = useState("2027-10-16");
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [sort, setSort] = useState<SortKey>("rec");
  const [picked, setPicked] = useState<Record<Category, string | null>>({
    studio: null, dress: null, makeup: null,
  });
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [fav, setFav] = useState<Record<string, boolean>>({});
  const [slotMap, setSlotMap] = useState<Record<string, Record<string, Slot[]>>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* 촬영 후보 날짜: 예식 5개월 전 ±7일 */
  const candidates = useMemo(() => {
    const c = addMonths(parseYMD(wedding), -5);
    const out: string[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date(c.getTime());
      d.setDate(d.getDate() + i);
      out.push(ymd(d));
    }
    return out;
  }, [wedding]);

  /* 해당 구간의 열린 슬롯을 가져옵니다 */
  useEffect(() => {
    let alive = true;
    const from = candidates[0];
    const to = candidates[candidates.length - 1];

    if (!dbReady) {
      const map: Record<string, Record<string, Slot[]>> = {};
      for (const v of vendors) {
        map[v.id] = {};
        for (const d of candidates) {
          const s = demoSlots(v.id, d);
          if (s.length) map[v.id][d] = s;
        }
      }
      setSlotMap(map);
      return;
    }

    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("vendor_slots")
        .select("vendor_id, date, slot")
        .eq("is_open", true)
        .gte("date", from)
        .lte("date", to);
      if (!alive) return;
      const map: Record<string, Record<string, Slot[]>> = {};
      for (const r of (data ?? []) as { vendor_id: string; date: string; slot: Slot }[]) {
        map[r.vendor_id] ??= {};
        map[r.vendor_id][r.date] ??= [];
        map[r.vendor_id][r.date].push(r.slot);
      }
      setSlotMap(map);
    })();

    return () => { alive = false; };
  }, [candidates, dbReady, vendors]);

  /* 날짜별로 하나라도 열려 있는가 / 그 날짜에 가능한 시간대 */
  const slotsOn = (d: string): Slot[] => {
    const set = new Set<Slot>();
    for (const v of vendors) for (const s of slotMap[v.id]?.[d] ?? []) set.add(s);
    return ["am", "pm"].filter((s) => set.has(s as Slot)) as Slot[];
  };
  const vendorOpen = (vendorId: string): boolean => {
    if (!date) return true;
    const s = slotMap[vendorId]?.[date] ?? [];
    return slot ? s.includes(slot) : s.length > 0;
  };

  /* 첫 번째로 열린 날짜를 자동 선택 */
  useEffect(() => {
    if (!Object.keys(slotMap).length) return;
    if (date && candidates.includes(date) && slotsOn(date).length) return;
    const next = candidates.find((d) => slotsOn(d).length) ?? null;
    setDate(next);
    setSlot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotMap, candidates]);

  /* 시간대 자동 선택 */
  useEffect(() => {
    if (!date) return;
    const avail = slotsOn(date);
    if (slot && avail.includes(slot)) return;
    setSlot(avail.includes("pm") ? "pm" : avail[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, slotMap]);

  /* 날짜가 바뀌면 안 되는 업체는 해제하고, 비어 있는 업종은 가능한 곳으로 채웁니다 */
  useEffect(() => {
    if (!date || !Object.keys(slotMap).length) return;
    setPicked((p) => {
      const n = { ...p };
      for (const c of CATEGORIES) {
        if (n[c] && !vendorOpen(n[c]!)) n[c] = null;
        if (!n[c]) {
          const first = vendors.find((v) => v.category === c && vendorOpen(v.id));
          if (first) n[c] = first.id;
        }
      }
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, slot, slotMap]);

  const byCat = (c: Category) => {
    const list = vendors.filter((v) => v.category === c);
    if (sort === "low") return [...list].sort((a, b) => a.base_price - b.base_price);
    if (sort === "high") return [...list].sort((a, b) => b.base_price - a.base_price);
    if (sort === "rate") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  };
  const vendorById = (id: string | null) => vendors.find((v) => v.id === id) ?? null;

  /* 필수 추가금은 항상 켜둡니다 */
  useEffect(() => {
    setChecked((prev) => {
      const next = { ...prev };
      for (const c of CATEGORIES) {
        const v = vendorById(picked[c]);
        if (!v) continue;
        for (const a of v.addons) if (!(a.id in next)) next[a.id] = a.required;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  /* 계산 */
  const calc = useMemo(() => {
    let baseTotal = 0, addonTotal = 0, chosen = 0;
    const lines: { label: string; amount: number }[] = [];
    for (const c of CATEGORIES) {
      const v = vendorById(picked[c]);
      if (!v) continue;
      chosen++;
      baseTotal += v.base_price;
      lines.push({ label: `${CATEGORY_LABEL[c]} · ${v.name}`, amount: v.base_price });
      for (const a of v.addons) if (checked[a.id] || a.required) addonTotal += a.amount;
    }
    const bundle = bundleDiscount(chosen);
    const dd = dateDiscount(date, slot);
    return {
      baseTotal, addonTotal, bundle, dd, chosen, lines,
      total: Math.max(0, baseTotal + addonTotal - bundle - dd.total),
    };
  }, [picked, checked, date, slot, vendors]);

  const ready = calc.chosen > 0 && !!date && !!slot;

  async function save() {
    if (!ready) return;
    if (!dbReady) {
      setErr("Supabase 환경변수가 아직 설정되지 않아 저장할 수 없습니다. 배포 설정에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 를 넣어주세요.");
      return;
    }
    setSaving(true); setErr(null);
    try {
      const supabase = createClient();
      const { data: q, error: qe } = await supabase
        .from("quotes")
        .insert({
          wedding_date: wedding, shoot_date: date, shoot_slot: slot,
          base_total: calc.baseTotal, addon_total: calc.addonTotal,
          bundle_discount: calc.bundle, date_discount: calc.dd.total,
          total: calc.total, guaranteed: true,
        })
        .select("id, code")
        .single();
      if (qe || !q) throw qe ?? new Error("저장 실패");

      const items = CATEGORIES.flatMap((c) => {
        const v = vendorById(picked[c]);
        if (!v) return [];
        return [{
          quote_id: q.id, vendor_id: v.id, category: c, base_price: v.base_price,
          selected_addons: v.addons
            .filter((a) => checked[a.id] || a.required)
            .map((a) => ({ id: a.id, name: a.name, amount: a.amount, required: a.required })),
        }];
      });
      const { error: ie } = await supabase.from("quote_items").insert(items);
      if (ie) throw ie;

      router.push(`/quotes/${q.code}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "저장 중 문제가 생겼습니다.");
      setSaving(false);
    }
  }

  return (
    <div className="wrap gut">
      <div className="cols">
        <div>
          {/* 1 */}
          <div className="step">
            <div className="step-head"><span className="step-no">1</span><h2 className="st">예식일</h2></div>
            <p className="hint">날짜를 넣으면 업종별 권장 시기가 역산되고, 촬영 가능 구간이 열립니다.</p>
            <div className="inset" style={{ maxWidth: 220 }}>
              <input type="date" value={wedding} onChange={(e) => e.target.value && setWedding(e.target.value)} />
            </div>
          </div>

          {/* 2 */}
          <div className="step">
            <div className="step-head"><span className="step-no">2</span><h2 className="st">촬영 날짜</h2></div>
            <p className="hint">업체가 열어둔 날짜만 표시됩니다. 평일 · 비수기 · 첫 타임은 할인이 붙습니다.</p>
            <div className="inset">
              <div className="dates">
                {candidates.map((d) => {
                  const open = slotsOn(d).length > 0;
                  const save = dateDiscount(d, null).total;
                  const dt = parseYMD(d);
                  return (
                    <button key={d} type="button" className="dcard" disabled={!open}
                      aria-pressed={date === d} onClick={() => { setDate(d); setSlot(null); }}>
                      <span className="d-day">{dt.getMonth() + 1}/{dt.getDate()}</span>
                      <span className="d-dow">{DOW[dt.getDay()]}요일</span>
                      {open
                        ? (save > 0
                            ? <span className="d-save">−{manwon(save)}원</span>
                            : <span className="d-dow">정가</span>)
                        : <span className="d-none">예약 마감</span>}
                    </button>
                  );
                })}
              </div>
              <div className="slots">
                {(["am", "pm"] as Slot[]).map((s) => {
                  const avail = date ? slotsOn(date).includes(s) : false;
                  return (
                    <button key={s} type="button" className="slot" disabled={!avail}
                      aria-pressed={slot === s} onClick={() => setSlot(s)}>
                      {s === "am" ? "오전 09:00" : "오후 14:00"}
                      {avail ? (s === "am" ? "  첫 타임 −10만" : "") : "  마감"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 */}
          <div className="step">
            <div className="step-head"><span className="step-no">3</span><h2 className="st">업체 선택</h2></div>
            <p className="hint">선택한 날짜에 예약 가능한 업체입니다. 2곳 이상 묶으면 번들 할인이 적용됩니다.</p>
            <div className="inset">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>정렬</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="업체 정렬">
                  <option value="rec">추천순</option>
                  <option value="low">낮은 가격순</option>
                  <option value="high">높은 가격순</option>
                  <option value="rate">평점순</option>
                </select>
              </div>

              {CATEGORIES.map((c) => {
                const list = byCat(c);
                const openN = list.filter((v) => vendorOpen(v.id)).length;
                return (
                  <div className="vgroup" key={c}>
                    <div className="vbar">
                      <span className="vlabel">{CATEGORY_LABEL[c]}</span>
                      <span className="vcount">예약 가능 {openN}곳 / 전체 {list.length}곳</span>
                    </div>
                    <div className="vlist">
                      {list.map((v) => {
                        const ok = vendorOpen(v.id);
                        const on = picked[c] === v.id;
                        return (
                          <div key={v.id} className={`vcard${on ? " on" : ""}${ok ? "" : " closed"}`}>
                            <button type="button" className="vsel" disabled={!ok}
                              onClick={() => setPicked((p) => ({ ...p, [c]: on ? null : v.id }))}>
                              <div className="vthumb" style={{ backgroundImage: photo(v.slug, c) }}>
                                <div className="tagline">
                                  <span className={`chip${ok ? " g" : ""}`}>{ok ? "예약 가능" : "이 날짜 마감"}</span>
                                  {on && <span className="chip a">선택됨</span>}
                                </div>
                              </div>
                              <div className="vbody">
                                <span className="v-name">{v.name}</span>
                                <span className="v-sub">{v.area} · {v.tags.join(" · ")}</span>
                                <span className="v-rate">
                                  <span className="stars">{stars(v.rating)}</span>
                                  {Number(v.rating).toFixed(1)}{" "}
                                  <span style={{ color: "var(--faint)" }}>({v.review_count})</span>
                                </span>
                                <span className="v-price">{manwon(v.base_price)}원 <small>기본가</small></span>
                              </div>
                            </button>
                            <button type="button" className="heart" aria-pressed={!!fav[v.id]}
                              aria-label={`${v.name} 찜하기`}
                              onClick={() => setFav((f) => ({ ...f, [v.id]: !f[v.id] }))}>♥</button>
                            <div className="vfoot">
                              <Link className="vmore" href={`/vendors/${v.slug}`}>상세보기</Link>
                              <span className="vstate">{ok ? (on ? "견적에 포함됨" : "선택 안 함") : "다른 날짜 확인"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 */}
          <div className="step">
            <div className="step-head"><span className="step-no">4</span><h2 className="st">추가금</h2></div>
            <p className="hint">업체가 입점할 때 선언한 항목 전부입니다. 여기 없는 금액은 청구되지 않습니다.</p>
            <div className="inset">
              {calc.chosen === 0 && <p className="hint" style={{ margin: 0 }}>업체를 먼저 선택하세요.</p>}
              {CATEGORIES.map((c) => {
                const v = vendorById(picked[c]);
                if (!v) return null;
                return (
                  <div className="addon-grp" key={c}>
                    <h4>{CATEGORY_LABEL[c]} · {v.name}</h4>
                    {v.addons.map((a) => (
                      <label className="addon" key={a.id}>
                        <input type="checkbox" disabled={a.required}
                          checked={a.required || !!checked[a.id]}
                          onChange={(e) => setChecked((p) => ({ ...p, [a.id]: e.target.checked }))} />
                        <span className="a-name">{a.name}</span>
                        {a.required && <span className="a-req">필수</span>}
                        <span className="a-amt">+{won(a.amount)}원</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 견적서 */}
        <aside className="quote">
          <div className="qbox">
            <div className="qhead"><h2>내 스드메 견적서</h2><span className="seal">보증 대상</span></div>
            <div className="qmeta">
              {date
                ? `${date.replace(/-/g, ".")} (${DOW[parseYMD(date).getDay()]}) ${slot === "am" ? "09:00" : slot === "pm" ? "14:00" : "시간 미정"}`
                : "날짜를 선택하세요"}
            </div>
            <div className="qbody">
              {calc.chosen === 0
                ? <div className="qrow"><span className="n">선택한 업체가 없습니다</span></div>
                : <>
                    {calc.lines.map((l) => (
                      <div className="qrow" key={l.label}>
                        <span className="n">{l.label}</span><span className="v">{won(l.amount)}</span>
                      </div>
                    ))}
                    <div className="qrow sub"><span className="n">기본가 합계</span><span className="v">{won(calc.baseTotal)}</span></div>
                    <div className="qrow"><span className="n">선언된 추가금</span><span className="v">+{won(calc.addonTotal)}</span></div>
                    {calc.bundle > 0 && (
                      <div className="qrow minus">
                        <span className="n">번들 할인 ({calc.chosen}개 업종)</span><span className="v">−{won(calc.bundle)}</span>
                      </div>
                    )}
                    {calc.dd.lines.map((l) => (
                      <div className="qrow minus" key={l.label}>
                        <span className="n">{l.label}</span><span className="v">−{won(l.amount)}</span>
                      </div>
                    ))}
                  </>}
            </div>
            <div className="qtotal">
              <div className="lab">확정 총액</div>
              <div className="num">{won(calc.total)}<small>원</small></div>
            </div>
            <div className="guarantee">
              {ready
                ? <><b>선언되지 않은 추가금은 0원입니다.</b><br />발생하면 저희가 부담합니다. 위 {won(calc.total)}원이 이 조합 · 이 날짜의 확정 금액입니다.</>
                : <>날짜와 업체가 모두 정해져야 보증이 발급됩니다.<br />시간대에 따라 추가금과 할인이 달라지기 때문입니다.</>}
            </div>
            <div className="qcta">
              <button className="solid" disabled={!ready || saving} onClick={save}>
                {saving ? "발급 중…" : "이 금액으로 보증서 받기"}
              </button>
              <Link className="ghost" href="/guarantee">보증 범위 확인</Link>
            </div>
          </div>
          {err && <div className="msg err">{err}</div>}
          <p className="qnote">
            업체명 · 가격 · 평점 · 예약 가능 여부는 시연용 가상 데이터입니다. 실제 결제나
            보증금 지급은 이루어지지 않습니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
