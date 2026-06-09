# Phase 6 — 강의/전자책 판매·수강 분리 + 영상 플레이어 + 전자책 에디터

> 선행: [00](./00-db-schema.md), [03](./03-expert-dashboard.md) · 구현 중 사용자 요청으로 확장됨
> 상태: **구현 완료** (Phase 04 결제 연동만 대기)

## 목표 (최종)

pudufu 레퍼런스를 따라:
1. **판매(상세) 페이지**와 **수강/읽기 페이지를 분리**. 구매자는 마케팅 상세가 아니라 별도
   강의실/뷰어에서 콘텐츠를 본다.
2. 강의 상세 상단에 **영상(1강 미리보기 하이라이트)**, 우측에 **sticky 구매 카드**(배너 제거).
3. **지도자가 레슨별 영상 URL + 미리보기 공개 여부를 직접 설정**.
4. **전자책 에디터** 추가 + 전자책을 DB 기반으로 전환.

---

## 데이터 모델 변경

### 강의 (마이그레이션 불필요 — curriculum이 jsonb)
- `Course.curriculum` 항목: `{ title; durationMin; videoUrl?; preview? }` ([mock.ts](../../src/data/mock.ts)).
  - `videoUrl`: 레슨 영상(YouTube/Vimeo URL). `preview`: 구매 전 공개 여부.
- `Course`에 `useLandingPage?`, `detailBlocks?: DetailBlock[]` (상세페이지 블록).

### 전자책 (마이그레이션 필요)
- `supabase/migrations/20260611000000_ebook_landing.sql`:
  ```sql
  alter table ebooks add column if not exists use_landing_page boolean not null default false;
  alter table ebooks add column if not exists detail_blocks   jsonb   not null default '[]'::jsonb;
  ```
- 전자책을 목업 → **DB 기반 전환**: `api.ts`에 `mapEbook()` + `fetchBizData()`가 `ebooks` 조회,
  `useBizData().ebooks/getEbook/getEbooksByExpert`로 노출. 소비처(`AcademyEbooks`,
  `AcademyEbookDetail`, `AcademyLanding`, `AcademyMyPage`)는 모두 DB ebooks 사용(목업은 폴백).

---

## 페이지 구조 (강의/전자책 공통 패턴)

| 용도 | 강의 | 전자책 |
|---|---|---|
| 판매(마케팅) | `/courses/:id` | `/ebooks/:id` |
| 수강/읽기(구매자 전용) | **`/learn/:id`** | **`/read/:id`** |

- 수강/읽기 페이지는 `ProtectedRoute` + **수강 등록(enrollments) 확인**. 미등록자는 판매 페이지로 리다이렉트.

### 강의 상세 `/courses/:id` ([AcademyCourseDetail.tsx](../../src/pages/AcademyCourseDetail.tsx))
- **배너(히어로) 제거.** 레이아웃: `max-w-6xl` 2단 그리드 `[1fr_340px]`.
  - 좌측 컬럼: 카테고리 → **영상 플레이어(#video)** → (모바일) 제목·메타 → 앵커 탭(영상/상세/커리큘럼/강사/후기)
    → 상세(소개+`detailBlocks`) → 커리큘럼 → 강사 → 배워요 → 후기 → 관련 강의.
  - 우측 컬럼(데스크톱): **`PurchaseCard`** — 찜/공유, 가격, 구매하기/무료보기.
    `sticky top-20`으로 스크롤을 따라 내려옴(그리드 기본 `stretch`로 컬럼이 본문 높이만큼 늘어나야 동작 —
    `items-start` 쓰면 안 됨).
- **모바일**: 카드 숨김, 하단 고정 `PurchaseBar`(가격+구매). 데스크톱은 하단바 숨김.
- **영상 플레이어(LessonPlayer)**: 상세에선 **미리보기 하이라이트 1개만** 표시(이전/다음 없음).
  - 기본 = 첫 `preview` 레슨. 영상 있으면 임베드, 없으면 표지(그라데이션+이모지).
- **커리큘럼 미리보기 선택**: `preview` 레슨은 **"▶ 미리보기" 버튼**(클릭 시 상단 플레이어가 그 강으로 전환
  + #video로 스크롤, 현재 강 하이라이트). 미체크 레슨은 🔒.

### 강의실 `/learn/:id` ([AcademyCourseLearn.tsx](../../src/pages/AcademyCourseLearn.tsx))
- 다크 테마. 상단 영상(전체 잠금 해제) + **이전/다음 강의**.
- 탭: **내용 / 목차 / 공지**. 목차에서 강 클릭 → 영상 전환.
- 미등록자 → `/courses/:id` 리다이렉트.

### 전자책 상세 `/ebooks/:id` ([AcademyEbookDetail.tsx](../../src/pages/AcademyEbookDetail.tsx))
- 미리보기 PDF + 소개(블록) + 저자/핵심/후기. (배너형 히어로 유지 — 전자책은 그대로)
- 버튼 실동작: 구매자→"바로 읽기"(`/read/:id`), 무료→즉시 등록 후 읽기, 유료→체크아웃(Phase 04),
  미로그인→로그인. (기존 로컬 unlock 데모 제거)

### 전자책 뷰어 `/read/:id` ([AcademyEbookRead.tsx](../../src/pages/AcademyEbookRead.tsx))
- 다크 상단 바 + 전체 PDF iframe. 미등록자 → `/ebooks/:id` 리다이렉트.

---

## 지도자(에디터) 변경

### 강의 에디터 ([AcademyCourseEditor.tsx](../../src/pages/academy-expert/AcademyCourseEditor.tsx))
- 커리큘럼 레슨 = `{ title; videoUrl; preview }`.
  - 레슨마다 **영상 URL 입력** + **"미리보기로 공개" 체크박스**.
- 저장 시 `curriculum`에 `videoUrl`/`preview` 포함.

### 전자책 에디터 (신규) ([AcademyEbookEditor.tsx](../../src/pages/academy-expert/AcademyEbookEditor.tsx))
- 라우트 `/expert/ebooks/new`, `/expert/ebooks/:id/edit` (`ProtectedRoute requireExpert`).
- 필드: 제목/부제/표지(그라데이션·이모지)/가격·정가/쪽수/소개/**핵심 리스트**/**상세 블록**/PDF URL.
- 저자/avatar = 로그인 전문가에서 자동.

### 대시보드 ([AcademyExpertDashboard.tsx](../../src/pages/academy-expert/AcademyExpertDashboard.tsx))
- **"내 전자책" 탭** 추가 — 본인 전자책 목록 + 편집/미리보기 + "새 전자책 만들기".

---

## API / 공용 모듈

- [expertApi.ts](../../src/lib/expertApi.ts): `createEbook/updateEbook/deleteEbook` 추가
  (`createCourse/updateCourse`는 curriculum의 videoUrl/preview, whatYouLearn, detailBlocks 저장).
- [lib/video.ts](../../src/lib/video.ts): `toEmbedUrl()` (YouTube/Vimeo → 임베드 URL). 상세·강의실 공용.
- [useBizData.ts](../../src/lib/useBizData.ts): `ebooks`, `getEbook`, `getEbooksByExpert` 추가.
- 수강/읽기/위시/무료등록은 기존 [userData.ts](../../src/lib/userData.ts) (`enrollFree`, `enrollments` 조회) 재사용.

## 라우트 추가 ([App.tsx](../../src/App.tsx))
`/learn/:id`, `/read/:id` (ProtectedRoute), `/expert/ebooks/new`, `/expert/ebooks/:id/edit`
(ProtectedRoute requireExpert).

## 진입 동선
- 구매/무료등록 완료 또는 "이어보기"/"바로 읽기" → `/learn/:id` · `/read/:id`.
- 마이페이지 "수강 중" 강의/전자책 → 각각 강의실/뷰어로.

---

## 검증
1. **에디터**: 강의 레슨에 영상 URL + "미리보기" 체크 → 저장. 전자책 "내 전자책 → 새로 만들기" 저장.
2. **강의 상세**: 배너 없음, 좌 영상 + 우 sticky 카드(스크롤 추적), 데스크톱만. 커리큘럼의
   "▶ 미리보기" 클릭 → 상단 영상 전환. 미체크는 🔒.
3. **강의실/뷰어**: 수강 등록자만 진입(미등록 시 판매 페이지로). 강의실 이전/다음·목차 이동, 뷰어 전체 PDF.
4. **전자책**: 목록/상세/마이페이지가 DB 기반. 상세 블록 표시. 무료 등록 후 `/read` 진입.
5. `npm run build` 통과.

---

## 추가 — 전자책 표지 이미지 + 미리보기 페이지 제한

### 표지 이미지 (썸네일 업로드)
- 마이그레이션 `20260612000000_ebook_cover_image.sql`: `ebooks.cover_image text` + 공개 스토리지
  버킷 **`covers`**(읽기 공개, 로그인 업로드/수정 정책).
- `Ebook.coverImage`, `EbookInput.coverImage`, `mapEbook`/`ebookRow` 매핑.
- 에디터: 표지 **이미지 업로드**(파일 → `supabase.storage.from('covers').upload` → public URL 저장),
  미리보기 + 제거. 이미지 있으면 카드/상세 썸네일에 이미지, 없으면 그라데이션+이모지 폴백
  ([EbookCard](../../src/components/EbookCard.tsx), [AcademyEbookDetail](../../src/pages/AcademyEbookDetail.tsx)).

### 미리보기 페이지 제한 (PDF.js)
- 마이그레이션 `20260612000100_ebook_preview_pages.sql`: `ebooks.preview_pages int default 3`.
- `Ebook.previewPages`, `EbookInput.previewPages` 매핑. 에디터에 "미리보기 페이지 수" 입력.
- 신규 [PdfPreview.tsx](../../src/components/PdfPreview.tsx): `pdfjs-dist`로 PDF 앞 `maxPages`
  페이지만 canvas 렌더(브라우저 기본 뷰어로는 페이지 제한 불가). worker는 `?url` 임포트.
- 전자책 상세 미리보기 섹션: 전체 iframe → **`PdfPreview`(앞 N페이지)** + 잠금 CTA로 교체.
  전체 열람은 `/read/:id`(구매자 전용)에서만. (PDF는 CORS 허용 호스트/Supabase 공개 URL이어야 렌더됨)
- 의존성 추가: `pdfjs-dist`.

## 적용 필요 (코드 외) — 비즈 프로젝트 SQL Editor에 순서대로
1. `20260611000000_ebook_landing.sql` (use_landing_page, detail_blocks)
2. `20260612000000_ebook_cover_image.sql` (cover_image + covers 버킷)
3. `20260612000100_ebook_preview_pages.sql` (preview_pages)
