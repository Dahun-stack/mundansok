import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorBySlug, getVendors } from "@/lib/data";
import { photo } from "@/lib/photo";
import { CATEGORY_LABEL } from "@/lib/types";
import { manwon, stars, won } from "@/lib/pricing";
import { REVIEWS } from "@/lib/reviews";

export const revalidate = 0;

export async function generateStaticParams() {
  const vendors = await getVendors();
  return vendors.map((v) => ({ slug: v.slug }));
}

export default async function VendorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = await getVendorBySlug(slug);
  if (!v) notFound();

  const required = v.addons.filter((a) => a.required);
  const requiredSum = required.reduce((s, a) => s + a.amount, 0);
  const maxSum = v.addons.reduce((s, a) => s + a.amount, 0);
  const seed = v.slug.charCodeAt(0) % REVIEWS.length;

  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">
            <Link href="/">홈</Link> · {CATEGORY_LABEL[v.category]} · {v.name}
          </div>
          <h1>{v.name}</h1>
          <p>
            {v.area} · <span className="stars">{stars(v.rating)}</span>{" "}
            {Number(v.rating).toFixed(1)} ({v.review_count}개 후기)
          </p>
        </div>
      </div>

      <div className="wrap gut" style={{ paddingTop: 22 }}>
        <div className="vhero" style={{ backgroundImage: photo(v.slug, v.category) }} />
        <div className="gal">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ backgroundImage: photo(`${v.slug}-g${i}`, v.category) }} />
          ))}
        </div>

        <div className="cols" style={{ marginTop: 28 }}>
          <div>
            <h3 className="sec">소개</h3>
            <p className="lead">{v.description}</p>

            <h3 className="sec" style={{ marginTop: 28 }}>선언된 추가금 전체</h3>
            <p className="lead">
              이 목록이 이 업체가 청구할 수 있는 금액의 전부입니다. 여기 없는 명목으로
              청구된 금액은 저희가 부담합니다.
            </p>
            <div className="card">
              <table className="mtable">
                <tbody>
                  {v.addons.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.name}{" "}
                        {a.required && <span className="a-req">필수</span>}
                      </td>
                      <td className="r">+{won(a.amount)}원</td>
                    </tr>
                  ))}
                  {v.addons.length === 0 && (
                    <tr><td>선언된 추가금이 없습니다. 기본가가 곧 총액입니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="callout">
              <b>이 목록이 전부입니다.</b> 고객이 앱에서 무엇을 체크했는지가 시점과 함께
              기록되므로, 분쟁이 생기면 그 기록 자체가 증거가 됩니다. 보증은{" "}
              <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                저희를 통해 계약한 건
              </Link>
              에만 적용됩니다.
            </div>

            <h3 className="sec" style={{ marginTop: 32 }}>최근 후기</h3>
            <div className="revs">
              {[0, 1].map((k) => {
                const r = REVIEWS[(seed + k) % REVIEWS.length];
                return (
                  <div className="rev" key={k}>
                    <div className="who">
                      <span className="av" style={{ background: r.c }}>{r.nm.charAt(0)}</span>
                      <span>
                        <span className="nm">{r.nm}</span> <span className="dt">· {r.dt}</span>
                        <br /><span className="stars">{"★".repeat(r.st)}{"☆".repeat(5 - r.st)}</span>
                      </span>
                    </div>
                    <div className="tx">{r.tx}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="quote">
            <div className="qbox">
              <div className="qhead"><h2>가격 구조</h2><span className="seal">전부 공개</span></div>
              <div className="qbody">
                <div className="qrow"><span className="n">기본가</span><span className="v">{won(v.base_price)}</span></div>
                <div className="qrow"><span className="n">필수 추가금 {required.length}건</span><span className="v">+{won(requiredSum)}</span></div>
                <div className="qrow sub"><span className="n">최소 결제액</span><span className="v">{won(v.base_price + requiredSum)}</span></div>
                <div className="qrow"><span className="n">선택 추가금 전부 포함 시</span><span className="v">{won(v.base_price + maxSum)}</span></div>
              </div>
              <div className="qtotal">
                <div className="lab">최소 — 최대</div>
                <div className="num" style={{ fontSize: 20 }}>
                  {manwon(v.base_price + requiredSum)} – {manwon(v.base_price + maxSum)}<small>원</small>
                </div>
              </div>
              <div className="guarantee">
                이 범위를 벗어난 청구는 발생할 수 없습니다. <b>발생하면 저희가 부담합니다.</b>
              </div>
              <div className="qcta">
                <Link className="solid" href="/">날짜 골라서 견적 받기</Link>
                <Link className="ghost" href="/claims/new">추가금을 청구받으셨나요?</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
