# 작업 9 — 관리자 영상 업로드 권한 + 강의 PDF 업로드 + 할인가 설정

**작업일: 2026-06-10**

관리자가 다른 지도자 강의에 **영상을 못 올리던 문제**, 강의 만들 때 **PDF가 가짜(고정 파일명)였던 문제**,
강의에 **할인가(정가)를 설정할 수 없던 문제** 세 가지를 한 번에 수정.

---

## ① 관리자도 모든 지도자 영상 업로드 가능

### 원인 (RLS 아님)
영상 업로드는 코스 테이블이 아니라 **Vimeo 업로드 티켓 발급 엣지 함수**를 거친다.
그 함수가 `role === 'expert'` + 본인 `expert_id` 가 있는 사람만 통과시켜서,
`role='admin'`이고 `expert_id`가 `null`인 관리자는 403으로 막혔다.
(코스 INSERT/UPDATE RLS는 이미 `is_admin()`을 허용하고 있어 문제 없음 — 오직 엣지 함수만 막던 것.)

### 변경
- [supabase/functions/vimeo-create-upload/index.ts](../../supabase/functions/vimeo-create-upload/index.ts)
  — 권한 체크를 "전문가 **또는** 관리자"로 변경.
  ```ts
  const isExpert = profile?.role === 'expert' && !!profile?.expert_id
  const isAdmin = profile?.role === 'admin'
  if (!isExpert && !isAdmin) { /* 403 */ }
  ```
- **배포 완료**: `supabase functions deploy vimeo-create-upload` (프로젝트 `sjnmkmsdzuvywtaasvdn`).
  엣지 함수라 프론트 배포와 무관하게 즉시 적용됨.

---

## ② 강의 리뷰 리워드 PDF — 실제 업로드로 교체

### 원인
"PDF 업로드" 버튼이 실제 파일을 올리지 않고 **`'리뷰_리워드_가이드.pdf'` 고정 문자열만** 넣고 있었다
(관리자 무관, 모든 사용자 공통 스텁). 그래서 항상 같은(고정) PDF처럼 보였다.

### 변경 — [src/pages/academy-expert/AcademyCourseEditor.tsx](../../src/pages/academy-expert/AcademyCourseEditor.tsx)
- 전자책 편집기와 동일하게 **실제 파일 업로드**(`handlePdfUpload`): `covers` 버킷의 `course-pdfs/`에 저장 → 공개 URL.
- PDF URL 직접 입력란, 제거 버튼, "업로드 중…" 표시 추가.
- `pdfName`(가짜 문자열) 상태 제거 → `pdfUrl` 상태로 교체.
- 편집 시 기존에 등록된 PDF도 불러오도록 타입/매핑 보강:
  - [src/data/mock.ts](../../src/data/mock.ts) `Course`에 `reviewRewardPdfUrl?` 추가
  - [src/lib/api.ts](../../src/lib/api.ts) `mapCourse`에서 `review_reward_pdf_url` 매핑

---

## ③ 강의 할인가(정가) 설정

### 원인
강의 할인가는 DB가 아니라 [src/data/mockMarketplace.ts](../../src/data/mockMarketplace.ts)의
**하드코딩 맵(`COURSE_META`)** 에서만 왔다 → 실제로 만든 강의는 할인 설정이 불가능했다.

### 변경
- **DB**: `courses.original_price integer` 컬럼 추가
  - 마이그레이션: [supabase/migrations/20260617000000_course_discount.sql](../../supabase/migrations/20260617000000_course_discount.sql)
  - **적용 완료** (`supabase db push`). null 또는 price 이하면 할인 없음(취소선 미표시).
- **저장 경로**: [src/lib/expertApi.ts](../../src/lib/expertApi.ts) `CourseInput`에 `originalPrice` 추가,
  `createCourse`/`updateCourse` 에서 `original_price` 매핑.
- **타입/매핑**: `Course.originalPrice` 추가([mock.ts](../../src/data/mock.ts)), `mapCourse`에서 `original_price` 읽기([api.ts](../../src/lib/api.ts)).
- **편집기 UI**: "가격" 섹션에 **정가(선택)** 입력란 + 할인율 미리보기.
- **표시(취소선·할인율)**: DB값 우선, 없으면 기존 mock 메타 폴백 (`course.originalPrice ?? meta.originalPrice`).
  - [src/components/CourseCard.tsx](../../src/components/CourseCard.tsx)
  - [src/components/PurchaseBar.tsx](../../src/components/PurchaseBar.tsx)
  - [src/pages/AcademyCourseDetail.tsx](../../src/pages/AcademyCourseDetail.tsx)

---

## 마이그레이션 적용 메모 (중요)
- 비즈 프로젝트(`sjnmkmsdzuvywtaasvdn`)의 원격 마이그레이션 **history 테이블이 비어 있었다**
  (그동안 대시보드 등으로 수동 적용해 온 것으로 보임). 그래서 `supabase db push`가 13개를 전부
  재적용하려 했음.
- 안전하게: 기존 12개는 `supabase migration repair --status applied`로 **"적용됨" 기록만 맞추고**
  (SQL 재실행 X), 새 마이그레이션 1개(`20260617000000_course_discount.sql`)만 실제 push.
- 이후부터는 `supabase db push`로 정상 관리 가능.

## 배포
- 엣지 함수(①)는 배포 완료 — 즉시 적용.
- 프론트(②③)는 `main` push로 Vercel 자동배포. (이 리포는 grapplay.com 계정 Vercel에 연결)

## 검증
- 관리자 계정으로 다른 지도자 강의 편집 → 영상 업로드 정상.
- 강의 편집기에서 PDF 파일 업로드 → 링크 생성·저장, 편집 재진입 시 유지.
- 정가 입력 후 저장 → 강의 카드/상세/구매바에 취소선·할인율 표시.
- `npm run build`·`tsc --noEmit` 통과.
