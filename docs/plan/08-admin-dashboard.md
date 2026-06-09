# Phase 8 — 관리자(admin) 대시보드

> 선행: [00 스키마](./00-db-schema.md), [01 인증](./01-auth.md), [03 지도자 대시보드](./03-expert-dashboard.md), [05 정산](./05-settlement-payout.md)
> 상태: **구현 완료** (2026-06-09). 코드/빌드 통과. DB 마이그레이션 2개는 SQL Editor로 적용 필요(아래 검증 참조).

## 목표

플랫폼 전체를 운영·관리할 **관리자 화면**을 만든다. 그동안 `admin` 역할과 `is_admin()` 헬퍼는
DB에 있었지만 **관리자용 UI가 전혀 없었다.** 그 결과:

- 전문가가 출금(정산)을 신청해도 **승인/지급 처리할 화면이 없음** (정산 RLS는 admin을 이미 허용).
- 회원을 전문가로 **승격시킬 경로가 없음** (`profiles.role` 자기승격 차단 → 수동 SQL만 가능).
- 전문가 레코드를 **생성/수정할 방법이 없음** (`experts`에 write 정책 없음).
- 전체 주문/매출(GMV)·회원·콘텐츠·리뷰를 한눈에 볼 수 없음.

지도자 대시보드([03](./03-expert-dashboard.md))와 **동일한 단일 페이지 + 내부 탭 패턴**을 미러링하되,
관리자 영역은 **violet** 색으로 구분한다. 접근은 `ProtectedRoute requireAdmin` + RLS `is_admin()`이
**이중으로** 강제한다.

## 화면 구성 (`/admin`, 7개 탭)

| 탭 | 기능 | 데이터 경로 |
|---|---|---|
| **개요** | 회원·전문가·강의·전자책 수, GMV, 결제완료 주문, 정산 대기 KPI | `getPlatformStats()` |
| **정산** | 전 전문가 출금신청 → 승인/반려/지급완료, 정산계좌 확인 | `listAllSettlements()` / `updateSettlementStatus()` |
| **회원** | 검색 + 전문가 승격 / 관리자 지정 / 일반회원 강등 | `listUsers()` / `setUserRole()` |
| **전문가** | 전문가 레코드 생성·수정 (승격 전 연결 대상) | `createExpert()` / `updateExpert()` |
| **콘텐츠** | 전 전문가 강의·전자책 조회·**직접 편집**·삭제 | `useBizData` + 기존 에디터 + `deleteCourse/deleteEbook` |
| **주문** | 전체 주문 + 상태 필터 + 매출 합계 | `listAllOrders()` |
| **리뷰** | 전체 강의 리뷰 숨김/해제 모더레이션 | `useBizData.courseReviews` + `setReviewHidden()` |

## 산출물 (새 파일)

### 데이터 — `src/lib/adminApi.ts`
expertApi와 동일 컨벤션(`if (!supabase) return …`, `{ data, error }`). 가능한 곳은 expertApi 재사용.
- `getPlatformStats()` → `{ users, experts, courses, ebooks, paidOrders, gmv, pendingSettlements }`
  (count `head:true` 쿼리들 + `orders.amount` 합)
- `listAllSettlements()` / `updateSettlementStatus(id, 'approved'|'paid'|'rejected', note?)`
- `getPayoutAccountFor(expertId)` — expertApi `getPayoutAccount` 재사용
- `listUsers(search?)` / `setUserRole(userId, role, expertId?)` (RPC `admin_set_user_role` 호출)
- `createExpert(input)` / `updateExpert(id, patch)` — `experts` insert/update (id = `e_<uuid8>`)
- `listAllOrders({ status? })`

### 페이지 — `src/pages/admin/`
- `AdminDashboard.tsx` — 셸(헤더 + 탭바 + 탭 렌더)
- `ui.tsx` — 공용 `StatCard`, `SettlementStatus` 뱃지 (violet 강조)
- `tabs/OverviewTab.tsx`, `tabs/SettlementsTab.tsx`, `tabs/UsersTab.tsx`, `tabs/ExpertsTab.tsx`,
  `tabs/ContentTab.tsx`, `tabs/OrdersTab.tsx`, `tabs/ReviewsTab.tsx`

### 마이그레이션 (새 파일 2개)
- `supabase/migrations/20260614000000_admin_access.sql` — admin read/관리 정책 (아래 DB 절)
- `supabase/migrations/20260614000100_admin_set_role.sql` — `admin_set_user_role()` RPC

## 수정 파일

- `src/components/ProtectedRoute.tsx` — `requireAdmin` prop 추가. 관리자는 `requireExpert`도 통과
  (전문가 전용 에디터 라우트에 admin 접근 허용).
- `src/App.tsx` — `/admin` 라우트(`ProtectedRoute requireAdmin`).
- `src/components/AcademyLayout.tsx` — 프로필 메뉴에 `role==='admin'`일 때 "관리자 대시보드" 링크.
- `src/pages/academy-expert/AcademyCourseEditor.tsx`, `AcademyEbookEditor.tsx` —
  소유 전문가를 **편집 시 기존 레코드의 `expert_id`**, 신규 시 라우트 state, 아니면 본인 순으로 결정
  (`targetExpertId`). 관리자가 다른 전문가 콘텐츠를 편집해도 **소유권이 유지**된다. 저장 후
  이동 경로(`backTo`)는 관리자면 `/admin`, 전문가면 `/expert/dashboard`.

## DB / RLS

> RLS는 **permissive OR**이므로, 기존 "본인만" 정책에 admin 정책을 **추가**하면 합집합으로 동작한다
> (일반 사용자 접근 범위에는 영향 없음).

### 마이그레이션 A — `20260614000000_admin_access.sql`
| 테이블 | 정책 | 동작 |
|---|---|---|
| profiles | `admin reads all profiles` | SELECT `using (is_admin())` — 전체 회원 조회 |
| orders | `admin reads all orders` | SELECT `using (is_admin())` — 전체 주문/GMV |
| enrollments | `admin reads all enrollments` | SELECT `using (is_admin())` |
| experts | `admin inserts expert` / `admin updates expert` | INSERT/UPDATE `is_admin()` — 전문가 생성·수정 |
| course_reviews | `admin manages course_reviews` | UPDATE `is_admin()` — 숨김/모더레이션 |
| expert_reviews | `admin deletes expert_reviews` | DELETE `is_admin()` — 부적절 별점 리뷰 삭제 |

### 마이그레이션 B — `20260614000100_admin_set_role.sql`
**역할 변경은 정책이 아니라 security-definer RPC로 한정한다.** `profiles.update`의 자기승격 잠금을
우회하는 유일한 허가 경로이므로, [`request_settlement()`](./05-settlement-payout.md) 패턴을 미러링한다.

```
admin_set_user_role(target_user uuid, new_role user_role, new_expert_id text default null) → profiles
```
- 본문 첫 줄에서 `is_admin()` 확인(definer 권한 update보다 먼저) → 비관리자는 `not admin` 예외.
- `new_role='expert'`면 `new_expert_id` 필수 + 실제 `experts` 행 존재 검증.
- expert가 아니면 `expert_id`를 비워 권한 잔존 방지.
- 하나의 RPC로 승격(expert)·강등(user)·관리자 지정(admin)을 모두 처리.

## 보안 / 권한

- 모든 관리자 read/write는 **관리자 본인 JWT + RLS `is_admin()`**로 처리(별도 service-role 경로 없음).
  service-role이 필요한 곳(결제·수강 부여)은 기존 Edge Function이 담당([04](./04-payment-toss.md)).
- 역할 승격은 RPC 단일 경로로만 가능 → 클라이언트가 `profiles.role`을 직접 못 바꾼다.
- 관리자 지정/강등/콘텐츠 삭제는 `confirm()` 확인. 정산 지급완료도 송금 확인 후 처리하도록 안내.

## 검증

1. **마이그레이션 적용**: 비즈 프로젝트 SQL Editor에 A·B 두 파일을 순서대로 실행.
2. **관리자 지정** (UI 경로 없음 — 의도된 설계):
   ```sql
   update profiles set role='admin' where email='<관리자 이메일>';
   ```
   적용 후 **재로그인** → 프로필 메뉴에 "관리자 대시보드" 노출, `/admin` 진입(비관리자는 `/`로 리다이렉트).
3. **개요**: KPI가 DB `count(*)`·GMV와 일치.
4. **정산**: 전문가로 출금 신청 1건 생성 → 관리자 정산 탭에 전 전문가 기준 표시 → 승인 → 지급완료
   시 `status`/`paid_at` 갱신, 전문가 대시보드에 반영.
5. **회원**: 이메일 검색 → 테스트 유저 전문가 승격(`role`/`expert_id` 갱신 + 해당 유저가 전문가
   대시보드 접근) → 강등. 비관리자가 RPC 호출 시 `not admin` 예외.
6. **전문가**: 생성·수정이 `/experts` 공개 페이지에 반영.
7. **콘텐츠**: 다른 전문가 강의 편집 후 저장 성공 + **소유권 유지**, 삭제 동작.
8. **주문/리뷰**: 전체 목록·GMV 일치, 리뷰 숨김이 공개 강의 페이지에서 사라짐.
9. **RLS 회귀**: 일반 유저로 `/admin` 리다이렉트 + `orders` 직접 조회 시 본인 주문만 반환(누수 없음).
10. `npm run build` 통과.

## 리스크 / 향후 과제

- **마이그레이션 미적용 시**: 개요·정산·회원·주문 탭이 빈 목록/권한 오류로 보인다(admin read 정책 부재).
  A·B 적용 후 정상.
- **최후의 관리자 강등 방지** 없음(관리자가 자신을 강등 가능). 필요 시 RPC에 마지막 admin 카운트 가드 추가.
- 정산 지급은 여전히 **수동 송금 후 상태 변경**. 자동 송금(지급대행)은 향후 과제([05](./05-settlement-payout.md)와 동일).
- 부적절 콘텐츠 **소프트 삭제/감사 로그** 없음(하드 delete). 운영 규모 커지면 도입 검토.
