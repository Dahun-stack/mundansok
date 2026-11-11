import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "스드메의 문단속 — 총액 보증제",
  description:
    "견적은 모두가 준다. 책임은 우리가 진다. 선언되지 않은 추가금은 0원입니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap"
        />
      </head>
      <body>
        <div className="util">
          <div className="wrap gut in">
            <span className="mark">테크노경영학 1팀 · 수업용 시연본</span>
            <span className="hide-s">고객센터 평일 10:00–18:00</span>
            <a href="/partner">업체 입점 문의</a>
          </div>
        </div>

        <Nav />

        {children}

        <footer className="site">
          <div className="wrap gut in">
            <div className="fn">스드메의 문단속</div>
            <div className="fl">
              <a href="/guarantee">보증 약관</a>
              <a href="/timeline">준비 타임라인</a>
              <a href="/partner">업체 입점</a>
              <a href="/claims/new">보증 신청</a>
            </div>
            <div className="fb">
              한양대학교 테크노경영학 1팀 수업용 시연본입니다. 실제 사업자가 아니며,
              표시된 업체명 · 가격 · 평점 · 후기 · 예약 가능 여부는 모두 가상
              데이터입니다.
              <br />
              이미지는 코드로 생성한 그래픽이며 실제 업체의 사진이 아닙니다. 이
              사이트에서는 실제 결제나 보증금 지급이 이루어지지 않습니다.
              <br />
              김희종 · 김범수 · 박기영 · 정다훈 · 윤재혁 · 송시현
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
