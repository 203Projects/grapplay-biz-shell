-- ───────────────────────────────────────────────────────────
-- 강의 할인가(정가) 지원 — courses.original_price 추가
-- null 또는 price 이하이면 할인 없음(취소선 미표시). ebooks.original_price와 동일 의미.
-- ───────────────────────────────────────────────────────────
alter table courses add column if not exists original_price integer;
