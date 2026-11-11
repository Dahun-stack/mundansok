"use client";

import { useMemo, useState } from "react";
import { addMonths, parseYMD, ymd } from "@/lib/pricing";

const PLAN = [
  { m: -12, t: "예식장 확정", why: "모든 일정의 기준점. 인기 홀은 1년 전 마감", key: true },
  { m: -12, t: "본식 스냅 · 본식 헤어메이크업 예약", why: "예식 당일 시간을 점유하는 업종이라 가장 먼저 마감된다", key: true },
  { m: -9, t: "신혼여행 항공권", why: "비행편이 보통 12개월 전에 열린다", key: false },
  { m: -8, t: "혼주 메이크업 · 사회자", why: "역시 당일 시간을 빼야 하는 품목", key: false },
  { m: -7, t: "상견례", why: "구성이 대략 정해진 뒤가 이야기하기 수월하다", key: false },
  { m: -6, t: "맞춤 예복", why: "제작에 두 달. 촬영용 슈트를 무료로 빌려주는 곳이 많다", key: false },
  { m: -5, t: "스튜디오 촬영", why: "보정 2~3개월 + 청첩장 제작을 역산한 마감", key: true },
  { m: -3, t: "러브스냅 · 서브스냅 판단", why: "이쯤이면 무엇이 정말 필요한지 보인다", key: false },
  { m: -2, t: "드레스 확정 · 혼주 한복 · 본식 부케", why: "피팅을 거쳐 결정", key: true },
  { m: -1, t: "청첩장 인쇄 · 최종 점검", why: "모바일 청첩장은 2~3일이면 나온다", key: false },
];

export default function TimelinePage() {
  const [wedding, setWedding] = useState("2027-10-16");
  const [done, setDone] = useState<Record<number, boolean>>({});

  const rows = useMemo(() => {
    const w = parseYMD(wedding);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return PLAN.map((p, i) => {
      const d = addMonths(w, p.m);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      return { ...p, i, date: ymd(d), days, urgent: days >= 0 && days <= 30, past: days < 0 };
    });
  }, [wedding]);

  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">홈 · 준비 타임라인</div>
          <h1>예식일만 넣으면 순서가 정해집니다</h1>
          <p>
            웨딩플래너가 실제로 파는 것은 할인이 아니라 순서입니다. 무엇을 언제
            예약해야 하는지 몰라서 급하게 잡으면 비용이 올라갑니다.
          </p>
        </div>
      </div>

      <div className="wrap gut" style={{ paddingTop: 26 }}>
        <div style={{ maxWidth: 220 }}>
          <input type="date" value={wedding} onChange={(e) => e.target.value && setWedding(e.target.value)} />
        </div>

        <div className="tlwrap">
          {rows.map((r) => (
            <div key={r.i} className={`tlrow${r.key ? " key" : ""}${r.past ? " past" : ""}`}>
              <span className="tl-d">D{r.m}개월</span>
              <span className="tl-date">{r.date.replace(/-/g, ".")}</span>
              <span className="tl-what">
                <span className="tl-task">
                  {r.t}
                  {r.urgent && <span className="tl-urgent"> · D-{r.days}</span>}
                </span>
                <span className="tl-why">{r.why}</span>
              </span>
              <input type="checkbox" className="tl-chk" aria-label={`${r.t} 완료`}
                checked={!!done[r.i]}
                onChange={(e) => setDone((p) => ({ ...p, [r.i]: e.target.checked }))} />
            </div>
          ))}
        </div>

        <div className="callout">
          이 기능은 <b>입점 업체가 한 곳도 없어도 작동합니다.</b> 서비스 초기에
          사용자를 모으는 수단이자, 업체 영업에 쓸 수요 근거가 됩니다.
        </div>
      </div>
    </main>
  );
}
