"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABEL, type VendorWithAddons } from "@/lib/types";
import { GUARANTEE_CAP, VENDOR_RECOURSE_RATE, won } from "@/lib/pricing";

const norm = (s: string) => s.trim().toLowerCase();

export default function ClaimForm({
  vendors, dbReady,
}: {
  vendors: VendorWithAddons[];
  dbReady: boolean;
}) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ declared: boolean; payout: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const vendor = vendors.find((v) => v.id === vendorId) ?? null;

  /* 화면에서 미리 판정해 보여줍니다. 접수 시에는 DB 트리거가 같은 판정을 다시 합니다. */
  const verdict = useMemo(() => {
    if (!vendor || !name.trim()) return null;
    const hit = vendor.addons.find((a) => norm(a.name) === norm(name));
    return { declared: Boolean(hit), addon: hit ?? null };
  }, [vendor, name]);

  const amt = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const payout = Math.min(amt, GUARANTEE_CAP);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor || !name.trim() || amt <= 0) return;
    setSending(true); setErr(null);

    if (!dbReady) {
      // DB가 없을 때도 판정 결과는 보여줍니다 (접수만 안 될 뿐)
      setResult({ declared: Boolean(verdict?.declared), payout });
      setSending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guarantee_claims")
        .insert({
          vendor_id: vendor.id,
          claimed_name: name.trim(),
          claimed_amount: amt,
          evidence_note: note.trim() || null,
        })
        .select("was_declared")
        .single();
      if (error) throw error;
      setResult({ declared: Boolean(data?.was_declared), payout });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "접수 중 문제가 생겼습니다.");
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return result.declared ? (
      <div className="card">
        <h3 className="sec">선언된 항목입니다</h3>
        <p className="lead">
          「{name}」는 이 업체가 계약 전에 등록해 둔 항목입니다. 금액이 공개돼 있었으므로
          보증 대상이 아닙니다.
        </p>
        <div className="callout">
          다만 <b>선언된 금액보다 높게 청구</b>되었다면 그 차액은 보증 대상입니다.
          영수증 금액이 등록된 금액과 다르면 다시 접수해 주세요.
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="ghost" onClick={() => setResult(null)}>다시 작성</button>
          <Link className="ghost" href="/guarantee">보증 범위 보기</Link>
        </div>
      </div>
    ) : (
      <div className="card">
        <h3 className="sec">선언되지 않은 항목입니다 — 보증 대상</h3>
        <p className="lead">
          「{name}」는 이 업체가 등록한 추가금 목록에 없습니다. 접수되었습니다.
        </p>
        <table className="mtable">
          <tbody>
            <tr><td>청구받은 금액</td><td className="r">{won(amt)}원</td></tr>
            <tr><td>보증 한도 (건당)</td><td className="r">{won(GUARANTEE_CAP)}원</td></tr>
            <tr><td><b>보상 예정액</b></td><td className="r"><b>{won(result.payout)}원</b></td></tr>
            <tr>
              <td>업체 구상 ({VENDOR_RECOURSE_RATE * 100}%)</td>
              <td className="r">{won(Math.round(result.payout * VENDOR_RECOURSE_RATE))}원</td>
            </tr>
          </tbody>
        </table>
        <div className="callout warn">
          <b>수업용 시연본입니다.</b> 실제 보상금은 지급되지 않습니다. 접수 화면이
          어떻게 작동하는지 보여주기 위한 것입니다.
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="ghost" onClick={() => setResult(null)}>다른 건 접수</button>
          <Link className="ghost" href="/">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="fgrid">
        <label className="fld">
          <span>업체</span>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} style={{ width: "100%", fontSize: 15, padding: "10px 12px" }}>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {CATEGORY_LABEL[v.category]} · {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fld">
          <span>청구받은 금액 (원)</span>
          <input type="text" inputMode="numeric" value={amount} placeholder="150000"
            onChange={(e) => setAmount(e.target.value)} />
        </label>
      </div>

      <label className="fld" style={{ marginTop: 14 }}>
        <span>청구받은 항목의 이름</span>
        <input type="text" value={name} placeholder="예: 보정 추가비"
          onChange={(e) => setName(e.target.value)} />
      </label>

      {verdict && (
        <div className={`msg ${verdict.declared ? "err" : "ok"}`}>
          {verdict.declared ? (
            <>이 항목은 <b>선언되어 있습니다</b> — 등록 금액 {won(verdict.addon!.amount)}원. 같은 금액이라면 보증 대상이 아닙니다.</>
          ) : (
            <>이 항목은 <b>선언 목록에 없습니다</b> — 보증 대상입니다.</>
          )}
        </div>
      )}

      {vendor && (
        <details className="faq" style={{ marginTop: 14 }}>
          <summary>이 업체가 선언한 항목 전체 ({vendor.addons.length}건)</summary>
          <div className="ans">
            {vendor.addons.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span>{a.name}{a.required ? " (필수)" : ""}</span>
                <span className="mono">+{won(a.amount)}원</span>
              </div>
            ))}
            {vendor.addons.length === 0 && <span>선언된 추가금이 없습니다.</span>}
          </div>
        </details>
      )}

      <label className="fld" style={{ marginTop: 14 }}>
        <span>상황 설명 (선택)</span>
        <textarea value={note} placeholder="언제, 어디서, 어떤 설명과 함께 청구받으셨는지 적어주세요."
          onChange={(e) => setNote(e.target.value)} />
      </label>

      {err && <div className="msg err">{err}</div>}

      <button className="solid" type="submit" style={{ width: "100%", padding: 12, marginTop: 16 }}
        disabled={sending || !name.trim() || amt <= 0}>
        {sending ? "접수 중…" : "보증 신청 접수"}
      </button>
      <p className="qnote">
        접수하시면 저희가 업체에 직접 확인합니다. 고객님이 업체와 연락하실 필요는
        없습니다. 수업용 시연본이라 실제 보상금은 지급되지 않습니다.
      </p>
    </form>
  );
}
