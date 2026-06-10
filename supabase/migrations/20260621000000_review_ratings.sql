-- ───────────────────────────────────────────────────────────
-- 리뷰에 별점(rating) 추가 — 평점을 실제 후기에서 산출(가짜 고정값 대체).
-- 강의/전자책 리뷰 모두 1~5 별점. 기존 행은 null(평점 미포함). 재실행 안전.
-- ───────────────────────────────────────────────────────────
alter table course_reviews add column if not exists rating smallint;
alter table ebook_reviews  add column if not exists rating smallint;
