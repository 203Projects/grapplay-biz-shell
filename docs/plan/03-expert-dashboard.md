# Phase 3 — 지도자(전문가) 대시보드 + 강의 에디터 CRUD

> 선행: [00-db-schema.md](./00-db-schema.md), [01-auth.md](./01-auth.md) · 후행: 05(정산이 매출 집계 재사용)

## 목표

기존 `academy-expert` 대시보드와 강의 에디터를 **실제 Supabase CRUD**에 연결한다.
하드코딩 `CURRENT_EXPERT_ID='e1'`를 로그인 세션의 `expert_id`로 교체하고, 강의 생성/수정/삭제,
리뷰 숨김/PDF 카운트, 매출 표시를 실데이터로 만든다. 페이지는 Phase 01에서 이미
`ProtectedRoute requireExpert`로 보호됨.

## 산출물 (새 파일)

### `src/lib/expertApi.ts` — 인증된 전문가 mutation 모듈
- `createCourse(input)` → `supabase.from('courses').insert(row)`. `expert_id`는 `current_expert_id()`와 일치해야 RLS 통과.
- `updateCourse(id, patch)` → `update().eq('id', id)`.
- `deleteCourse(id)` → `delete().eq('id', id)`.
- `setReviewHidden(reviewId, hidden)` → `course_reviews.update({ hidden })`.
- `incrementPdfSent(reviewId)` → 현재 값 +1 update(또는 RPC).
- `getExpertRevenue(expertId)` → `orders`에서 `item_type='course'` & 소유 강의 & `status='paid'` 합계.
  월별 집계는 `created_at`/`paid_at` 기준 그룹핑. (Phase 04 전엔 0/빈 배열 반환.)
- 모든 함수는 `{ data, error }` 반환 후 호출부에서 토스트/에러 처리.

```ts
export async function createCourse(input: CourseInput) {
  return supabase!.from('courses').insert({
    id: input.id ?? `c_${crypto.randomUUID().slice(0, 8)}`,
    expert_id: input.expertId,
    title: input.title, subtitle: input.subtitle, category: input.category,
    price: input.price, cover: input.cover, thumb_emoji: input.thumbEmoji,
    curriculum: input.curriculum,          // jsonb
    what_you_learn: input.whatYouLearn,     // jsonb
    use_landing_page: input.useLandingPage,
    detail_blocks: input.detailBlocks,      // jsonb
    review_reward_pdf_url: input.rewardPdfUrl,
  }).select().single()
}
```

## 수정 파일

### `src/pages/academy-expert/AcademyExpertDashboard.tsx`
- `import { CURRENT_EXPERT_ID } from '../../data/mock'` 제거 → `const { profile } = useAuth(); const expertId = profile!.expert_id!`.
- 12~13줄 `getExpert(CURRENT_EXPERT_ID)`/`getExpertStats(...)` → `expertId` 사용.
- **경로 버그 수정**: 47줄 `to="/expert/courses/new"` → `/academy-expert/courses/new`
  (라우트는 `/academy-expert/*` 인데 링크가 `/expert/*`로 어긋나 있음). 편집/미리보기 링크도 동일 점검.
- **리뷰 관리 탭**: "PDF 보내기" → `incrementPdfSent(reviewId)`, "숨기기/숨김 해제" → `setReviewHidden(reviewId, !hidden)`. 성공 후 캐시 무효화 + 재조회.
- **수익 분석 탭 + 통계**: 58줄 하드코딩 `₩12,480,000` → `getExpertRevenue` 결과. 월별 바 차트도 실데이터(없으면 "데이터 없음").

### `src/pages/academy-expert/AcademyCourseEditor.tsx`
- 편집 모드: 목업 `getCourse` → `useBizData().getCourse(id)` 또는 Supabase fetch로 폼 초기화.
- "저장"/"강의 등록" 버튼(약 77, 303줄, 현재 무동작):
  - 폼 상태 → row 구성(price는 int, curriculum/detailBlocks를 jsonb로).
  - 신규면 `createCourse`, 편집이면 `updateCourse` 호출 → 성공 시 `navigate('/academy-expert/dashboard')`.
  - 실패 시 인라인 에러.
- 이미지/PDF 업로드 placeholder → `supabase.storage.from('course-assets').upload(path, file)` 후
  반환 경로/URL을 `cover`·`detail_blocks` 이미지·`review_reward_pdf_url`에 저장.
  (신규 비공개 버킷 `course-assets` 생성 필요 — 코드 외 설정 참고.)
- 신규 `courses.id`: text PK 유지 → `c_<짧은 uuid>` 생성.

### `src/lib/useBizData.ts` — 캐시 무효화 추가
- 현재 모듈 레벨 1회 캐시 → CRUD/리뷰 mutation 후 stale.
- `export function invalidateBizData()` 추가: `cache=null; inflight=null`.
- 훅에 `refetch()` 노출(상태 강제 재로드). mutation 성공 콜백에서 `invalidateBizData()` + `refetch()`.

## 코드 외 설정 (Supabase 대시보드)

- **Storage** 버킷 생성: `course-assets`(이미지), `course-pdfs`(리워드/자료 PDF) — 비공개 권장.
  업로드는 전문가 본인만, 다운로드는 정책으로 제어(이미지 cover는 공개 버킷로 두는 것도 가능).
- 전문가 계정은 [00 문서]의 "전문가 연결" 절차로 미리 승격되어 있어야 함.

## 검증

1. 전문가 계정 로그인 → 대시보드에 **본인** 강의만 표시(`expertId` 반영).
2. "새 강의 만들기" → 폼 작성 → 저장 → `courses`에 행 생성(MCP 확인) → 목록에 즉시 반영(refetch).
3. 강의 편집 → 가격/커리큘럼 수정 → 저장 → DB 반영 확인.
4. 다른 전문가의 강의 id로 update 시도 → RLS로 거부(소유자 정책 동작).
5. 리뷰 "숨기기" → `course_reviews.hidden=true`, "PDF 보내기" → `pdf_sent_count` 증가.
6. 수익 분석: 결제 데이터 없으면 0/빈 차트, Phase 04 후 실매출 반영.
7. 강의 등록 링크가 `/academy-expert/courses/new`로 정상 이동(경로 버그 수정 확인).
8. `npm run build` 통과.
