"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/types";
import { won } from "@/lib/pricing";

interface Row { name: string; amount: string; required: boolean }

const DB_READY = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PartnerPage() {
  const [category, setCategory] = useState<Category>("studio");
  const [business, setBusiness] = useState("");
  const [area, setArea] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [base, setBase] = useState("");
  const [rows, setRows] = useState<Row[]>([{ name: "", amount: "", required: false }]);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const num = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;
  const declared = rows.filter((r) => r.name.trim() && num(r.amount) > 0);
  const requiredSum = declared.filter((r) => r.required).reduce((s, r) => s + num(r.amount), 0);
  const maxSum = declared.reduce((s, r) => s + num(r.amount), 0);
  const canSubmit = business.trim() && num(base) > 0 && agreed && !sending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true); setErr(null);

    if (!DB_READY) {
      setErr("Supabase 환경변수가 아직 설정되지 않아 접수할 수 없습니다.");
      setSending(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.from("partner_applications").insert({
        business_name: business.trim(), category, area: area.trim() || null,
        contact_name: contact.trim() || null, contact_phone: phone.trim() || null,
        contact_email: email.trim() || null, base_price: num(base),
        declared_addons: declared.map((r) => ({
          name: r.name.trim(), amount: num(r.amount), required: r.required,
        })),
        agreed_guarantee: agreed,
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "접수 중 문제가 생겼습니다.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <main className="page">
        <div className="wrap gut" style={{ paddingTop: 40, maxWidth: 680 }}>
          <div className="card">
            <h3 className="sec">입점 신청이 접수되었습니다</h3>
            <p className="lead">
              선언하신 추가금 {declared.length}건을 그대로 기록했습니다. 승인되면 이
              목록이 고객 화면에 그대로 공개되고, <b>이 목록에 없는 금액은 청구하실 수
              없습니다.</b>
            </p>
            <Link className="solid" href="/">홈으로</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">홈 · 업체 입점</div>
          <h1>전속 계약을 요구하지 않습니다</h1>
          <p>
            플래너를 끊으실 필요도, 전체 일정을 넘기실 필요도 없습니다.
            <b> 비어 있는 날짜만</b> 열어주시면 됩니다. 대신 조건이 하나 있습니다 —
            받으실 수 있는 금액을 전부 미리 적어주셔야 합니다.
          </p>
        </div>
      </div>

      <div className="wrap gut" style={{ paddingTop: 26, maxWidth: 820 }}>
        <form className="card" onSubmit={submit}>
          <h3 className="sec" style={{ fontSize: 16 }}>업체 정보</h3>
          <div className="fgrid" style={{ marginTop: 12 }}>
            <label className="fld">
              <span>상호</span>
              <input type="text" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="무이스튜디오" />
            </label>
            <label className="fld">
              <span>업종</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
                style={{ width: "100%", fontSize: 15, padding: "10px 12px" }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </label>
            <label className="fld">
              <span>지역</span>
              <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="서울 강남구 논현동" />
            </label>
            <label className="fld">
              <span>기본가 (원)</span>
              <input type="text" inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value)} placeholder="1800000" />
            </label>
            <label className="fld">
              <span>담당자</span>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
            <label className="fld">
              <span>연락처</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </label>
            <label className="fld">
              <span>이메일</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <h3 className="sec" style={{ fontSize: 16, marginTop: 30 }}>선언할 추가금</h3>
          <p className="lead" style={{ marginBottom: 14 }}>
            헬퍼비, 피팅비, 원본 파일, 작가 지정처럼 <b>현장에서 추가로 받으실 수 있는
            금액을 전부</b> 적어주세요. 어차피 받으시는 것은 「필수」로 체크하시면
            고객 화면에서 총액에 처음부터 포함됩니다.
          </p>

          {rows.map((r, i) => (
            <div className="rowline" key={i}>
              <input type="text" value={r.name} placeholder="항목 이름 (예: 헬퍼비)"
                onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <input type="text" inputMode="numeric" className="amt" value={r.amount} placeholder="150000"
                onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={r.required} style={{ width: 15, height: 15, accentColor: "var(--accent)" }}
                  onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} />
                필수
              </label>
              <button type="button" className="ghost" aria-label="이 행 삭제"
                onClick={() => setRows((p) => p.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="ghost"
            onClick={() => setRows((p) => [...p, { name: "", amount: "", required: false }])}>
            + 항목 추가
          </button>

          {declared.length > 0 && num(base) > 0 && (
            <div className="callout" style={{ marginTop: 20 }}>
              고객 화면에는 이렇게 보입니다 —{" "}
              <b className="mono">
                최소 {won(num(base) + requiredSum)}원 ~ 최대 {won(num(base) + maxSum)}원
              </b>
              . 이 범위를 벗어난 청구는 플랫폼이 고객에게 대신 지급하고, 그 절반을
              업체에 구상합니다.
            </div>
          )}

          <label style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 24, fontSize: 13.5, cursor: "pointer" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 3, flex: "none", accentColor: "var(--accent)" }} />
            <span>
              위에 선언하지 않은 명목으로 고객에게 비용을 청구하지 않겠습니다. 선언되지
              않은 금액이 청구된 경우 플랫폼이 고객에게 먼저 보상하고, 보상액의 50%를
              당사에 구상하는 데 동의합니다. <b>(총액 보증 약관 동의)</b>
            </span>
          </label>

          {err && <div className="msg err">{err}</div>}

          <button className="solid" type="submit" disabled={!canSubmit}
            style={{ width: "100%", padding: 12, marginTop: 18 }}>
            {sending ? "접수 중…" : "입점 신청"}
          </button>
          <p className="qnote">
            수업용 시연본입니다. 접수하셔도 실제 계약이나 금전적 책임이 발생하지
            않습니다.
          </p>
        </form>
      </div>
    </main>
  );
}
