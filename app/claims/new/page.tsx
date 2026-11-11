import { getVendors, isConfigured } from "@/lib/data";
import ClaimForm from "./ClaimForm";

export const revalidate = 0;
export const metadata = { title: "보증 신청 — 스드메의 문단속" };

export default async function NewClaimPage() {
  const vendors = await getVendors();
  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">홈 · 보증 신청</div>
          <h1>선언되지 않은 금액을 청구받으셨나요</h1>
          <p>
            업체와 다투실 필요 없습니다. 청구받은 항목의 이름과 금액만 적어주세요.
            그 항목이 계약 전에 선언된 것인지는 <b>저희 기록이 판단합니다.</b>
          </p>
        </div>
      </div>
      <div className="wrap gut" style={{ paddingTop: 26, maxWidth: 760 }}>
        <ClaimForm vendors={vendors} dbReady={isConfigured()} />
      </div>
    </main>
  );
}
