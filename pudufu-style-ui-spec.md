# 그래플레이 비즈 — pudufu 스타일 UI 개편 명세서

> **목적**: 비즈 사이트의 **메인 화면**과 **강의 상세 페이지**를 [pudufu.co.kr](https://pudufu.co.kr) 같은
> 밝은 마켓플레이스 UI로 개편하기 위한 디자인/구현 명세서.
> 이 문서만 보고 React로 그대로 구현할 수 있는 수준을 목표로 한다.
>
> 작성일: 2026-06-08 · 대상: `AcademyLanding`(메인), `AcademyCourseDetail`(강의 상세)
> 색상: **화이트 + 퍼플** · 마켓플레이스형 섹션은 **가짜 데이터 포함**

---

## 0. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 참고 사이트 | pudufu.co.kr (온라인 강의/전자책 마켓플레이스) |
| 핵심 변화 | 기존 amber/밝은 단순 레이아웃 → **카드·캐러셀·실시간 피드가 많은 마켓플레이스 레이아웃** |
| 색상 | 화이트 배경 + 퍼플 액센트 (그래플레이 패밀리 컬러) |
| 폰트 | 기존 Noto Sans KR 유지 |
| 대상 페이지 | 메인, 강의 상세 (2개) |
| 데이터 | 실데이터(`useBizData`) + 부족분은 가짜 데이터(◆)로 보강 |
| 범위 | **UI만**. 결제/로그인/저장 등 기능 동작은 이 문서 범위 아님 |

범례: **●** = 실제 DB 데이터(`useBizData`) · **◆** = 신규 가짜 데이터

---

## 1. 디자인 토큰 (화이트 + 퍼플)

| 토큰 | 값(HEX) | Tailwind | 용도 |
|---|---|---|---|
| 배경 기본 | `#FFFFFF` | `bg-white` | 페이지/카드 기본 |
| 배경 교대 | `#F8FAFC` | `bg-slate-50` | 섹션 번갈아 깔기 |
| 본문 글자 | `#0F172A` | `text-slate-900` | 제목·본문 |
| 보조 글자 | `#64748B` | `text-slate-500` | 설명·메타 |
| 흐린 글자 | `#94A3B8` | `text-slate-400` | 타임스탬프 등 |
| 액센트 그라데이션 | `#7C3AED → #A855F7` | `from-violet-600 to-purple-500` | CTA 버튼·로고·배너 |
| 액센트 단색 | `#7C3AED` | `text-violet-600` / `bg-violet-600` | 링크·활성탭·강조 |
| 액센트 연한 | `#F5F3FF` | `bg-violet-50` | 칩·활성 배경 |
| 별점 | `#F59E0B` | `text-amber-400` | ★ 전용 (액센트와 구분) |
| 테두리 | `#E2E8F0` | `border-slate-200` | 카드·구분선 |
| 무료 배지 | `#059669` | `text-emerald-600` | 가격 "무료" |
| 찜 하트(활성) | `#EC4899` | `text-pink-500` | 위시리스트 |

**규칙**
- 라운드: 카드 `rounded-2xl`, 칩/배지/하트버튼 `rounded-full`, 버튼·입력 `rounded-xl`.
- 그림자: 카드 hover 시 `shadow-lg shadow-slate-200/60`, 기본은 `border`만.
- 컨테이너 최대폭: `max-w-6xl`(섹션 본문), 캐러셀은 좌우 패딩만 두고 끝까지.
- **기존 amber/stone 톤은 전부 버리고** 위 토큰으로 교체. (`from-amber-400 to-orange-500` → `from-violet-600 to-purple-500`, `stone-*` → `slate-*`)
- 강의 카드 썸네일의 `course.cover` 그라데이션(코스별 색)은 **그대로 유지**(시각적 다양성). 액센트(버튼/링크)만 퍼플 통일.

---

## 2. 공용 컴포넌트 스펙

### 2.1 상단 네비게이션 (`AcademyLayout` 개편)
- 흰 배경 `sticky top-0`, 하단 `border-slate-200`, 살짝 blur.
- 좌측: **퍼플 "G" 로고 배지**(`from-violet-600 to-purple-500`) + "그래플레이 **비즈**"(비즈=`text-violet-600`).
- 가운데(데스크톱): 카테고리 메뉴 = **우리 4카테고리** 텍스트 링크 (마케팅·상권분석·연금·체육관 운영) → `/academy/library?cat=...`. (pudufu의 "전자책/강의/챌린지" 자리)
- 우측: 🔍 검색 아이콘(클릭 시 검색바 — 동작은 추후), "로그인", "시작하기"(퍼플 바탕 버튼).
- 활성 링크: `text-violet-600`, hover `bg-violet-50`.

### 2.2 CourseCard 개편 (pudufu 카드형) — 캐러셀/그리드 공통 재사용
구성(위→아래):
1. **썸네일** — `course.cover` 그라데이션 배경 + 가운데 `course.thumbEmoji`(큰 이모지). 16:10 비율.
   - 좌상단: 카테고리 칩(흰 배경 `bg-white/90`, `text-slate-700`).
   - 우상단: **찜 하트 버튼**(흰 동그라미 + 🤍/❤️ 토글, 로컬 state).
   - (선택 ◆) 좌상단 보조: `NEW` 또는 `할인 N%` 배지(퍼플).
2. **본문 패딩**:
   - 제목 `course.title` (2줄 말줄임, `font-bold`).
   - 메타 줄: ⭐`rating.toFixed(1)` · `구매 {studentCount.toLocaleString()}명` · `{lessonCount}강`.
   - 하단: 가격 `formatPrice(price)` (유료=`text-slate-900` 볼드, 무료=`text-emerald-600`).
     - (선택 ◆) 정가 취소선 + 할인가.
- 카드 hover: `-translate-y-0.5` + 그림자. 전체가 `/academy/courses/:id` 링크.

### 2.3 하단 고정 구매바 (신규 — 상세페이지 전용)
- 화면 하단 `fixed bottom-0`(모바일 하단탭 위), 흰 배경 + 상단 `border-slate-200` + 그림자.
- 좌측: 가격(`formatPrice`), (선택 ◆) 정가 취소선/할인율.
- 우측: **찜 버튼** + `무료 보기`(아웃라인) + **`구매하기`(퍼플 바탕, 가장 큼)**.
- 데스크톱에서도 동일하게 하단 고정(pudufu 방식). → **현재 상세페이지의 우측 sticky 사이드바는 제거**.

### 2.4 푸터
- pudufu처럼 **연한 회색 톤**(`bg-slate-50` or `bg-slate-900` 중 택1 — 본 스펙은 밝게 `bg-slate-50` + `border-t`).
- **사업자 정보 블록은 현행 그대로 유지** (상호명: 그래플레이 / 대표자: 이바름 / 사업자등록번호 111-39-34149 / 통신판매업 신고번호 / 주소 / 이메일 coach0179@naver.com / 전화 02-599-6315).
- 정책 링크: 공지사항 · 이용약관 · 환불정책 · 개인정보처리방침.

### 2.5 모바일 하단 탭
- 홈 / 강의 / 전문가 / 내 강의. 활성 = `text-violet-600`.

### 2.6 섹션 헤더(공통 패턴)
- 좌측 큰 제목(`text-2xl font-black`) + 한 줄 설명(`text-slate-500`), 우측 "전체 보기 →"(`text-violet-600`, 데스크톱만).
- 캐러셀 섹션은 우측에 좌/우 화살표 버튼(선택).

---

## 3. 메인 화면 (`AcademyLanding`) 섹션 — 위에서 아래로

> 마켓플레이스 느낌의 핵심 = **카드 캐러셀 반복 + 실시간 피드**.

### 3.1 히어로 ◆
- 가운데/좌측 정렬 인사 헤드라인: 예) **"체육관 경영, 오늘은 무엇을 배워볼까요?"**
- **프로모 배너 캐러셀** ◆ — 퍼플 그라데이션 배너 2~3장 좌우 슬라이드.
  - 배너 데이터: `{ title, subtitle, gradient }` (예: "무료 LIVE 특강", "AI로 회원관리 자동화").
  - 각 배너에 `신청하기`/`보러가기` CTA.
- 하단 신뢰 지표(선택 ◆): 누적 수강생 · 강의 수 · 평균 별점.

### 3.2 카테고리 퀵 그리드 ●
- 우리 4카테고리(`CATEGORIES`: 마케팅/상권분석/연금/체육관 운영) 아이콘 타일 4개.
- 타일: 이모지 + 이름 + 한 줄 설명, hover `border-violet-300`.

### 3.3 실시간 베스트 ● (가로 스크롤 캐러셀)
- 제목 "🔥 실시간 베스트".
- `courses`를 `studentCount` 내림차순 정렬 → CourseCard 가로 스크롤.

### 3.4 무료 베스트 ● (가로 스크롤 캐러셀)
- 제목 "무료 베스트".
- `courses.filter(c => c.price === 0)` (현재 c3·c6). CourseCard 재사용.

### 3.5 성공사례 ◆ (캐러셀)
- 제목 "수강생 성공사례".
- 카드: 인물 이니셜/이모지 아바타 + **헤드라인**(`"회원 3배 증가"`) + 역할(`"오픈 1년차 관장"`) + 연결 강의명.
- 데이터 ◆: `{ name, role, headline, courseId }` ×3~4. (강의명은 `getCourse(courseId).title`)

### 3.6 최신 강의 ● (그리드)
- 제목 "최신 강의".
- `courses` 그리드(2~3열) — CourseCard.

### 3.7 실시간 후기 ◆+● (마퀴/흐르는 띠)
- 제목 "실시간 후기".
- 좌→우로 천천히 흐르는 후기 카드 띠(무한 루프 애니메이션).
- 데이터: `courseReviews` ● + 가짜 보강 ◆. 표시: 마스킹 이름(`김○○`) + 별점(◆) + 강의명 + 1~2줄 후기.

### 3.8 실시간 구매 피드 ◆ (번호 리스트)
- 제목 "방금 이런 강의가 팔렸어요".
- 번호 1~15 리스트: **`○○○님 · {강의명} · N분 전`** (위로 스크롤되는 효과 선택).
- 데이터 ◆: `{ maskedName, courseId, minutesAgo }` ×15.

### 3.9 푸터 ●
- §2.4.

---

## 4. 강의 상세 (`AcademyCourseDetail`) 섹션 — 위에서 아래로

> pudufu의 롱스크롤 판매 랜딩 + **하단 고정 구매바**.

### 4.1 히어로
- 좌: 썸네일(`cover` 그라데이션 + `thumbEmoji` 큰 이모지 / 추후 실제 이미지 교체 자리).
- 우(또는 하단): 카테고리 배지 · `title` · 강사명(`getExpert(expertId).name` + 아바타) ·
  ⭐`rating`(`reviewCount`) · `구매 {studentCount}명` · **NEW 배지 ◆**.
- 가격 영역: (선택 ◆) `정가 취소선` + `할인 N%` + **최종가**(`formatPrice`). 무료면 "무료".
- 배경: 흰색 또는 아주 옅은 슬레이트. (pudufu는 밝음)

### 4.2 스티키 앵커 탭
- 상단 고정(`sticky`), 흰 배경 + 하단 보더. 탭: **소개 · 커리큘럼 · 강사소개 · 후기(N)**.
- 활성 탭: 퍼플 언더라인 + `text-violet-600`. 클릭 시 해당 섹션으로 스크롤(`scroll-mt`).

### 4.3 소개
- `summary` 본문.
- ◆ "강의 업데이트: 26.03.13" 같은 갱신일, "수강 기한: 평생/99일" 안내 칩.
- 마케팅 이미지 플레이스홀더 영역(추후 `detail_blocks` 연결 자리) — 큰 회색 박스 + 안내문.

### 4.4 커리큘럼
- `curriculum`(`{title, durationMin}[]`)을 **챕터로 묶어** 표시(예: "Chapter 1. 기초").
  - 구현 시: 단순히 1개 챕터로 묶거나, 인덱스 기준 가짜 챕터 분할 ◆.
- 일부 레슨에 **미리보기 배지 ◆**(앞 1~2개).
- 행: 번호 · 제목 · `{durationMin}분` · (미리보기면 ▶ 배지).

### 4.5 강사소개
- `getExpert(expertId)` 프로필: 아바타 + 이름 + 직함(`title`) + 소개(`bio`).
- ◆ 크리덴셜 불릿 ×3 (예: "누적 수강생 1,200명", "프랜차이즈 40개점 운영").

### 4.6 이런 걸 배워요 ●
- `whatYouLearn` 체크 그리드(현행 유지, 색만 퍼플 체크).

### 4.7 후기
- 별점(◆ 보강) + 페이지네이션(또는 더보기).
- `courseReviews`(별점 없음 → ◆ 별점값 부여) 표시: 마스킹 이름 · 날짜 · ★ · 본문(더보기 말줄임).
- 상단 요약: 평균 별점 + 총 후기 수.

### 4.8 강사의 다른 콘텐츠 ● (캐러셀)
- 같은 `expertId`의 다른 `courses`(`getCoursesByExpert(expertId)`에서 현재 강의 제외) → CourseCard 캐러셀.

### 4.9 ⚠️ 주의사항 ◆
- 환불정책/저작권/수강기한 안내 불릿 5개(표준 문구). 환불정책 링크.

### 4.10 푸터 ● + 하단 고정 구매바 (§2.3)
- 구매바는 **전 구간 고정**. 가격 + 무료보기 + 구매하기 + 찜.

---

## 5. 신규 가짜 데이터 정의 (구현 단계에서 추가)

구현 시 `src/data/mockMarketplace.ts`(신규) 또는 `mock.ts`에 추가. **이번 문서는 정의만.**

| 데이터 | 형태 | 개수 | 용도 |
|---|---|---|---|
| 프로모 배너 | `{ title, subtitle, gradient }` | 2~3 | 메인 히어로 §3.1 |
| 성공사례 | `{ name, role, headline, courseId }` | 3~4 | 메인 §3.5 |
| 실시간 구매 피드 | `{ maskedName, courseId, minutesAgo }` | 15 | 메인 §3.8 |
| 후기 별점 보강 | `courseId/reviewId → rating(1~5)` | 전체 | 메인 §3.7, 상세 §4.7 |
| 강사 크리덴셜 | `expertId → string[]` | 전문가별 3 | 상세 §4.5 |
| 강의 마케팅 메타 | `courseId → { isNew, discountPct?, originalPrice?, accessPeriod }` | 코스별 | 카드/상세 가격·배지 |

> 이름 마스킹 규칙: 성 + `○○`(예: "김○○"). 상대시간: "방금 전 / N분 전 / N시간 전".

---

## 6. 기존 코드/데이터 매핑 (재사용)

- **데이터 훅**: `src/lib/useBizData.ts` — `courses`, `experts`, `courseReviews`, `getExpert`, `getCourse`, `getCoursesByExpert` 그대로 사용.
- **타입**(`src/data/mock.ts`): `Course`(`id,title,subtitle,category,expertId,price,cover,thumbEmoji,lessonCount,durationMin,rating,reviewCount,studentCount,summary,curriculum,whatYouLearn`), `Expert`(`id,name,title,avatar,bio`) — 변경 없음.
- **유틸**: `formatPrice`(`mock.ts`) 재사용.
- **개편 대상 파일**(구현 단계):
  - `src/components/AcademyLayout.tsx` — 네비/푸터/색상.
  - `src/components/CourseCard.tsx` — 카드형 개편 + 찜 하트.
  - `src/pages/AcademyLanding.tsx` — 메인 섹션 전면 교체.
  - `src/pages/AcademyCourseDetail.tsx` — 상세 + 하단 구매바.
  - `src/index.css` / 토큰 — 색상 퍼플 전환.
- **신규**: `src/data/mockMarketplace.ts`(가짜 데이터), `src/components/CourseCarousel.tsx`(가로 스크롤 래퍼), `src/components/PurchaseBar.tsx`(하단 고정바) 등.

---

## 7. 구현 시 체크리스트 (다음 단계)

- [ ] 디자인 토큰 퍼플로 전환 (amber/stone → violet/slate)
- [ ] CourseCard 카드형 + 찜 하트
- [ ] 가로 스크롤 캐러셀 컴포넌트
- [ ] 메인 9개 섹션(§3) 구현, 가짜 데이터 연결
- [ ] 상세 10개 섹션(§4) + 스티키 앵커 탭 + 하단 고정 구매바
- [ ] 모바일 반응형(캐러셀 스와이프, 하단바 + 하단탭 겹침 처리)
- [ ] `npx tsc -b` 통과, `npm run dev`로 두 페이지 육안 확인

---

## 8. 범위 밖 (이 개편에 포함 안 함)

- 결제·로그인·강의 저장 등 **기능 동작**(여전히 버튼 UI만).
- 전문가 대시보드/에디터 화면(별도 작업 — "대시보드 실제 조작 기능" 마일스톤).
- 검색 실제 동작, 찜 목록 영속화.
