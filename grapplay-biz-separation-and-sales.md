# 기능 요청서: 그래플레이 Biz 분리 및 단품판매 완성

> 기존 분석: [docs/bugs/biz-academy-separation.md](../bugs/biz-academy-separation.md) — 본 문서로 통합·승격
> 관련 문서: [settlement-system.md](./settlement-system.md), [revenue-reconciliation.md](./revenue-reconciliation.md)

## 1. 개요 (Summary)

**기능명:** 그래플레이 Biz 도메인 분리 + 단품판매 완성 (Biz/Consumer Separation & Direct Sales)

**한 줄 설명:** 그래플레이 Biz 사이트(체육관 운영·비즈니스 콘텐츠) 와 일반 그래플레이 사이트(주짓수 학습 콘텐츠) 의 **노출 영역**을 완전히 분리하고, Biz 콘텐츠가 코스 단위로 단품판매 가능하도록 완성한다. 시청 권한은 누구나 가질 수 있지만 (Biz 구독 또는 단품 구매), **콘텐츠 노출(피드·검색·추천)은 각 사이트 안에서만** 일어난다.

**작성자:** 그래플레이 운영팀
**작성일:** 2026-05-13
**목표 릴리즈 / 마감일:** 미정 — 본 분기 내 권장
**우선순위:** [x] 높음(High)

---

## 2. 문제 정의 및 배경 (Problem & Context)

### 2.1 콘텐츠 영역 분리 미흡

분리 기준은 **사용자 권한이 아니라 UI 도메인(사이트 영역)**. 일반 그래플레이 사이트(주짓수 학습)에는 Biz 콘텐츠가 절대 노출되지 않아야 하고, Biz 사이트에서는 Biz 콘텐츠만 노출. 단 사용자가 Biz 사이트에 방문해서 구독/구매하면 시청은 정상적으로 가능.

| 재현 시나리오 | 현재 동작 | 기대 동작 |
|---|---|---|
| Biz 계정에서 Vimeo URL 영상 등록 (`AcademyExpertDashboard`) | 일반 그래플레이 홈/탐색/추천에 노출됨 ❌ | Biz 사이트에서만 노출 |
| Biz 아카데미 코스 안에 lesson 추가 | 일반 그래플레이 피드에 노출됨 ❌ | Biz 라이브러리에만 |
| 일반 그래플레이 검색에서 Biz 영상이 결과로 등장 | 노출됨 ❌ | 등장하지 않음 |
| Biz 라이브러리에서 일반 standalone lesson | 같이 노출됨 ❌ (course_id IS NULL 조건만 사용) | Biz 콘텐츠만 노출 |

### 2.2 단품판매 불완전 (현재 절반만 구현)

| 영역 | 현재 상태 |
|---|---|
| Biz 코스 가격 입력 (관리자/제작자) | ✅ 구현 — [AcademyCourseEditor.tsx:586-597](pages/academy-expert/AcademyCourseEditor.tsx#L586-L597) 의 "판매방식" 토글 + 가격 필드, `is_subscription_excluded=true` + `price` 저장 |
| courses 테이블 | ✅ `price`, `is_academy`, `is_subscription_excluded` 컬럼 존재 |
| 라이브러리 카드 가격 표시 | ❌ [components/CourseCard.tsx](components/CourseCard.tsx) 에 가격 표시 UI 없음 (무료 배지만) |
| 구매 버튼 / 결제 진입점 | ❌ Biz 라이브러리/카드에 "구매" CTA 없음 |
| `purchaseCourse()` 함수 ([lib/api.ts:1089](lib/api.ts#L1089)) | ⚠️ 정의만 있고 호출처 없음 (dead code) |
| Checkout 흐름 | ⚠️ Biz 코스 전용 흐름 없음. 일반 코스 흐름이 Biz 코스에도 적용되는지 검증 필요 |
| Standalone lesson 단품판매 | ❌ 미구현. `lessons.price` 필드는 있지만 결제 연동 없음. Biz 가 코스 단위가 아닌 개별 영상 한 편씩 팔고 싶을 때 불가능. |

### 2.3 근본 원인

1. `lessons` 테이블에 **academy/biz 구분 컬럼 없음**. `pages/academy-expert/AcademyExpertDashboard.tsx:127` 가 `createLesson({ courseId: null })` 로 standalone lesson 생성 시 일반 lesson 과 DB 상 동일.
2. **소비자 측 lesson 쿼리들이 `courses.is_academy` 를 필터하지 않음** — 검색/추천/Daily/공개 lesson 모두.
3. **Biz 측 라이브러리 쿼리도 모호** — `getCreatorAcademyLessons` ([lib/api-lessons.ts:237](lib/api-lessons.ts#L237)) 가 `course_id IS NULL OR course.is_academy=true` 라서 일반 standalone lesson 도 Biz 라이브러리에 같이 들어감.
4. **결제 흐름 통합 부재** — Biz 코스/lesson 의 단품판매 진입점이 UI에 노출되지 않고, checkout 핸들러도 Biz 콘텐츠 처리 명시가 없음.

---

## 3. 제안 솔루션 (Proposed Solution)

### 3.1 콘텐츠 분리 (lessons.is_academy 플래그 도입)

`lessons` 테이블에 `is_academy BOOLEAN NOT NULL DEFAULT FALSE` 추가. 모든 소비자 쿼리는 `is_academy=false`, 모든 Biz 쿼리는 `is_academy=true` 로 필터링.

**왜 컬럼 추가인가**: 별도 테이블 분리 안 대비 변경량 1/10, 즉시 효과 동일, 중복 업로드 강제도 안 함. (별도 테이블 안 검토했으나 변경량 과다·실효성 동일로 기각.)

### 3.2 단품판매 흐름 완성

**코스 단위 단품판매만 지원** (lesson 단위는 범위 외).

기존 일반 코스 판매 흐름 재사용. `is_subscription_excluded=true` 인 academy 코스가 라이브러리 카드에 가격과 함께 표시되고, "구매" 버튼으로 `/checkout/course/{id}` 진입. 정산은 [settlement-system.md](./settlement-system.md) 의 "영상 개별 구매 80:20" 공식이 그대로 적용.

### 3.3 그래플레이 인프라 재활용 원칙 (Reuse over Reinvent)

**Biz 는 별도 시스템이 아니라 그래플레이 위에 얹은 도메인**. 다음은 일반 그래플레이 인프라를 **그대로 재사용**:

| 영역 | 재사용 대상 | Biz 전용 추가 |
|---|---|---|
| 결제 PG | 기존 Stripe / PayPal / PortOne / Toss webhook 흐름 | 없음 (코스/lesson product_type 그대로) |
| Checkout 페이지 | [pages/Checkout.tsx](pages/Checkout.tsx) 기존 흐름 | `is_academy=true` 코스/lesson 처리 분기 검증만 |
| `checkout_with_coupon` SQL | 그대로 | Biz 코스/lesson 도 동일 함수로 처리 |
| 환불 정책·환불 함수 | `process-refund` edge function 그대로 | 없음 |
| 정산 공식 | settlement-system.md 의 8:2 그대로 | 없음 |
| 출금 흐름 | `submit_payout_request` + 어드민 출금 처리 그대로 | 없음 |
| 모바일(Capacitor) | 기존 라우팅·결제 흐름 그대로 | 없음 (단 앱스토어 인앱결제 정책은 별도 점검) |
| 약관·CS 채널 | 그대로 | (Nice to have) Biz 별도 약관 |
| 알림 시스템 | 기존 인프라 | (Nice to have) Biz 신규 콘텐츠 알림 |

### 3.4 Biz 전용 추가 (재활용 불가 영역)

1. **시청 권한 (Access Control)** — Biz 콘텐츠 영상 시청은 다음 중 하나일 때만 허용:
   - Biz 구독자 (월간 ₩49,000 또는 분할 인식분 보유)
   - 번들 구독자 (Grapplay + Biz 동시 구독 ₩59,000)
   - 해당 코스/lesson 단품 구매자 (`user_courses` 또는 `user_lessons`)
   - 운영자가 부여한 무료 액세스 (`is_complimentary_subscription`)
2. **Biz 전문가 권한** — 운영자(관리자) 가 수동 선정. 일반 크리에이터가 임의로 Biz 콘텐츠를 만들 수 없음. 어드민 UI에서 토글로 전환.
3. **콘텐츠 분리 필터** — `lessons.is_academy` 신규 컬럼 (§3.1)
4. **단품 lesson 결제 진입점** — `/checkout/lesson/{id}` 신규 라우트 (§3.2)

---

## 4. 사용자 스토리

1. **Biz 전문가(아카데미 강사)로서**, 내가 올린 비즈니스 콘텐츠가 일반 그래플레이(주짓수 학습) 사이트의 피드·검색·추천에 섞여 노출되지 않기를 원한다, 왜냐하면 **주짓수 학습 사이트에 비즈니스 콘텐츠가 섞이면 양쪽 사용자 모두에게 잘못된 경험을 주기** 때문이다.
2. **일반 그래플레이 사용자로서**, 주짓수 학습 콘텐츠를 둘러볼 때 비즈니스 콘텐츠가 섞여 보이지 않기를 원한다. **단 내가 Biz 사이트에 방문해서 구독하거나 단품 구매하면 시청은 가능해야** 한다.
3. **그래플레이 Biz 사용자(체육관 운영자 등)로서**, Biz 사이트에서 가격을 보고 코스를 바로 구매하거나 구독해서 시청할 수 있기를 원한다.
4. **운영자로서**, Biz 전문가를 직접 선정해서 비즈니스 콘텐츠 제작 권한을 부여하고, 일반 크리에이터가 임의로 Biz 콘텐츠를 만들지 못하게 통제하기를 원한다.

---

## 5. 범위 (Scope)

### 필수 포함 (Must-have)

#### A. 콘텐츠 분리

- [ ] **DB 마이그레이션** `<YYYYMMDDHHMMSS>_lessons_is_academy.sql`
  - `lessons` 테이블에 `is_academy BOOLEAN NOT NULL DEFAULT FALSE` 추가
  - 부분 인덱스: `CREATE INDEX idx_lessons_is_academy ON lessons(is_academy) WHERE is_academy = true`
  - 백필: 기존 academy 코스 소속 lesson 모두 `is_academy=true` 로 업데이트
  - 트리거: `course_id` 변경 시 `is_academy` 자동 동기화 (academy 코스 → true)
- [ ] **`lib/api-lessons.ts`**:
  - `createLesson` ([L46](lib/api-lessons.ts#L46)) 에 `isAcademy?: boolean` 파라미터 추가, INSERT 에 반영
  - `transformLesson` 에 `is_academy → isAcademy` 매핑
  - `getLessons` ([L172](lib/api-lessons.ts#L172)): `.eq('is_academy', false)` 추가
  - `getCreatorAcademyLessons` ([L237](lib/api-lessons.ts#L237)): `is_academy=true` 기준으로 단순화
  - `getCreatorAllVideos` ([L250](lib/api-lessons.ts#L250)): Biz 대시보드용 — `.eq('is_academy', true)`
- [ ] **소비자 측 lesson 쿼리에 `is_academy=false` 추가**
  - [lib/api.ts:1304, 1569, 1585, 1594, 1707, 2227, 2242, 5421, 5693, 6693, 7520](lib/api.ts) (각 라인 컨텍스트 확인 후 적용)
  - [lib/api-accessible-content.ts:201](lib/api-accessible-content.ts#L201) `getAccessibleLessons`
  - [lib/api-recommendations.ts:303](lib/api-recommendations.ts#L303) `getPersonalizedLessons`
  - [lib/api-daily.ts:44, 86](lib/api-daily.ts) `getDailyContent`
  - 검색 함수 (전역 lesson 검색 경로) — 검색 진입 코드 확인 후 동일 필터 적용
- [ ] **Biz 측 호출부에 `isAcademy: true` 명시**
  - [pages/academy-expert/AcademyExpertDashboard.tsx:127](pages/academy-expert/AcademyExpertDashboard.tsx#L127): `createLesson({ ..., isAcademy: true })`
  - [pages/academy-expert/AcademyCourseEditor.tsx](pages/academy-expert/AcademyCourseEditor.tsx) 내 lesson 생성: 트리거가 자동 처리하지만 안전하게 명시 권장
- [ ] **어드민 쿼리는 양쪽 모두 보이도록 필터 추가 안 함** ([lib/api-admin.ts](lib/api-admin.ts))
  - (선택) 어드민 UI에 "BIZ" 뱃지 표시

#### B. 단품판매 완성

- [ ] **CourseCard 가격 표시 UI 추가** ([components/CourseCard.tsx](components/CourseCard.tsx))
  - `is_subscription_excluded=true && price > 0` 인 경우 가격 칩(예: `₩X,XXX`) 노출
  - 무료(`price=0`) 인 경우 "무료" 배지
  - 일반 코스에도 동일하게 적용해서 디자인 통일
- [ ] **Biz 라이브러리 / 코스 상세에 "구매" CTA**
  - [pages/CourseDetail.tsx:502-527](pages/CourseDetail.tsx#L502-L527) 의 결제 진입 로직이 `is_academy=true` 코스에도 작동하는지 검증, 안 되면 동일 흐름 적용
  - 진입점: `/checkout/course/{id}` (기존 경로 재사용)
- [ ] **`purchaseCourse()` 정리** ([lib/api.ts:1089](lib/api.ts#L1089))
  - 현재 dead code. 실제 결제 후 user_courses 기록은 별도 경로(`checkout_with_coupon` SQL 함수)로 이루어지므로 → `purchaseCourse` 삭제 또는 단일 진입점으로 통합. 둘 중 하나로 결정 후 정리.
- [ ] **Checkout 함수에서 Biz 코스 처리 검증** — `checkout_with_coupon` SQL 함수가 `is_academy=true` 코스도 정상 처리하는지 확인, 누락이면 분기 추가
- [ ] **Biz 단품 구매 후 접근권 부여 검증** — 구매한 academy 코스의 lesson 시청 시 `is_academy` 필터에 막히지 않도록 access check 로직 확인 (구매한 user_courses 가 있으면 lesson 접근 허용)

#### C. Biz 전용 (재활용 불가)

- [ ] **Biz 콘텐츠 시청 권한 함수 신규** — `can_user_access_biz_content(user_id, lesson_id_or_course_id) RETURNS boolean` SQL 함수. 다음 중 하나라도 true 면 허용:
  - Biz 구독자: `subscriptions.status='active' AND tier IN ('biz','bundle')` (Bundle 구독자도 Biz 콘텐츠 접근 허용)
  - 코스/lesson 단품 구매자: `user_courses` 또는 `user_lessons` 행 존재
  - 무료 액세스: `users.is_complimentary_subscription=true AND complimentary_includes_biz=true` (신규 컬럼)
- [ ] **시청 진입점 모두에 권한 체크 적용** — Biz lesson/코스 시청 전 위 함수 호출, false 면 결제/구독 유도 페이지로 리다이렉트
- [ ] **Biz 전문가 권한 관리** — `creators.is_academy_expert BOOLEAN DEFAULT FALSE` 컬럼 추가. true 인 크리에이터만 `is_academy=true` 콘텐츠 생성 가능 (RLS 또는 함수 가드).
- [ ] **어드민 UI: 크리에이터 목록에서 "Biz 전문가" 토글** — 운영자가 수동으로 on/off. 해제 시 기존 academy 콘텐츠는 유지하되 신규 생성 불가.
- [ ] **번들 구독자 Biz 접근 검증** — `lib/subscription-pricing.ts:39-41` 의 번들 가격 분배는 이미 있지만, **번들 구독자가 Biz 콘텐츠 시청 가능한지 access check 코드에서 명시적으로 보장** 필요. 현재 결제 흐름에서 `is_subscriber=true AND is_academy_subscriber=true` 로 둘 다 세팅되므로 통과는 되지만, 코드에 의도 명시 필요.
- [ ] **[Critical] `LessonDetail.tsx` 에 `is_subscription_excluded` 검증 추가** — [pages/LessonDetail.tsx:189](pages/LessonDetail.tsx#L189) 현재 `dbIsSubscribed && !lessonData.isSubscriptionExcluded` 패턴이지만 lesson 단위 `is_subscription_excluded` 가 누락되어 단품판매 전용 lesson이 구독자에게 그대로 보임. CourseDetail.tsx 의 `canWatchLesson()` 패턴과 동일하게:
  - 코스 또는 lesson 자체가 `is_subscription_excluded=true` 이면 단품 구매 행(`user_courses` 또는 `user_lessons`) 필요
  - 단품 구매 없으면 구독 상태와 무관하게 차단
- [ ] **[Critical] CourseDetail/LessonDetail 에 `isAcademySubscriber` 명시적 분기 추가** — 현재 `is_subscriber` 만 보고 권한 판정하므로 Biz 콘텐츠인지 일반 콘텐츠인지 의도가 코드에 드러나지 않음. 다음 매트릭스 명시:
  - 일반 콘텐츠(`is_academy=false`) 접근: `is_subscriber=true` (Grapplay 또는 번들) 또는 단품 구매자
  - Biz 콘텐츠(`is_academy=true`) 접근: `is_academy_subscriber=true` (Biz 또는 번들) 또는 단품 구매자
  - 회귀 방지 위해 access check 함수를 `can_user_access_content(user_id, content_id)` 같은 단일 진입점으로 통합 권장
- [ ] **`revenue_ledger` 에 Biz 식별 가능성 확보** — Biz 매출과 일반 매출 분리 집계용. 신규 컬럼 추가 대신 `product_id` (코스/lesson id) 로 join 하여 `is_academy=true` 인 매출만 별도 집계하는 뷰 `biz_revenue_view` 신설 권장. 어드민 정산 대시보드에 Biz 매출 카드 추가.

#### E. DB 스키마 누락 (Critical — 페이지 무한 로딩 / 권한 분기 실패 원인)

**DB 검증 결과** (2026-05-13): 다음 테이블/컬럼이 코드에서는 참조되지만 **실제 DB에 존재하지 않음**.

- [ ] **[Critical] `biz_expert_reviews` 테이블 신설**
  - 참조 위치: [lib/api-academy.ts:142](lib/api-academy.ts#L142) `getAcademyExperts` (select join), [lib/api-academy.ts:187](lib/api-academy.ts#L187) `.from('biz_expert_reviews')`, [lib/api-academy.ts:236](lib/api-academy.ts#L236) upsert
  - **현재 증상**: AcademyExperts·AcademyExpertReviews 페이지 **무한 로딩 (스켈레톤 끝나지 않음)**. 사용자가 "Biz 전문가" 클릭 시 데이터 없는데도 스켈레톤만 계속 노출. React Query 가 존재하지 않는 테이블 join 으로 에러 받고 retry 무한 반복.
  - 스키마:
    ```sql
    CREATE TABLE biz_expert_reviews (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      creator_id uuid REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      rating int CHECK (rating BETWEEN 1 AND 5) NOT NULL,
      content text,
      created_at timestamptz DEFAULT now(),
      UNIQUE (creator_id, user_id)
    );
    CREATE INDEX idx_biz_expert_reviews_creator ON biz_expert_reviews(creator_id);
    -- RLS: 누구나 SELECT, 본인만 INSERT/UPDATE/DELETE
    ```
- [ ] **[Critical] `users.is_academy_subscriber` 컬럼 신설**
  - 참조 위치: [supabase/functions/toss-billing/index.ts:199-207](supabase/functions/toss-billing/index.ts#L199-L207) (Biz/번들 결제 후 set), [lib/api-accessible-content.ts:132-139](lib/api-accessible-content.ts#L132-L139) (권한 판정)
  - **현재 증상**: Biz/번들 구독 결제 webhook 이 이 컬럼을 set 하려고 시도 → 컬럼 없어서 실패 또는 silent skip → **Biz 구독자가 실제로는 Biz 콘텐츠 접근 권한을 못 받을 가능성**. 현재 작동 중이라면 `subscription_tier` 만으로 우회되고 있을 가능성 → 회귀 위험 큼.
  - 마이그레이션:
    ```sql
    ALTER TABLE users ADD COLUMN is_academy_subscriber BOOLEAN NOT NULL DEFAULT FALSE;
    -- 백필: 현재 Biz/번들 구독 중인 사용자
    UPDATE users SET is_academy_subscriber = true
    WHERE subscription_tier IN ('biz','bundle') AND is_subscriber = true;
    ```
- [ ] **[Critical] `users.academy_subscription_end_date` 컬럼 신설**
  - Biz 구독 만료일 추적용 (일반 `subscription_end_date` 와 별도)
  - 마이그레이션: `ALTER TABLE users ADD COLUMN academy_subscription_end_date timestamptz;`
  - 결제 webhook 코드에서 set 하는지 검증 후 누락이면 추가
- [ ] **`academy_announcements`·`academy_faqs`·`academy_pricing` 테이블 처리 결정**
  - 세 테이블 모두 DB에 없음. 해당 페이지(AcademyAnnouncements, AcademyFaq, AcademyPricing) 가 무한 로딩 또는 빈 화면일 가능성.
  - **론칭 전 결정**: (a) 정적 콘텐츠(코드 안에 하드코딩) 로 처리 — 테이블 불필요 / (b) DB 테이블 신설 + 어드민 CMS UI
  - 둘 중 선택 후 마이그레이션 또는 코드 정리
- [ ] **Biz 구독 결제 webhook 동작 검증** — `toss-billing`, `portone-webhook`, `stripe-webhook`, `paypal-webhook` 모두 Biz/번들 결제 시 `users.is_academy_subscriber=true`, `subscription_tier='biz' / 'bundle'`, `academy_subscription_end_date` 를 정확히 set 하는지 e2e 테스트. 컬럼 추가 후 백필도 함께.

#### F. 빈 상태(Empty State) UI 및 무한 로딩 방지

- [ ] **academy/biz 페이지 전수 점검** — 데이터 0건일 때 스켈레톤이 아닌 적절한 empty state (메시지 + CTA) 표시. AcademyExperts(✓ 있음), AcademyExpertReviews(✓), AcademyMyPage("내강의" 빈 상태 확인 필요), AcademyAnnouncements·AcademyFaq·AcademyPricing 전수 점검
- [ ] **React Query retry 정책 조정** — 존재하지 않는 테이블/컬럼 같은 영구 에러(PostgrestError code `42P01` 'relation does not exist', `42703` 'column does not exist') 는 retry 안 하도록 `retry: (failureCount, error) => !isPermanentError(error)` 패턴 적용. 무한 로딩 재발 방지.

#### D. 데이터 마이그레이션 검증

- [ ] **백필 후 무결성 검증 쿼리 (배포 직후 실행)**:
  ```sql
  -- 1) academy 코스 소속인데 is_academy=false 인 lesson — 0건이어야 함
  SELECT COUNT(*) FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE c.is_academy = true AND l.is_academy = false;

  -- 2) 일반 코스 소속인데 is_academy=true 인 lesson — 0건이어야 함
  SELECT COUNT(*) FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE c.is_academy = false AND l.is_academy = true;

  -- 3) 일반 사용자(Biz 미구독·미구매)가 is_academy=true lesson 시청 로그 — 마이그레이션 후 신규 발생 0건이어야 함
  ```
- [ ] **롤백 플랜** — 마이그레이션 실패 시 `lessons.is_academy` 컬럼 DROP 으로 즉시 원복 가능. 단 백필 데이터 손실은 없도록 별도 백업 테이블 `lessons_pre_biz_backup` 1회 생성 후 작업.

### 이번 릴리즈 제외 (Out of scope)

- **Lesson 단위 단품판매** — 코스 단위 단품판매만 지원. lesson 한 편씩 파는 흐름은 신규 라우트·SQL 함수·테이블 모두 추가해야 해서 변경 폭이 큼. 운영 후 수요 확인 후 별도 논의
- 별도 `academy_lessons` 테이블 분리
- Biz/소비자 도메인 완전 분리 (별도 앱·서브도메인)
- Biz 전용 쿠폰·프로모션 시스템

### 여유 있으면 추가 (Nice to have)

- Biz 라이브러리에 정렬 (가격·인기·최신)
- Biz 코스 묶음(번들) 할인
- 구매한 Biz 콘텐츠 통합 "내 라이브러리" 페이지

---

## 6. 완료 기준 (Acceptance Criteria)

### 분리

- [ ] Biz 계정에서 영상 등록 → DB `lessons.is_academy=true` 로 기록
- [ ] Biz 계정에서 academy 코스 + lesson 생성 → 트리거로 lesson `is_academy=true` 자동 설정
- [ ] 일반 그래플레이 홈/탐색/추천/Daily/검색 어디에도 Biz 영상이 노출되지 않음
- [ ] 검색창에 Biz 코스 제목 입력 시 일반 사용자는 결과 없음, Biz 사용자는 결과 노출
- [ ] Biz 대시보드 라이브러리에 일반 크리에이터 영상이 보이지 않음
- [ ] 일반 크리에이터의 기존 lesson 노출/구독/즐겨찾기/진도 회귀 없음

### 단품판매

- [ ] Biz 라이브러리에서 `is_subscription_excluded=true` 인 코스 카드에 가격 표시
- [ ] 코스 상세 → 구매 버튼 → checkout → 결제 완료 → `user_courses` 행 생성 → lesson 시청 가능 (전체 플로우 회귀 없음)
- [ ] 구매한 Biz 코스는 `revenue_ledger` 에 `product_type='course'` + `creator_revenue = amount × 0.8` 로 기록 (settlement-system.md 공식 준수)
- [ ] 어드민 정산 대시보드에서 Biz 코스/lesson 매출이 일반 매출과 함께 누락 없이 집계

### 접근 권한

- [ ] Biz 미구독·미구매 사용자가 Biz lesson/코스 시청 진입 시 차단되고 결제·구독 유도 페이지로 이동
- [ ] Biz 단독 구독자(₩49,000, `is_academy_subscriber=true, is_subscriber=false`)는 일반 콘텐츠 시청 차단, Biz 콘텐츠만 시청 가능
- [ ] Grapplay 단독 구독자(₩29,000, `is_subscriber=true, is_academy_subscriber=false`)는 Biz 콘텐츠 시청 차단, 일반 콘텐츠만 시청 가능
- [ ] 번들 구독자(₩59,000, 둘 다 true)는 Biz + 일반 콘텐츠 모두 시청 가능
- [ ] 단품 구매자는 본인이 구매한 코스만 시청 가능 (구매 안 한 다른 Biz 콘텐츠는 차단)
- [ ] **`is_subscription_excluded=true` 단품판매 전용 콘텐츠는 구독자(Biz/Grapplay/번들 모두)라도 시청 차단**, 단품 구매(`user_courses`)가 있어야만 시청 가능 — CourseDetail 과 LessonDetail 양쪽 모두에서 일관 적용
- [ ] `is_complimentary_subscription` 무료 액세스 사용자는 운영자가 설정한 범위에 따라 접근

### 페이지 동작

- [ ] AcademyExperts 페이지: 데이터 0건이면 "곧 전문가를 소개합니다" empty state 표시, 무한 로딩 없음
- [ ] AcademyExpertReviews 페이지: 정상 로딩, 무한 retry 없음
- [ ] AcademyAnnouncements / AcademyFaq / AcademyPricing: 정상 표시 (정적 콘텐츠 또는 DB 테이블 신설 후 동작)
- [ ] AcademyMyPage "내강의": 구매 0건이면 적절한 empty state + Biz 라이브러리 CTA

### 전문가 권한

- [ ] `creators.is_academy_expert=true` 인 크리에이터만 `is_academy=true` 콘텐츠 생성 가능
- [ ] 어드민 UI에서 운영자가 토글로 Biz 전문가 지정/해제 가능
- [ ] 해제된 크리에이터의 기존 Biz 콘텐츠는 유지되지만 신규 생성 불가

### 매출 분리

- [ ] 어드민 정산 대시보드에서 "Biz 매출" 별도 카드 표시 (월별 코스 직접판매·lesson 직접판매·Biz 구독료)
- [ ] [revenue-reconciliation.md](./revenue-reconciliation.md) 의 reconciliation cron 이 Biz 매출도 정상 검증

---

## 7. 디자인 요구사항

**플랫폼:** [x] 웹  [x] 관리자/내부 시스템  [ ] iOS/Android (이번 범위 외)

**디자인 필요 화면**:
- Biz 라이브러리 코스 카드 (가격 + "구매" 버튼)
- Biz lesson 카드 (가격 + "구매" 버튼, 코스 카드와 구분되는 시각적 톤)
- Biz 코스 상세 페이지 결제 진입 영역
- 어드민 lesson 목록에 BIZ 뱃지 (선택)

**브랜드:** zinc 톤, 금액 천단위 콤마 + ₩, Biz 영역은 약간 다른 액센트 색(예: indigo)으로 일반과 구분 가능하면 좋음

---

## 8. 기술 고려사항

**의존성:**
- `lessons`, `courses`, `user_courses`, `user_lessons` 테이블
- `lib/api-lessons.ts`, `lib/api.ts` (소비자 lesson 쿼리들)
- `lib/api-accessible-content.ts`, `lib/api-recommendations.ts`, `lib/api-daily.ts`
- `components/CourseCard.tsx`, `pages/CourseDetail.tsx`, `pages/Checkout.tsx`
- `pages/academy-expert/AcademyExpertDashboard.tsx`, `pages/academy-expert/AcademyCourseEditor.tsx`
- `pages/academy/AcademyLibrary.tsx`
- [settlement-system.md](./settlement-system.md) 의 정산 비율 단일 상수

**데이터 / 트래킹:**
- `lessons.is_academy` 컬럼 신규
- `user_lessons` 테이블 (이미 있으면 재활용)
- 인덱스: `idx_lessons_is_academy WHERE is_academy=true`
- 트리거: `trg_sync_lesson_is_academy`

**성능 / 확장성:** 인덱스 추가로 영향 무시 가능

**보안 / 개인정보:** 기존 RLS 정책 유지. 구매한 user_courses/user_lessons 만 lesson 접근 허용하는 access check 검증.

---

## 9. 성공 지표

**핵심 지표:**
- 일반 그래플레이 사용자 피드/검색에서 Biz 콘텐츠 노출 건수 — **0건 / 30일**
- Biz 코스·lesson 단품 구매 매출 — 출시 후 측정 (베이스라인 0)

**보조 지표:**
- Biz 라이브러리 → 코스 상세 → 결제 전환율
- Biz 검색 결과 클릭률

---

## 10. 리스크 및 미해결 이슈

**예상 리스크:**
- 기존 academy 코스 lesson 백필 실패 시 분리 효과 미달 — 대응: 마이그레이션 후 데이터 검증 쿼리 의무화
- 일반 소비자 쿼리 일부에 `is_academy=false` 누락 시 Biz 콘텐츠가 계속 노출됨 — 대응: 자동 회귀 테스트 (Biz lesson 1건 시드 후 모든 소비자 쿼리에서 미노출 확인)
- 구매한 사용자가 Biz lesson 시청 시 access check 가 잘못되어 차단될 수 있음 — 대응: user_courses/user_lessons 가 있으면 is_academy 필터 우회하는 access 로직 명시
- **모바일 앱(Capacitor) 인앱결제 정책** — iOS/Android 앱 내에서 외부 결제(Stripe/Toss 등)로 디지털 콘텐츠 판매 시 앱스토어 약관 위반 가능. 대응: 모바일 앱에서는 단품 구매 진입점을 숨기거나, 웹뷰 외부 브라우저로 결제 페이지 이동, 또는 앱스토어 인앱결제(IAP) 별도 통합. **론칭 전 반드시 정책 점검 필요.**
- **Biz 전문가 수동 선정의 확장성** — 운영팀이 모두 수동 지정하므로 전문가가 늘면 운영 부담 증가. 대응: 신청 폼 + 운영자 승인 워크플로우로 단계적 자동화 (Nice to have)

**논의 필요:**
- Biz 코스 가격대 가이드라인 (일반 코스와 다른 가격 정책 필요한지)
- Biz lesson 단품 가격 하한 (₩X 미만 결제 시 PG 수수료 비효율)
- Biz 콘텐츠가 일반 사용자 검색에 "프리미엄 표시"로 노출되는 마케팅 활용은 가능한가 (이번 범위 외이지만 향후 옵션)

---

## 11. 이해관계자

| 역할 | 담당자 | 책임 |
|---|---|---|
| 프로덕트 오너 | (운영팀) | Biz 도메인 전략·가격 정책 |
| 개발 리드 | TBD | 마이그레이션 + 쿼리 일제 정리 + 단품판매 흐름 |
| 디자이너 | TBD | 가격 표시 UI, Biz 영역 시각 차별화 |
| QA | TBD | 분리 회귀 시나리오 + 단품판매 e2e |

---

## 12. 첨부자료 및 링크

- 기존 분석 문서 (본 문서로 통합): [docs/bugs/biz-academy-separation.md](../bugs/biz-academy-separation.md)
- Biz 가격 입력 UI (완성): [pages/academy-expert/AcademyCourseEditor.tsx:586-597](pages/academy-expert/AcademyCourseEditor.tsx#L586-L597)
- Biz 코스 생성/저장 API: [lib/api-academy.ts](lib/api-academy.ts)
- Biz 라이브러리: [pages/academy/AcademyLibrary.tsx](pages/academy/AcademyLibrary.tsx)
- 소비자 lesson 쿼리 (`is_academy` 필터 추가 대상): [lib/api-lessons.ts:172](lib/api-lessons.ts#L172), [lib/api.ts:1707](lib/api.ts#L1707), [lib/api-accessible-content.ts:201](lib/api-accessible-content.ts#L201), [lib/api-recommendations.ts:303](lib/api-recommendations.ts#L303), [lib/api-daily.ts:44](lib/api-daily.ts#L44)
- 결제 흐름: [pages/CourseDetail.tsx:502-527](pages/CourseDetail.tsx#L502-L527), [pages/Checkout.tsx](pages/Checkout.tsx), `checkout_with_coupon` SQL 함수
- 정산 공식 참조: [settlement-system.md](./settlement-system.md) 의 "영상 개별 구매 80:20"
- 정체 정리 대상 (dead code): `purchaseCourse()` [lib/api.ts:1089](lib/api.ts#L1089)

---

## 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|---|---|---|
| 2026-05-04 | 운영팀 | docs/bugs/biz-academy-separation.md 최초 작성 (분리 분석) |
| 2026-05-13 | 운영팀 | feature request 로 승격·통합 — 단품판매 완성(코스 단위 + lesson 단위) 추가, Checkout/CourseCard/access check 작업 포함, settlement-system.md 정산 공식 참조 |
| 2026-05-13 | 운영팀 | 론칭 체크리스트 통합 — 그래플레이 인프라 재활용 원칙 명시 (결제 PG/Checkout/환불/정산/출금/모바일/약관 모두 기존 시스템), Biz 전용 추가 항목 분리 (시청 권한 함수, 전문가 수동 지정, 매출 분리 뷰, 백필 검증, 롤백 플랜, 모바일 IAP 정책 점검) |
| 2026-05-13 | 운영팀 | DB 스키마 누락 4건 Critical 추가 — `biz_expert_reviews` 테이블 부재 (전문가/리뷰 페이지 무한 로딩 원인), `users.is_academy_subscriber` 컬럼 부재 (Biz 권한 분기 실패 잠재 원인), `users.academy_subscription_end_date` 부재, `academy_announcements/faqs/pricing` 테이블 부재. LessonDetail `is_subscription_excluded` 검증 누락 추가. React Query retry 정책 조정 (영구 에러 무한 retry 방지). |
