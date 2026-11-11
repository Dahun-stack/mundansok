import Link from "next/link";

export const metadata = { title: "보증 범위 — 스드메의 문단속" };

export default function GuaranteePage() {
  return (
    <main className="page">
      <div className="phead">
        <div className="wrap gut in">
          <div className="crumb">홈 · 보증 범위</div>
          <h1>무엇을 보증하고, 무엇을 보증하지 않는가</h1>
          <p>보증은 범위가 명확할 때만 성립합니다. 기준은 하나입니다 — 계약 전에 고지되었는가.</p>
        </div>
      </div>

      <div className="wrap gut" style={{ paddingTop: 4 }}>
        <div className="gcols">
          <div className="gcard yes">
            <h4>보증합니다</h4>
            <ul>
              <li>업체가 계약 전에 선언하지 않은 항목을 사후에 청구한 경우</li>
              <li>앱에 등록되지 않은 명목의 추가 비용</li>
              <li>선언된 금액보다 높게 청구된 차액</li>
            </ul>
          </div>
          <div className="gcard no">
            <h4>보증하지 않습니다</h4>
            <ul>
              <li>고객이 앱에서 직접 선택한 업그레이드</li>
              <li>선언된 항목을 고객이 현장에서 추가 선택한 경우</li>
              <li>단순 변심 · 파혼 · 예식 연기</li>
              <li>천재지변 등 불가항력</li>
            </ul>
          </div>
        </div>

        <div className="scroll">
          <table className="gtable">
            <tbody>
              <tr>
                <th>구분 기준</th>
                <td>계약 전 고지 여부. 앱에 등록되지 않았거나 고객이 선택하지 않은 비용은 보증 대상입니다.</td>
              </tr>
              <tr>
                <th>입증 수단</th>
                <td><b>앱의 옵션 체크 기록</b>이 증거가 됩니다. 고객이 무엇을 선택했는지가 시점과 함께 남습니다.</td>
              </tr>
              <tr>
                <th>한도</th>
                <td className="mono">건당 50만 원 · 월 총액 상한 별도</td>
              </tr>
              <tr>
                <th>책임 분담</th>
                <td>보상액의 <span className="mono">50%</span>를 해당 업체에 구상합니다. 미고지가 반복되는 업체는 입점이 제한됩니다.</td>
              </tr>
              <tr>
                <th>분쟁 처리</th>
                <td>고객의 계약 위반에 따른 위약금은 업체 규정을 따르며, 플랫폼은 중재만 담당합니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="callout">
          보증은 <b>우리를 통해 계약한 건에만</b> 적용됩니다. 업체와 직접 계약한
          금액은 아무도 책임지지 않습니다. 소개를 파는 것이 아니라 보증을 팔기
          때문에, 이 구조는 우회되지 않습니다.
        </div>

        <div className="callout warn">
          <b>이 사이트는 수업용 시연본입니다.</b> 실제 보증금 지급은 이루어지지
          않습니다. 보증 신청은 접수 화면이 어떻게 작동하는지 보여주기 위한
          것이며, 접수된 내용으로 금전적 책임이 발생하지 않습니다.
        </div>

        <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="solid" href="/claims/new">보증 신청하기</Link>
          <Link className="ghost" href="/">견적 받으러 가기</Link>
        </div>
      </div>
    </main>
  );
}
