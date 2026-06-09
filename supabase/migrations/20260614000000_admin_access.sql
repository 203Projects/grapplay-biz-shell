-- ───────────────────────────────────────────────────────────
-- 관리자(admin) 접근 정책 — 회원/주문/수강 전체 조회 + 전문가/리뷰 관리
-- is_admin() 보안 정의자 헬퍼 재사용 (자기참조 재귀 없음).
-- RLS는 permissive OR이므로 기존 "본인만" 정책과 합집합으로 동작 →
-- 일반 사용자 접근 범위에는 영향 없음.
-- ───────────────────────────────────────────────────────────

-- profiles: 관리자는 전체 회원 read (본인 read 정책에 admin SELECT 추가)
drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select using (is_admin());

-- orders: 관리자는 전체 주문/GMV read
drop policy if exists "admin reads all orders" on orders;
create policy "admin reads all orders" on orders for select using (is_admin());

-- enrollments: 관리자는 전체 수강 read
drop policy if exists "admin reads all enrollments" on enrollments;
create policy "admin reads all enrollments" on enrollments for select using (is_admin());

-- experts: 관리자만 생성/수정 (지금까지 write 정책이 없어 수동 SQL만 가능했음)
drop policy if exists "admin inserts expert" on experts;
create policy "admin inserts expert" on experts for insert with check (is_admin());
drop policy if exists "admin updates expert" on experts;
create policy "admin updates expert" on experts for update
  using (is_admin()) with check (is_admin());

-- course_reviews: 관리자도 숨김/모더레이션 update (전문가-소유 정책에 admin 절 추가)
drop policy if exists "admin manages course_reviews" on course_reviews;
create policy "admin manages course_reviews" on course_reviews for update
  using (is_admin()) with check (is_admin());

-- expert_reviews: 관리자가 부적절한 별점 리뷰 삭제 가능하도록
drop policy if exists "admin deletes expert_reviews" on expert_reviews;
create policy "admin deletes expert_reviews" on expert_reviews for delete using (is_admin());
