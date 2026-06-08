# 그래플레이 비즈 — UI 시안 (Shell)

체육관 운영자를 위한 B2B 비즈니스 교육 플랫폼 **그래플레이 비즈**의 **프론트엔드 껍데기(디자인 시안)** 입니다.
기능(API·DB·결제·인증)은 아직 연결돼 있지 않으며, 화면 구조와 흐름 확인용입니다.

> 기획 배경은 [`grapplay-biz-separation-and-sales.md`](./grapplay-biz-separation-and-sales.md),
> [`biz-server-migration.md`](./biz-server-migration.md) 문서 참고.

## 기술 스택

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 4
- React Router 6

## 실행 방법

```bash
npm install
npm run dev      # http://localhost:5173
```

기타 스크립트:

```bash
npm run build    # 타입체크 + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 화면 (라우트)

| 화면 | 경로 |
|------|------|
| 랜딩 | `/academy` |
| 강의 둘러보기 | `/academy/library` |
| 강의 상세 (롱스크롤 판매 랜딩) | `/academy/courses/:id` |
| 요금제 | `/academy/pricing` |
| 내 강의 | `/academy/my` |
| 전문가 디렉터리 | `/academy/experts` |
| 전문가 리뷰 | `/academy/experts/:expertId/reviews` |
| 전문가 대시보드 (허브) | `/academy-expert/dashboard` |
| 강의 에디터 | `/academy-expert/courses/new`, `/academy-expert/courses/:id/edit` |

> 강의 에디터는 **대시보드 → 내 강의 탭**에서 진입합니다.

## 디자인

- 테마: amber/gold 액센트 + stone-50 배경 (메인 그래플레이와 시각적 구분)
- 단품판매(`is_subscription_excluded`) 요소는 indigo 액센트로 구분
- 카테고리 4종: 마케팅 · 상권분석 · 연금 · 체육관 운영

## 구조

```
src/
├─ App.tsx                       # 라우팅
├─ components/
│  ├─ AcademyLayout.tsx          # 공통 nav / 모바일탭 / footer
│  └─ CourseCard.tsx             # 강의 카드
├─ data/mock.ts                  # 목업 데이터 (실제 API 연동 자리)
└─ pages/
   ├─ AcademyLanding.tsx
   ├─ AcademyLibrary.tsx
   ├─ AcademyCourseDetail.tsx
   ├─ AcademyPricing.tsx
   ├─ AcademyMyPage.tsx
   ├─ AcademyExperts.tsx
   ├─ AcademyExpertReviews.tsx
   └─ academy-expert/
      ├─ AcademyExpertDashboard.tsx
      └─ AcademyCourseEditor.tsx
```

## 참고 (껍데기인 부분)

- 모든 데이터는 `src/data/mock.ts` 하드코딩
- 버튼(구매/구독/로그인/저장 등)은 동작하지 않음 — 결제·인증·정산은 기존 그래플레이 인프라 재사용 예정
- 에디터의 블록 추가/순서변경/토글은 로컬 state로만 동작 (저장 미연결)
