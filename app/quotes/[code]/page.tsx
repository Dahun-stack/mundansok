import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type Category } from "@/lib/types";
import { DOW, GUARANTEE_CAP, parseYMD, won } from "@/lib/pricing";

export const revalidate = 0;

interface Item {
  category: Category;
  base_price: number;
  selected_addons: { name: string; amount: number; required: boolean }[];
  vendors: { name: string; slug: string } | null;
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!isConfigured()) notFound();

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes").select("*").eq("code", code.toUpperCase()).single();
  if (!quote) notFound();

  const { data: items } = await supabase
    .from("quote_items")
    .select("category, base_price, selected_addons, vendors(name, slug)")
    .eq("quote_id", quote.id);

  const list = (items ?? []) as unknown as Item[];
  const d = quote.shoot_date ? parseYMD(quote.shoot_date) : null;

  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">홈 · 보증서 {code.toUpperCase()}</div>
          <h1>총액 보증서</h1>
          <p>
            아래 금액이 이 조합 · 이 날짜의 확정 금액입니다. 여기에 없는 명목으로
            청구된 금액은 저희가 부담합니다.
          </p>
        </div>
      </div>

      <div className="wrap gut" style={{ paddingTop: 26, maxWidth: 760 }}>
        <div className="qbox">
          <div className="qhead">
            <h2>보증서 {code.toUpperCase()}</h2>
            <span className="seal">보증 적용</span>
          </div>
          <div className="qmeta">
            예식일 {quote.wedding_date ?? "—"} · 촬영{" "}
            {quote.shoot_date
              ? `${quote.shoot_date.replace(/-/g, ".")} (${DOW[d!.getDay()]}) ${quote.shoot_slot === "am" ? "09:00" : "14:00"}`
              : "—"}
          </div>

          <div className="qbody">
            {list.map((it, i) => (
              <div key={i}>
                <div className="qrow">
                  <span className="n">
                    {CATEGORY_LABEL[it.category]} · {it.vendors?.name ?? "—"}
                  </span>
                  <span className="v">{won(it.base_price)}</span>
                </div>
                {it.selected_addons?.map((a, j) => (
                  <div className="qrow" key={j} style={{ paddingLeft: 12, fontSize: 12.5 }}>
                    <span className="n">
                      ↳ {a.name}{a.required ? " (필수)" : ""}
                    </span>
                    <span className="v">+{won(a.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="qrow sub"><span className="n">기본가 합계</span><span className="v">{won(quote.base_total)}</span></div>
            <div className="qrow"><span className="n">선언된 추가금</span><span className="v">+{won(quote.addon_total)}</span></div>
            {quote.bundle_discount > 0 && (
              <div className="qrow minus"><span className="n">번들 할인</span><span className="v">−{won(quote.bundle_discount)}</span></div>
            )}
            {quote.date_discount > 0 && (
              <div className="qrow minus"><span className="n">날짜 할인</span><span className="v">−{won(quote.date_discount)}</span></div>
            )}
          </div>

          <div className="qtotal">
            <div className="lab">확정 총액</div>
            <div className="num">{won(quote.total)}<small>원</small></div>
          </div>

          <div className="guarantee">
            <b>선언되지 않은 추가금은 0원입니다.</b><br />
            위 목록에 없는 명목으로 청구된 금액은 건당 {won(GUARANTEE_CAP)}원 한도로
            저희가 부담합니다. 고객님이 선택하신 항목의 기록은 이 보증서에 그대로
            남아 있으며, 그 기록이 증거가 됩니다.
          </div>

          <div className="qcta">
            <Link className="solid" href="/claims/new">추가금을 청구받으셨나요?</Link>
            <Link className="ghost" href="/guarantee">보증 범위 확인</Link>
          </div>
        </div>

        <p className="qnote">
          이 주소를 아는 사람은 누구나 이 보증서를 열 수 있습니다. 수업용 시연본이며
          실제 보증금 지급은 이루어지지 않습니다.
        </p>
      </div>
    </main>
  );
}
