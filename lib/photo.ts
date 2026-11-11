/**
 * 업체 이미지 생성기.
 *
 * 실제 업체 사진은 저작권이 업체에 있으므로, 입점 업체가 직접 올리기 전까지는
 * 코드로 생성한 그래픽을 씁니다. 업체 slug 로 해시를 돌려 색·구도·크롭이
 * 업체마다 다르게 나오고, 같은 업체는 언제 열어도 같은 이미지가 나옵니다.
 */

type Kind = "studio" | "dress" | "makeup" | "hero";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const PAL: Record<Kind, [string, string, string][]> = {
  studio: [
    ["#D8C4B4", "#6B5248", "#FBF2E8"],
    ["#C2B2AE", "#53424A", "#F6EDEA"],
    ["#D9C7BD", "#7A5A4E", "#FFF6EC"],
  ],
  dress: [
    ["#F0E2E7", "#9C7B8B", "#FFFBFC"],
    ["#E7DCE4", "#7E6679", "#FDF8FB"],
    ["#F3E6E2", "#A3817C", "#FFF9F6"],
  ],
  makeup: [
    ["#EBCFC3", "#8C5A57", "#FFF1EA"],
    ["#E3C9CB", "#7A4B55", "#FFF0F1"],
    ["#EFD6C2", "#95664A", "#FFF4E8"],
  ],
  hero: [["#7A3C56", "#1E1118", "#E9C083"]],
};

function motif(kind: Kind, h: number): string {
  const o = (h >> 3) % 3;
  if (kind === "studio") {
    const ax = 108 + o * 56;
    return (
      `<path d="M${ax} 300 V132 a62 62 0 0 1 124 0 V300Z" fill="#fff" opacity=".20"/>` +
      `<path d="M${ax + 62} 74 V300" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>` +
      `<path d="M${ax} 186 H${ax + 124}" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>` +
      `<path d="M${ax} 132 L${ax - 86} 300 H${ax + 206} L${ax + 124} 132Z" fill="#fff" opacity=".09"/>` +
      `<ellipse cx="${ax + 40}" cy="292" rx="140" ry="16" fill="#000" opacity=".16"/>`
    );
  }
  if (kind === "dress") {
    const cx = 148 + o * 48;
    return (
      `<path d="M58 72 H342" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>` +
      `<path d="M${cx} 72 v18" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>` +
      `<path d="M${cx} 90 c-16 6 -24 20 -22 40 l-6 28 c-34 30 -54 78 -58 126 h172 c-6 -50 -26 -96 -60 -126 l-6 -28 c2 -20 -6 -34 -20 -40Z" fill="#fff" opacity=".26"/>` +
      `<path d="M${cx - 34} 186 c10 40 10 70 4 98 M${cx + 30} 186 c-8 40 -8 70 -2 98" stroke="#fff" stroke-opacity=".22" stroke-width="2" fill="none"/>` +
      `<circle cx="${cx + 108}" cy="120" r="46" fill="#fff" opacity=".10"/>`
    );
  }
  if (kind === "makeup") {
    return (
      `<circle cx="${118 + o * 32}" cy="150" r="78" fill="#fff" opacity=".20"/>` +
      `<circle cx="${236 + o * 20}" cy="196" r="58" fill="#fff" opacity=".14"/>` +
      `<rect x="${188 + o * 16}" y="62" width="16" height="118" rx="8" fill="#fff" opacity=".24" transform="rotate(22 198 120)"/>` +
      `<rect x="${250 + o * 12}" y="80" width="12" height="96" rx="6" fill="#fff" opacity=".18" transform="rotate(-14 258 128)"/>` +
      `<ellipse cx="200" cy="288" rx="170" ry="20" fill="#000" opacity=".14"/>`
    );
  }
  return (
    `<path d="M118 300 V148 a82 82 0 0 1 164 0 V300" fill="none" stroke="#fff" stroke-opacity=".26" stroke-width="12"/>` +
    `<circle cx="128" cy="150" r="17" fill="#fff" opacity=".22"/><circle cx="156" cy="118" r="12" fill="#fff" opacity=".18"/>` +
    `<circle cx="272" cy="152" r="14" fill="#fff" opacity=".20"/><circle cx="246" cy="116" r="10" fill="#fff" opacity=".16"/>` +
    `<circle cx="314" cy="72" r="40" fill="#E9C083" opacity=".30"/>` +
    `<ellipse cx="200" cy="294" rx="180" ry="18" fill="#000" opacity=".22"/>`
  );
}

/** CSS background-image 에 바로 넣을 수 있는 url('data:…') 문자열 */
export function photo(seed: string, kind: Kind): string {
  const h = hash(`${seed}|${kind}`);
  const list = PAL[kind] ?? PAL.hero;
  const p = list[h % list.length];
  const a = ((h >> 5) % 40) - 20;
  const lx = (22 + ((h >> 9) % 40)) / 100;
  const sc = 1 + ((h >> 13) % 6) / 10;
  const fc = (h >> 17) % 4;
  const tx = (1 - sc) * 200 + (((h >> 19) % 60) - 30);
  const ty = (1 - sc) * 150 + (((h >> 23) % 40) - 20);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${a} .5 .5)">` +
    `<stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>` +
    `<radialGradient id="l" cx="${lx}" cy="0.18" r="0.85">` +
    `<stop offset="0" stop-color="${p[2]}" stop-opacity=".55"/><stop offset="1" stop-color="${p[2]}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="v" cx="0.5" cy="0.48" r="0.72">` +
    `<stop offset="0.48" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".44"/></radialGradient>` +
    `<filter id="b" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="17"/></filter>` +
    `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter>` +
    `</defs><rect width="400" height="300" fill="url(#g)"/>` +
    `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc.toFixed(2)})">${motif(kind, h)}</g>` +
    `<rect width="400" height="300" fill="url(#l)"/>` +
    `<ellipse cx="${fc < 2 ? 12 : 388}" cy="${fc % 2 ? 10 : 290}" rx="165" ry="120" fill="#1A1014" opacity=".34" filter="url(#b)"/>` +
    `<rect width="400" height="300" fill="url(#v)"/>` +
    `<rect width="400" height="300" filter="url(#n)" opacity=".15"/></svg>`;

  return `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}')`;
}
