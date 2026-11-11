"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "견적 받기" },
  { href: "/timeline", label: "준비 타임라인" },
  { href: "/guarantee", label: "보증 범위" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="gnb">
      <div className="wrap gut in">
        <Link href="/" className="brand">
          <span className="n">
            스드메의 <em>문단속</em>
          </span>
          <span className="tg hide-s">총액 보증제</span>
        </Link>
        <nav className="menu">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href ? "on" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="spacer" />
        <span className="badge-demo hide-s">DEMO</span>
        <Link href="/partner" className="ghost hide-s">
          업체 입점
        </Link>
        <Link href="/claims/new" className="solid">
          보증 신청
        </Link>
      </div>
    </header>
  );
}
