import Link from "next/link";
import { getVendors, isConfigured } from "@/lib/data";
import { photo } from "@/lib/photo";
import QuoteBuilder from "./components/QuoteBuilder";
import { REVIEWS } from "@/lib/reviews";

export const revalidate = 0;

export default async function Home() {
  const vendors = await getVendors();
  const dbReady = isConfigured();

  return (
    <main className="page">
      <section className="hero">
        <div className="art" style={{ backgroundImage: photo("mundansok-hero", "hero") }} />
        <div className="scrim" />
        <div className="wrap gut">
          <div className="in">
            <span className="eyebrow">선언되지 않은 추가금 0원 보증</span>
            <h1>견적은 모두가 준다.<br />책임은 우리가 진다.</h1>
            <p className="sub">
              날짜를 고르면 추가금과 할인이 반영된 총액이 그 자리에서 확정됩니다.
              그리고 그 숫자를 저희가 책임집니다.
            </p>
            <div className="vow">
              <b>선언되지 않은 추가금은 0원입니다.</b> 발생하면 저희가 부담합니다.
              <span>
                업체는 입점할 때 발생 가능한 추가금을 전부 등록합니다. 거기 없는
                금액은 청구되지 않습니다.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="wrap gut in">
          <div className="c"><div className="k">누적 보증 발급</div><div className="v">1,284<small>건</small></div></div>
          <div className="c"><div className="k">평균 절감액</div><div className="v">61<small>만원</small></div></div>
          <div className="c"><div className="k">입점 업체</div><div className="v">{vendors.length}<small>곳</small></div></div>
          <div className="c"><div className="k">미고지 추가금 보상</div><div className="v">100<small>%</small></div></div>
        </div>
      </section>

      <QuoteBuilder vendors={vendors} dbReady={dbReady} />

      <section className="band">
        <div className="wrap gut in">
          <h3 className="sec">보증서를 받은 분들</h3>
          <p className="lead">실제 결제액이 견적과 달랐을 때 어떻게 처리됐는지에 대한 후기입니다.</p>
          <div className="revs">
            {REVIEWS.slice(0, 3).map((r) => (
              <div className="rev" key={r.nm + r.dt}>
                <div className="who">
                  <span className="av" style={{ background: r.c }}>{r.nm.charAt(0)}</span>
                  <span>
                    <span className="nm">{r.nm}</span> <span className="dt">· {r.dt}</span>
                    <br /><span className="stars">{"★".repeat(r.st)}{"☆".repeat(5 - r.st)}</span>
                  </span>
                </div>
                <div className="tx">{r.tx}</div>
                <div className="saved">{r.saved}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap gut" style={{ marginTop: 38 }}>
        <h3 className="sec">자주 묻는 질문</h3>
        <p className="lead">보증의 범위와 한계에 대한 질문이 가장 많습니다.</p>

        <details className="faq">
          <summary>업체와 직접 계약하면 더 싸지 않나요?</summary>
          <div className="ans">
            가격은 같을 수 있습니다. 다른 것은 <b>보증</b>입니다. 저희를 거치지 않은
            계약은 미고지 추가금이 나와도 보상 대상이 아닙니다. 저희가 파는 것은
            소개가 아니라 보증입니다.
          </div>
        </details>
        <details className="faq">
          <summary>인기 날짜도 예약할 수 있나요?</summary>
          <div className="ans">
            성수기 주말은 저희가 다루는 영역이 아닙니다. 저희는 <b>비수기 · 평일
            슬롯</b>만 받습니다. 비어 있는 날짜를 낮은 가격에 내놓는 것 자체가 수요
            분산 장치입니다.
          </div>
        </details>
        <details className="faq">
          <summary>드레스는 사진으로 고를 수 없다던데요?</summary>
          <div className="ans">
            맞습니다. 그래서 저희도 사진으로 결정시키지 않습니다. <b>가격과 날짜로
            세 곳을 추려서 보러 가게 하는 것</b>이 저희 역할입니다. 직방이 집 사진만으로
            계약시키지 않는 것과 같습니다.
          </div>
        </details>
        <details className="faq">
          <summary>플래너가 해주던 나머지 일은 누가 하나요?</summary>
          <div className="ans">
            플래너가 실제로 파는 것은 할인이 아니라 <b>순서</b>입니다. 예식일을 넣으면
            12개월 역산 체크리스트가 생성되고 마감 임박 항목이 표시됩니다.{" "}
            <Link href="/timeline" style={{ color: "var(--accent)", textDecoration: "underline" }}>준비 타임라인</Link>에서 확인하실 수 있습니다.
          </div>
        </details>
        <details className="faq">
          <summary>보증 한도는 얼마인가요?</summary>
          <div className="ans">
            건당 <b>50만 원</b>이며 월 총액 상한이 별도로 있습니다. 보상액의 50%는
            해당 업체에 구상하고, 미고지가 반복되는 업체는 입점이 제한됩니다.{" "}
            <Link href="/guarantee" style={{ color: "var(--accent)", textDecoration: "underline" }}>보증 범위</Link>에 자세한 기준이 있습니다.
          </div>
        </details>
      </section>
    </main>
  );
}
