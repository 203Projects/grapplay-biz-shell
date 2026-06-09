# Phase 2 — 마이페이지 + 위시리스트 (읽기 경로)

> 선행: [00-db-schema.md](./00-db-schema.md), [01-auth.md](./01-auth.md) · 후행: 04(결제가 여기에 수강을 채움)

## 목표

마이페이지를 목업에서 실데이터로 전환한다. 로그인한 사용자의 **실제 수강 강의(enrollments)** 와
**위시리스트(wishlist)** 를 표시하고, 강의 카드/구매바의 하트가 DB에 영속되게 한다.

이 Phase는 **읽기·위시 쓰기**만 다룬다. 수강 등록을 채우는 것은 결제(Phase 04) 또는 무료
self-enroll. 검증 시에는 수강 행을 수동 삽입해 표시를 확인한다.

## 산출물 (새 파일)

### `src/lib/userData.ts` — 사용자 데이터 read/위시 mutation
- `getMyEnrollments(userId)` — `enrollments` 조회 후 `useBizData`의 `getCourse`/전자책으로 조인(또는 Supabase join). 반환: `{ item_type, item_id, progress, course|ebook }[]`.
- `getMyWishlist(userId)` — `wishlist` 조회 → 동일 조인.
- `addWishlist(userId, type, id)` / `removeWishlist(userId, type, id)` — `wishlist` insert/delete.
- `isWishlisted(...)` 또는 위시 Set을 한 번 로드해 컴포넌트에 전달.

> 조인 전략: 강의/전자책 메타는 이미 `useBizData`가 캐시하므로, enrollments/wishlist는 id 목록만
> 받아 클라이언트에서 매핑하는 게 단순하다(추가 쿼리 최소화).

## 수정 파일

### `src/pages/AcademyMyPage.tsx`
- `MY_PURCHASED_IDS`(목업 상수) 제거 → `useAuth().user.id`로 `getMyEnrollments` 호출.
- "수강 중" 탭 = enrollments(강의), 진행률은 `enrollments.progress`.
- "관심 강의" 탭 = wishlist.
- 프로필 헤더 이메일: 하드코딩 → `useAuth().user.email`, 이름 → `profile.display_name`.
- 빈 상태 UI(수강/위시 0건) 추가.
- (선택) "주문" 탭 — `orders` 조회해 결제 내역 표시(Phase 04 이후 데이터 참).

### `src/components/PurchaseBar.tsx` (35~41줄 위시 하트)
- 로컬 `useState` → `wishlist` 테이블 연동.
- 초기값: 부모(상세 페이지)에서 위시 여부를 받아 표시.
- 토글: 로그인 상태면 `addWishlist`/`removeWishlist` 호출, 비로그인이면 `/auth`로 유도.
- 낙관적 업데이트(즉시 토글 후 실패 시 롤백) 권장.

### (선택) `src/components/CourseCard.tsx` / `EbookCard.tsx`
- 카드의 하트도 동일 패턴으로 위시 연동(상세와 일관). 범위가 크면 상세 구매바만 우선.

## 데이터 신선도 메모

- 위시 토글 후 마이페이지 재진입 시 최신 반영되도록, 위시 Set은 페이지 진입마다 재조회하거나
  간단한 전역 상태(컨텍스트)로 공유. `useBizData` 캐시(강의 메타)는 변하지 않으므로 무관.

## 검증

1. 로그인 후 마이페이지 진입 → 수강 0건이면 빈 상태 표시.
2. SQL/MCP로 수강 행 수동 삽입:
   ```sql
   insert into enrollments (user_id, item_type, item_id) values ('<uuid>','course','c1');
   ```
   → 마이페이지 "수강 중"에 c1 노출.
3. 강의 상세에서 하트 클릭 → `wishlist` 행 생성 확인(MCP `execute_sql`), 다시 클릭 → 삭제.
4. 마이페이지 "관심 강의"에 위시한 강의 표시.
5. 비로그인 상태로 하트 클릭 → `/auth`로 유도.
6. 다른 사용자 계정으로 로그인 시 서로의 수강/위시가 안 보임(RLS).
7. `npm run build` 통과.
