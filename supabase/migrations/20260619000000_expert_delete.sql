-- ───────────────────────────────────────────────────────────
-- 전문가 삭제 — 관리자만. is_admin() 헬퍼 재사용. 재실행 안전.
-- 주의: courses/ebooks.expert_id FK가 연결돼 있으면 DB가 삭제를 막는다(앱에서 안내).
-- profiles.expert_id는 on delete set null로 자동 해제된다.
-- ───────────────────────────────────────────────────────────
drop policy if exists "admin deletes expert" on experts;
create policy "admin deletes expert" on experts for delete using (is_admin());
