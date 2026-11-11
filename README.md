# 스드메의 문단속

총액 보증제 웨딩 플랫폼. 한양대학교 테크노경영학 1팀 (김희종 · 김범수 · 박기영 · 정다훈 · 윤재혁 · 송시현)

> **견적은 모두가 준다. 책임은 우리가 진다.**
> 선언되지 않은 추가금은 0원입니다. 발생하면 저희가 부담합니다.

---

## 올리는 순서 (처음 한 번)

### 1. GitHub에 올리기

GitHub에서 새 저장소(`mundansok`, Public, README 체크 **해제**)를 만든 뒤,
저장소 화면의 **uploading an existing file** 링크를 눌러 이 폴더 안의 내용을
**통째로 드래그**해서 올리면 됩니다.

> `node_modules` 와 `.next` 폴더는 올리지 마세요. 용량만 크고 필요 없습니다.
> (이 압축 파일에는 애초에 들어 있지 않습니다.)

### 2. Vercel에 배포하기

1. [vercel.com](https://vercel.com) → **Continue with GitHub** (별도 가입 없음)
2. **Add New → Project** → 방금 만든 `mundansok` 저장소 **Import**
3. 설정은 건드릴 필요 없습니다. **Deploy** 클릭
4. 1~2분 뒤 `https://mundansok.vercel.app` 같은 주소가 나옵니다

이 단계까지만 해도 사이트는 완전히 작동합니다. Supabase가 없으면 내장된 데모
데이터로 돌아갑니다. **견적 저장 · 보증 신청 접수 · 입점 신청만 안 됩니다.**

### 3. Supabase 붙이기

1. [supabase.com](https://supabase.com) → **New project**
   리전은 **Northeast Asia (Seoul)** 로 고르세요. 속도가 다릅니다.
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 전체를 붙여넣고 **Run**
3. 같은 자리에 `supabase/seed.sql` 전체를 붙여넣고 **Run**
4. 왼쪽 메뉴 **Settings → API** 에서 두 값을 복사합니다
   - `Project URL`
   - `anon` `public` 키 ← **`service_role` 키는 절대 쓰지 마세요**
5. Vercel 프로젝트 → **Settings → Environment Variables** 에 두 개를 추가합니다

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | 복사한 Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 복사한 anon public 키 |

6. **Deployments → 맨 위 배포 → ⋯ → Redeploy**

이제 견적 저장, 보증서 발급(`/quotes/XXXXXX`), 보증 신청, 업체 입점 신청이
전부 실제로 DB에 기록됩니다.

---

## 화면 구성

| 주소 | 하는 일 |
|---|---|
| `/` | 예식일 → 촬영 날짜 → 업체 → 추가금 → **확정 총액**. 「보증서 받기」를 누르면 DB에 저장되고 공유 가능한 주소가 나옵니다 |
| `/vendors/[slug]` | 업체 상세. **선언된 추가금 전부**와 최소~최대 결제액 범위를 공개합니다 |
| `/timeline` | 예식일 하나로 12개월 역산 체크리스트 생성. 입점 업체가 0곳이어도 작동합니다 |
| `/guarantee` | 보증하는 것 / 보증하지 않는 것, 한도, 책임 분담 기준 |
| `/claims/new` | **보증 신청.** 청구받은 항목 이름을 넣으면 그 자리에서 선언 여부를 판정합니다 |
| `/partner` | 업체 입점 신청. 받을 수 있는 금액을 전부 선언해야 접수됩니다 |
| `/quotes/[code]` | 발급된 보증서. 주소를 아는 사람은 누구나 열 수 있습니다 |

---

## 설계에서 봐야 할 것

**`vendor_addons` 테이블이 이 서비스의 전부입니다.**
업체가 입점할 때 등록한 추가금 목록이고, 여기 없는 명목으로 청구된 금액은
전부 보증 대상입니다. 이 판정을 사람이 하지 않습니다 — `supabase/schema.sql`의
`is_declared()` 함수와 `guarantee_claims` 트리거가 **접수되는 순간 DB 안에서**
판정하고 그 결과를 행에 박아둡니다.

그래서 세 가지가 동시에 해결됩니다.

- **입증 책임** — 고객이 앱에서 무엇을 체크했는지가 `quote_items.selected_addons`에
  시점과 함께 남습니다. 분쟁이 생기면 이 기록이 증거입니다.
- **이탈 방지** — 보증은 플랫폼을 거친 계약에만 성립합니다. 업체와 직접 계약하면
  보증할 근거 자체가 없습니다. 소개를 파는 게 아니라 보증을 팔기 때문입니다.
- **업체 리스크 관리** — 미고지가 반복되는 업체는 `vendors.status`를 `suspended`로
  바꾸면 노출에서 빠집니다.

**슬롯은 업체가 열어준 것만 받습니다.** `vendor_slots`에는 전체 캘린더가 아니라
업체가 개방한 날짜만 들어갑니다. 시드 데이터도 성수기 주말은 10%만 열고
비수기 평일은 88%를 여는 식으로 그 전제를 그대로 반영합니다.

---

## 로컬에서 돌려보기

```bash
npm install
cp .env.local.example .env.local   # Supabase 값을 넣으면 DB 연결, 비워두면 데모 데이터
npm run dev
```

http://localhost:3000

---

## 주의

이 사이트는 **수업용 시연본**입니다.

- 실제 사업자가 아니며 결제 · 보증금 지급이 이루어지지 않습니다
- 업체명 · 가격 · 평점 · 후기는 모두 가상 데이터입니다
- 이미지는 `lib/photo.ts`가 코드로 생성한 그래픽이며 실제 업체 사진이 아닙니다
- **실제 업체를 넣으려면 `/partner`를 통해 동의를 받은 뒤에만** 넣으세요.
  업체 사진은 저작권이 업체에 있으므로 업체가 직접 올리는 구조여야 합니다
