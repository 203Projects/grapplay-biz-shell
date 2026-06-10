-- ───────────────────────────────────────────────────────────
-- 관리자 강의 리뷰 삭제 정책 (ebook_reviews는 이미 admin delete 정책 보유). 재실행 안전.
-- ───────────────────────────────────────────────────────────
drop policy if exists "admin deletes course_reviews" on course_reviews;
create policy "admin deletes course_reviews" on course_reviews for delete using (is_admin());
