# 그래플레이 비즈(grapplay-biz / Academy) 별도 서버 분리 문서

> **목적**: 현재 그래플레이 메인 웹앱(monolith) 안에 플래그 기반으로 통합되어 있는
> **그래플레이 비즈(B2B 교육 플랫폼, 내부 코드명 `academy` / `biz`)** 를 별도 서버/리포지토리로
> 분리하기 위한 현황 인벤토리 및 마이그레이션 가이드.
>
> 작성일: 2026-06-04 · 기준 브랜치: `main` · 원본 feature: `028-academy`

---

## 0. 의사결정 기록 (ADR) — 2026-06-04

> **결론: DB는 공유하고(옵션 A), 코드/배포만 분리한다. DB 완전 분리(옵션 B)는 보류.**
> 작성자 검토 의견. 프로덕트 방향이 확정되면 재검토.

### 배경
- 운영자(작성자)는 “DB 공유 + 그래플레이와 함께” 선호.
- 개발자는 “유지보수가 힘들 것 같다”며 별도 서버 분리를 제안.
- 비즈 프로덕트의 본질(독립 사업 vs 기존 회원용 부가 모듈)은 **아직 미확정**.

### 핵심 판단: 되돌릴 수 있는 결정 vs 없는 결정 (비대칭 리스크)
- **DB 분리는 비싸고 되돌리기 어려운 결정**, **코드 분리는 싸고 언제든 되돌릴 수 있는 결정.**
- 지금 DB를 갈랐다가 “부가 모듈” 결론 → 인증·정산 재통합 지옥.
- 지금 공유로 두고 “별도 사업” 결론 → 데이터 이관 1회로 끝(깔끔).
- 틀렸을 때 비용이 한쪽으로 크게 쏠리므로, **프로덕트 미확정 상태에선 되돌릴 수 없는 결정을 미루는 것이 정석.**

### 개발자의 “유지보수” 통증은 DB가 아니라 코드 결합이 원인
DB를 분리해도 통증은 안 사라지고 오히려 악화된다(인증 이중 관리, 정산 분산, 교차 리포트 불가).
대신 아래 3가지로 코드만 격리하면 통증이 해소된다:
1. **독립 배포** — `biz.grapplay.com` 별도 도메인/빌드 (비즈 수정이 소비자 앱 빌드를 깨지 않음)
2. **명확한 모듈 경계** — `pages/academy/**`, `lib/api-academy.ts` 격리, 공유 코드(결제/인증)는 named export로만 의존
3. **`biz_expert_reviews` 마이그레이션 승격** — 규칙 위반 상태(§4.2)가 유지보수 불안의 실제 원인 중 하나. 무엇보다 먼저 정리.

### MVP 필수 기능 정의 (최소 루프: 올림 → 발견 → 구매 → 시청)
**🔴 필수** (없으면 제품 성립 불가 — 전부 메인 인프라 재사용):
강의 목록·검색·카테고리(`AcademyLibrary`) / 강의 상세·재생(`AcademyCourseDetail`) /
구매·결제(메인 `Checkout` 재사용) / 인증(공유 `AuthContext`) / 내 강의(`AcademyMyPage`) /
전문가 강의 업로드·관리(`AcademyExpertDashboard`, `AcademyCourseEditor`).

**🟡 보류** (신뢰·리텐션·수익화 레이어, 수요 검증 후):
전문가 디렉터리+리뷰(`AcademyExperts`, `biz_expert_reviews`) / 구독 모델(`biz` 티어 → 우선 개별구매로 시작) /
공지·FAQ / 어드민 토글(메인 어드민에 잔류 가능).

> 결정적 근거: 🔴 필수 6개 중 4개(결제·인증·영상·정산)가 메인 인프라 재사용.
> 별도 서버로 가면 이 4개를 처음부터 재구축 = 수개월. → **공유가 정답인 가장 강력한 증거.**

### 결정
1. **DB 공유로 간다** (옵션 A — §6 참조). DB 완전 분리는 보류.
2. **독립 배포 + 코드 모듈 격리**로 유지보수 통증 해결.
3. **MVP는 🔴 필수 6개**, 🟡는 수요 검증 후. 검증되면 그때 DB 분리 재검토.

### 재검토 트리거 (이때 옵션 B를 다시 논의)
- 비즈가 BJJ 업계 밖 신규 고객까지 받는 별도 브랜드/법인으로 확정될 때
- 별도 정산·세금계산서·계약 주체가 필요해질 때
- 비즈 트래픽/스키마 변경 빈도가 메인 운영에 실질적 부담을 줄 때

### 자주 나오는 질문 (FAQ)

**Q1. 나중에 별도 서버(옵션 B)로 분리하면 지금 만든 걸 다 다시 짜야 하나?**
아니다. **"이동"과 "재구축"을 구분**해야 한다.
- **이동(다시 안 짬)**: academy 페이지·대시보드·에디터·리뷰 UI, `api-academy.ts`, 리뷰/PDF 함수,
  `course_reviews`·`courses` 컬럼 스키마 — React/TS 코드와 마이그레이션은 그대로 포터블, 새 리포로 옮기면 됨.
- **재구축(비쌈)**: 인증(auth)·결제(Checkout/Toss/Stripe)·정산(revenue_ledger/payout) —
  이 "비싼 공유 인프라"를 다시 안 만들려고 애초에 옵션 A(공유)를 택한 것.
- 진짜 헛수고가 되는 유일한 시나리오는 *지금 별도 서버부터 짓는 것*(제품 확정 전 인프라 재구축).

**Q2. A로 갈지 B로 갈지 아직 모르는데, 지금 기능(§9)을 만들어도 되나?**
된다. **A/B 결정과 기능 개발은 독립적**이다.
- A/B는 "인프라를 분리하느냐"의 결정, §9는 "기능을 짓느냐"의 결정 — 서로 무관.
- 기능(UI/로직)은 A든 B든 어느 쪽에서도 살아남는다(이동 가능).
- 오히려 기능을 만들어 **제품을 검증해야** A/B 판단 근거(수요)가 생긴다. 순서는
  "모놀리스에 만들어 → 검증 → (필요 시) 분리"이지, "분리부터 → 만들기"가 아니다.
- **단 조건**: 깨끗한 모듈 경계로 짓기(비즈 코드를 소비자 코드에 깊게 얽지 말 것). 그러면 나중 분리 = "폴더 이동".

---

## 1. 개요

| 항목 | 내용 |
|------|------|
| 제품명 | 그래플레이 비즈 (UI 브랜딩: `grapplay-biz`, DB/코드: `academy`) |
| 성격 | B2B 교육 플랫폼 — 체육관 운영자/지도자가 **수강생(소비자)** 이 되어 비즈니스 교육 강의를 구매 |
| 메인 그래플레이와의 관계 | 역할 역전: 메인은 BJJ 콘텐츠 *공급자*, 비즈는 비즈니스 교육 *소비자* |
| 현재 구현 방식 | **별도 서버 아님.** 메인 monolith 안에서 `is_academy` 플래그 + 전용 라우트(`/academy/*`)로 분리 |
| 테마 색상 | amber/gold, 흰색(stone-50) 배경 — 메인과 시각적으로 완전히 구분 |
| 진입점 | `/academy` (공개 랜딩). 메인 대시보드(크리에이터/주최자)에 배너 CTA 존재 |

### 비즈 강의 카테고리 (4종) — 2026-06-04 개편
**마케팅 · 상권분석 · 연금 · 체육관 운영**

> 초기 런칭은 위 4개 카테고리로 시작. (기존 6종 — 재정/세무, 마케팅, 체육관 운영,
> 인사 관리, 법률, 영업/고객 관리 — 에서 축소.) 수요 검증 후 확장.
> 카테고리 원천 상수는 `lib/api-academy.ts`의 `ACADEMY_CATEGORIES`이며,
> emoji(`AcademyLayout.tsx`)·아이콘(`AcademyLanding.tsx`)이 별도 하드코딩되어 있어 함께 동기화 필요.

---

## 2. 현재 아키텍처 — 플래그 기반 통합

비즈는 독립 코드베이스가 아니라 **메인 앱에 얹혀진 별도 라우트 트리**입니다. 분리는 4개 레이어에서 일어납니다.

| 레이어 | 분리 방식 |
|--------|-----------|
| **DB** | `courses.is_academy`, `creators.is_academy_expert` 불리언 플래그 + RLS 정책으로 B2C/비즈 조회 분리 |
| **API** | 전용 모듈 `lib/api-academy.ts` 에서 쿼리 시 `.eq('is_academy', true)` 필터 |
| **라우팅** | `/academy/*`, `/academy-expert/*` 경로 트리 (App.tsx) |
| **레이아웃** | `Layout.tsx`가 `/academy` 경로 감지 → `AcademyLayout`(전용 nav/footer/모바일탭)으로 렌더 |
| **인증** | `AuthContext`의 `isAcademyExpert` 플래그 + `AcademyExpertRoute` 가드 |

> 핵심: **신규 테이블을 거의 만들지 않고** 기존 `courses` / `creators` / `user_courses` / `revenue_ledger` 를
> 플래그로 재사용. 그래서 “분리하기 쉬운 구조”이지만, 동시에 **데이터가 메인과 같은 테이블에 섞여 있어**
> 물리적 분리(별도 DB) 시 데이터 이관 전략이 필요합니다.

---

## 3. 전체 파일 인벤토리

### 3.1 프론트엔드 — 페이지 (전부 이동 대상)

| 파일 | 라우트 | 보호 | 설명 |
|------|--------|------|------|
| `pages/academy/AcademyLanding.tsx` | `/academy` | 공개 | 랜딩 |
| `pages/academy/AcademyPricing.tsx` | `/academy/pricing` | 공개 | 요금제 |
| `pages/academy/AcademyLibrary.tsx` | `/academy/library` | 로그인 | 강의 목록(구독/구매 탭, 카테고리/검색/정렬) |
| `pages/academy/AcademyCourseDetail.tsx` | `/academy/courses/:id` | 로그인 | 강의 상세 (메인 `CourseDetail.tsx` 래핑) |
| `pages/academy/AcademyMyPage.tsx` | `/academy/my` | 로그인 | 내 강의 |
| `pages/academy/AcademyExperts.tsx` | `/academy/experts` | 공개 | 전문가 디렉터리 |
| `pages/academy/AcademyExpertReviews.tsx` | `/academy/experts/:expertId/reviews` | 공개 | 전문가 리뷰 |
| `pages/academy/AcademyAnnouncements.tsx` | `/academy/announcements` | 공개 | 공지 |
| `pages/academy/AcademyFaq.tsx` | `/academy/faq` | 공개 | FAQ |
| `pages/academy-expert/AcademyExpertDashboard.tsx` | `/academy-expert/dashboard` | 전문가/어드민 | 전문가 대시보드(콘텐츠+매출) |
| `pages/academy-expert/AcademyCourseEditor.tsx` | `/academy-expert/courses/new`·`/:id/edit` | 전문가/어드민 | 강의 생성/편집 |

### 3.2 프론트엔드 — 컴포넌트

| 파일 | 설명 | 이동 여부 |
|------|------|-----------|
| `components/AcademyLayout.tsx` | 비즈 전용 nav/footer/모바일탭/어드민 사이트맵 | **이동** (비즈 전용) |
| `components/AcademyExpertRoute.tsx` | 전문가/어드민 라우트 가드 | **이동** |

### 3.3 API 레이어

| 파일 | 내용 | 이동 여부 |
|------|------|-----------|
| `lib/api-academy.ts` | `getAcademyCourses`, `getAcademyCourseById`, `getAcademyExperts`, `getExpertReviews`, `createExpertReview`, `validateExpertReviewInput`, `ACADEMY_CATEGORIES` | **이동** (비즈 전용) |
| `lib/api-academy.test.ts` | 리뷰 입력 검증 테스트 | **이동** |
| `lib/api.ts` | `transformCourse`/`transformCreator`에 `is_academy`↔`isAcademy` 매핑, `createCourse`/`updateCourse`에서 `isAcademy=true` 시 `is_subscription_excluded=true` 자동 설정 | **공유** (일부 로직만 추출 필요) |
| `lib/api-admin.ts` | `toggleAcademyExpert(creatorId, value)` | **공유** (어드민 토글) |

관련 코드 위치:
- `lib/api.ts:254` — `isAcademyExpert` 매핑
- `lib/api.ts:317` — `isAcademy` 매핑
- `lib/api.ts:1514-1516` — `createCourse`의 `is_academy` / `is_subscription_excluded` 처리
- `lib/api.ts:1546-1547` — `updateCourse`의 `is_academy` 처리

### 3.4 라우팅 / 레이아웃 (메인 App에서 분리 대상)

- `App.tsx:139-150` — academy 페이지 lazy import (12개)
- `App.tsx:449-461` — academy 라우트 정의
- `App.tsx:19` — `AcademyExpertRoute` import
- `components/Layout.tsx:131-142` — `/academy`·`/academy-expert` 경로 감지 → `AcademyLayout` 분기

### 3.5 인증

- `contexts/AuthContext.tsx` — `isAcademyExpert` 상태(`creators.is_academy_expert`에서 유도), `useAuth()`로 노출

### 3.6 메인 앱 내 비즈 진입점 (분리 시 링크 수정 필요)

| 파일 | 내용 |
|------|------|
| `pages/CreatorDashboard.tsx` | amber 배너 “grapplay-biz” + “강의 둘러보기 →” → `/academy/library` |
| `pages/OrganizerDashboard.tsx` | 동일 배너/CTA |
| `pages/AdminCourseList.tsx` | “biz” 강의 필터 탭 + `is_academy` 토글 (`handleToggleAcademy`) |
| `pages/AdminCreatorList.tsx` | “biz 전문가” 필터 + `is_academy_expert` 토글 (`handleToggleAcademyExpert`) |

---

## 4. 데이터베이스 스키마

### 4.1 플래그 컬럼 (기존 테이블에 추가됨)
`supabase/migrations/20260410000004_academy.sql`

```sql
-- courses 테이블
ALTER TABLE courses ADD COLUMN is_academy BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX courses_is_academy_idx ON courses (is_academy) WHERE is_academy = TRUE;

-- creators 테이블
ALTER TABLE creators ADD COLUMN is_academy_expert BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS: B2C는 누구나, 아카데미 강의는 로그인 사용자만 조회
DROP POLICY ... (기존 공개 조회 정책 5개 제거)
CREATE POLICY "courses_read_non_academy" ON courses FOR SELECT USING (is_academy IS NOT TRUE);
CREATE POLICY "courses_read_academy"     ON courses FOR SELECT USING (is_academy = TRUE AND auth.uid() IS NOT NULL);
```

### 4.2 전용 테이블 — `biz_expert_reviews`

> ⚠️ **중요 / 리스크**: 이 테이블은 정식 마이그레이션이 **아닌** 단독 파일
> `supabase/biz_expert_reviews.sql` 로 존재합니다. CLAUDE.md 규칙(“모든 스키마 변경은
> `supabase/migrations/`를 통한다”)을 위반한 상태이며, `supabase/migrations/`에
> 동일 테이블 정의가 없습니다. **분리 작업 전에 이 테이블이 실제 운영 DB에 어떻게
> 적용됐는지 확인**하고, 새 서버에서는 정식 마이그레이션으로 다시 만들어야 합니다.

```sql
CREATE TABLE biz_expert_reviews (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id  UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content    TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expert_id, user_id)   -- 전문가당 1인 1리뷰
);
-- RLS: 조회 전체 공개, 작성/수정/삭제는 본인만
```

### 4.3 구독 티어 `biz`
`supabase/migrations/20260508000001_pioneer_tier.sql:6`

```sql
subscription_tier IN ('basic','premium','pioneer','grapplay','biz','bundle')
```
→ 사용자 구독 등급에 `biz` 값 존재. 비즈 구독 모델과 연결됨.

### 4.4 공유(이동 불가) 테이블
- `courses`, `lessons` — 비즈 강의가 `is_academy=true` 행으로 섞여 있음
- `creators` — 전문가가 `is_academy_expert=true` 행으로 섞여 있음
- `user_courses` — 구매 기록 (product_type 구분 없이 공유)
- `revenue_ledger` — 매출/정산 (`product_type='course'` 공유)
- `auth.users` — 인증 (공유)

---

## 5. 공유 의존성 (새 서버에서 어떻게 다룰지 결정 필요)

| 의존성 | 현재 | 분리 시 고려 |
|--------|------|--------------|
| Supabase Auth | 단일 프로젝트 공유 | 같은 Auth 공유 vs 별도 프로젝트 |
| Supabase Client | `lib/supabase.ts` 단일 인스턴스 | 새 서버용 클라이언트 |
| 결제 (Checkout) | 메인 `Checkout.tsx` `type=course` 흐름 재사용 (Toss/Stripe) | 결제 로직 복제 or 공유 결제 서비스 |
| 정산/페이아웃 | `RevenueAnalyticsTab`, `PayoutSettingsTab` 재사용 | 매출원장 공유 여부 |
| 영상 호스팅 | Vimeo (`lessons.vimeo_url`) | 공유 |
| 공유 컴포넌트 | `CourseCard`, `CourseDetail`, `Checkout`, `ImageUploader`, `VideoUploader` | 복제 or 공용 패키지화 |
| 타입 | `types.ts`의 `Course.isAcademy`, `Creator.isAcademyExpert` | 새 서버 타입 정의 |

### 환경 변수
비즈 전용 env 없음. 기존 변수 공유: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_TOSS_CLIENT_KEY`, Vimeo 토큰.

---

## 6. 분리 전략 (개발자 검토용)

### 옵션 A — 같은 DB 공유, 프론트엔드만 별도 서버/도메인
- **장점**: 데이터 이관 불필요. 결제/정산/인증 그대로 공유. 빠름.
- **작업**: `/academy/*` 페이지 + `api-academy.ts` + `AcademyLayout`을 새 프론트 리포로 이동,
  별도 도메인(예: `biz.grapplay.com`) 배포, 같은 Supabase 프로젝트 가리킴.
- **유의**: `courses`/`creators` 테이블이 여전히 공유되므로 RLS·플래그 유지 필요.

### 옵션 B — DB까지 완전 분리 (별도 Supabase 프로젝트)
- **장점**: 완전 독립. 운영 격리.
- **작업**:
  1. 새 프로젝트에 `courses`/`creators`/`lessons`/`user_courses`/`revenue_ledger`/`biz_expert_reviews` 스키마 생성
  2. `is_academy=true` / `is_academy_expert=true` 데이터 이관 (전문가의 비즈가 아닌 강의 처리 정책 필요)
  3. 사용자 계정(`auth.users`) — SSO/공유 인증 vs 복제 결정
  4. 결제·정산 파이프라인 재구축 또는 메인과 API 게이트웨이 연동
- **유의**: 한 크리에이터가 메인 강의와 비즈 강의를 동시에 가질 수 있음 → 데이터 경계가 깔끔하지 않음.

### 권장 출발점
대부분의 경우 **옵션 A(프론트 분리 + DB 공유)** 로 시작해 트래픽/조직 분리가 필요해지면
옵션 B로 진화하는 것이 현실적. 단 `biz_expert_reviews`의 마이그레이션 누락 문제는
어느 옵션이든 **먼저 정리**해야 함.

---

## 7. 이동/공유/정리 체크리스트

**이동 (비즈 전용 — 새 서버로)**
- [ ] `pages/academy/**` (9개)
- [ ] `pages/academy-expert/**` (2개)
- [ ] `components/AcademyLayout.tsx`, `components/AcademyExpertRoute.tsx`
- [ ] `lib/api-academy.ts`, `lib/api-academy.test.ts`
- [ ] App.tsx의 academy 라우트(449-461) / lazy import(139-150)
- [ ] `ACADEMY_CATEGORIES` 상수
- [ ] 비즈 구독 티어(`biz`) 관련 로직

**공유 (메인에 남기되 새 서버에서 접근)**
- [ ] Supabase Auth / Client
- [ ] 결제(Checkout, Toss/Stripe), 정산(revenue_ledger, payout)
- [ ] `courses`/`creators`/`lessons`/`user_courses` 테이블
- [ ] Vimeo 영상 호스팅

**정리 (분리 전 선결 과제)**
- [ ] ⚠️ `supabase/biz_expert_reviews.sql` → 정식 마이그레이션으로 승격 (운영 적용 현황 확인)
- [ ] 메인 대시보드 비즈 배너(CreatorDashboard/OrganizerDashboard) → 새 도메인 링크로 변경
- [ ] 어드민 토글(AdminCourseList/AdminCreatorList) → 새 서버로 옮길지, 메인 어드민에 둘지 결정
- [ ] `is_academy` 데이터가 RLS·구독 제외 로직과 얽힌 부분(`is_subscription_excluded` 자동설정) 검토

---

## 8. 미해결 질문 (개발자에게 확인 필요)

1. **DB 분리 범위** — 옵션 A(공유) vs 옵션 B(완전 분리) 중 어느 쪽?
2. **인증** — 메인과 동일 계정/SSO인가, 별도 회원인가?
3. **결제·정산** — 비즈 매출을 메인 `revenue_ledger`에 계속 기록할 것인가?
4. **도메인** — `biz.grapplay.com` 서브도메인 vs 별도 도메인?
5. **크로스 데이터** — 한 크리에이터가 메인·비즈 강의를 동시 보유할 때 데이터 소유권 경계?
6. **`biz_expert_reviews` 운영 적용 여부** — 마이그레이션 누락분이 실제 prod DB에 반영돼 있는지?

---

## 9. 신규 기능 정의 — 코스 상세페이지 & 리뷰 인센티브 (2026-06-04 논의)

전문가(콘텐츠 공급자) 요청 사항 2건. 둘 다 **신규 기능**이며 비즈 프로덕트 정의에 포함.

### 9.1 리치 코스 상세페이지 (롱스크롤 판매 랜딩 스타일)

**요청**: 참고 사이트(`leeseobtv.co.kr`)처럼 사진이 들어간 강의 상세 판매페이지를 만들 수 있게.

**참고 사이트 구조** (한국 온라인 강의 판매페이지 표준 포맷):
헤더(앵커 네비) → 강의 소개 → 강사 소개 → 학습 내용("어떤 것을 배우나요?") → 커리큘럼 → 후기 → (가격/CTA)

**제안 섹션 구성**:
1. Hero — 대표 이미지 + 강의명 + 한줄 소개 + CTA(구매/구독)
2. 강의 소개 — 이미지 + 텍스트 블록 (왜 이 강의인가, pain point)
3. 강사(전문가) 소개 — 프로필 사진 + 경력
4. 학습 내용 — 아이콘/이미지 카드 그리드
5. 커리큘럼 — 레슨 목록 (기존 `lessons` 재사용)
6. 후기 — §9.2 리뷰 노출 (사회적 증거)
7. 가격/구독 CTA + FAQ

**기술 고려사항** (현재 vs 필요):
- 현재 `AcademyCourseDetail`은 범용 `CourseDetail.tsx`를 그대로 래핑 → 판매페이지 레이아웃 아님.
- 강의별 **리치 콘텐츠(이미지+텍스트 블록 반복)** 를 저장할 구조 필요. 옵션:
  - (A) `courses`에 `detail_blocks JSONB` 컬럼 추가 — 블록 배열(type: image|text|heading…) 저장. **권장**(유연·간단).
  - (B) 마크다운 본문 컬럼 `detail_content TEXT` + 이미지 업로드.
  - (C) 별도 `course_detail_sections` 테이블.
- 이미지 업로드는 기존 `ImageUploader` + Supabase Storage 재사용.
- 비즈 전용 상세페이지 컴포넌트 신규(예: `AcademyCourseLanding.tsx`) — 범용 `CourseDetail`과 분리.

**✅ 확정 (2026-06-05)**: 상세페이지 콘텐츠는 **전문가가 직접 편집**(노션식 블록 에디터).
→ `AcademyCourseEditor`에 블록 에디터(이미지/텍스트/제목 블록 추가·순서변경·삭제) 신규 구현.
→ 저장은 옵션 (A) `courses.detail_blocks JSONB` 채택.

**✅ 확정 (2026-06-05)**: **강의별 on/off**. 전문가가 강의마다 리치 상세페이지 사용 여부 선택.
→ `courses.use_landing_page BOOLEAN DEFAULT FALSE` 플래그 추가. ON이면 `detail_blocks` 기반 랜딩 렌더,
OFF면 기존 범용 상세 레이아웃 표시.

### 9.2 리뷰 작성 → PDF 이메일 발송 (리뷰 수집 인센티브)

**요청 의도**: 리뷰를 써주면 PDF를 이메일로 보내줘서 **리뷰를 채우려는** 목적(사회적 증거 축적).

**✅ 확정 플로우 (2026-06-05)** — *자동 발송 아님. 전문가가 직접 발송*:
1. **구매자**가 코스 상세에 리뷰 작성 (구매자만 가능 — `user_courses` 보유 확인)
2. 전문가 대시보드(`AcademyExpertDashboard`)에 신규 리뷰 표시
3. 전문가가 리뷰 확인 후 **"PDF 보내기" 버튼**으로 작성자 이메일에 해당 강의 PDF 발송
   → 전문가의 수동 발송이 곧 **검수 역할**(어뷰징/스팸 리뷰엔 안 보내면 됨)

**⚠️ 데이터 모델 주의**: 기존 `biz_expert_reviews`는 **전문가 1명당 리뷰**(전문가 디렉터리용).
이번 건은 **강의(코스) 1개당 리뷰**라 별개 테이블 필요. 확정 스키마:
```
course_reviews (
  id, course_id → courses, user_id → auth.users,
  content TEXT,                   -- 댓글형 후기 (별점 없음)
  created_at,
  hidden BOOLEAN DEFAULT FALSE,   -- 전문가/관리자 숨김 처리
  hidden_by UUID,                 -- 숨긴 주체 (전문가 또는 관리자)
  pdf_sent_at TIMESTAMPTZ,        -- 마지막 발송 시각 (NULL = 미발송)
  pdf_sent_count INT DEFAULT 0,   -- 누적 발송 횟수 (재발송 허용)
  pdf_last_sent_by UUID,          -- 마지막 발송 전문가 id
  UNIQUE(course_id, user_id)       -- 1강의 1인 1리뷰
)
-- 작성 제약: 해당 course를 구매(user_courses)한 사용자만 INSERT (RLS 또는 앱 레벨 체크)
-- 노출: hidden=FALSE 인 리뷰만 상세페이지에 표시
```

**인프라 — 신규 구축 불필요, 전부 재사용 가능**:
- 이메일: `supabase/functions/send-notification-email` (엣지 함수) 패턴 재사용.
- 발송 트리거: 전문가가 대시보드에서 "PDF 보내기" 클릭 → 엣지 함수 호출(첨부 발송 + `pdf_sent_at` 갱신, `pdf_sent_count` 증가, `pdf_last_sent_by` 기록).

**✅ 확정 결정 (2026-06-05)**:
- **별점 없음**: 텍스트 후기만(댓글형). rating 컬럼 없음.
- **PDF 출처**: 강의마다 **다른 파일**. 전문가가 강의별로 업로드 → `courses.review_reward_pdf_url`
  (PDF는 Supabase Storage 업로드, `AcademyCourseEditor`에서 설정).
- **발송 방식**: 자동 아님. 전문가가 리뷰별로 **수동 발송**(= 검수 겸함).
- **재발송 허용**: 같은 리뷰에 PDF 여러 번 발송 가능(`pdf_sent_count` 누적).
- **리뷰 숨김**: 전문가/관리자가 부적절 리뷰를 숨김 처리 가능(`hidden=TRUE`). 숨김 리뷰는 상세페이지 비노출.
- **작성 자격**: **구매자만** (`user_courses` 보유자). 1강의 1인 1리뷰(UNIQUE).

> 위 §9.1·§9.2 모든 항목 확정 완료. 추가 미해결 없음 → speckit 개발 착수 가능.

> **구현 전 선결**: §4.2의 `biz_expert_reviews` 마이그레이션 누락부터 정리 후,
> `course_reviews`는 처음부터 정식 마이그레이션으로 생성할 것.

### 9.3 전문가 대시보드 — 통합 관리 허브

**원칙**: §9의 모든 기능(영상 업로드 · 강의/상세페이지 · 리뷰 · 정산)은 전문가가
`AcademyExpertDashboard` **한 곳에서 모두 관리**할 수 있어야 한다.

**현재 탭 (4개)** — `pages/academy-expert/AcademyExpertDashboard.tsx`:
| 탭 | 기능 | 현황 |
|----|------|------|
| 영상 | Vimeo 업로드 + 보유 영상 목록/URL 복사 (`VideoUploader compact`) | ⚠️ 버그 (아래) |
| 내 강의 | 강의 카드 목록 → 편집기 진입 | ✅ |
| 수익 분석 | `RevenueAnalyticsTab` (메인 그래플레이 컴포넌트 재사용) | ✅ |
| 정산 | `PayoutSettingsTab` (메인 그래플레이 컴포넌트 재사용) | ✅ |

> **✅ 정산/수익 로직 = 메인 그래플레이에서 그대로 가져옴.** 대시보드가 이미
> `RevenueAnalyticsTab` / `PayoutSettingsTab`을 import해 재사용 중(별도 구현 불필요).
> 비즈 강의 매출도 공유 `revenue_ledger`(`product_type='course'`)에 기록되므로 정산 파이프라인 공유. (§5 참조)

**추가 필요 (신규 구현)**:
| 항목 | 위치 | 비고 |
|------|------|------|
| **리뷰 관리 탭** | 대시보드 새 탭 | 강의별 리뷰 목록 · 숨김 토글(`hidden`) · "PDF 보내기" 버튼 (§9.2) |
| **랜딩 블록 에디터** | `AcademyCourseEditor` | 이미지/텍스트/제목 블록 편집 → `detail_blocks` (§9.1) |
| **랜딩 on/off 토글** | `AcademyCourseEditor` | `use_landing_page` (§9.1) |
| **리워드 PDF 업로드** | `AcademyCourseEditor` | `review_reward_pdf_url`, 강의별 1개 (§9.2) |

**⚠️ 알려진 이슈 — 영상 업로드 compact 모드 (수정 필요)**:
- `VideoUploader`는 **카테고리 필수**(`disabled={... || !metadata.category}`, `VideoUploader.tsx:293`)이나,
  `compact` 모드에선 카테고리 입력란이 **숨겨짐**(`VideoUploader.tsx:182`).
- 비즈 대시보드는 `initialMetadata` 없이 호출(`AcademyExpertDashboard.tsx:98`) → `category=''` →
  **"업로드 시작" 버튼이 계속 비활성화**될 가능성 높음(실측 확인 필요).
- 숨겨진 카테고리 옵션도 BJJ 동작(스탠딩/가드/마운트…)이라 비즈용 부적합.
- **수정 방향**: compact 모드에서 카테고리 필수 제거 or 비즈 기본값 주입 (간단 수정).

---

## 참고 파일
- 코스 상세페이지 참고 사이트(롱스크롤 판매 랜딩): https://leeseobtv.co.kr/
- 스펙: `specs/feat/028-academy/{spec,plan,tasks}.md`
- 마이그레이션: `supabase/migrations/20260410000004_academy.sql`
- 단독 SQL(승격 필요): `supabase/biz_expert_reviews.sql`
- 구독 티어: `supabase/migrations/20260508000001_pioneer_tier.sql`
