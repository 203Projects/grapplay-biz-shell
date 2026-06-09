-- ───────────────────────────────────────────────────────────
-- 전문가 전문분야(카테고리) 컬럼 — 관리자가 추가/편집 시 지정
-- 강의/전자책과 동일 4종(마케팅/상권분석/연금/경영). nullable.
-- 재실행 안전.
-- ───────────────────────────────────────────────────────────
alter table experts add column if not exists category text;

-- 시드 전문가 분야 지정 (이미 값 있으면 보존)
update experts set category = '경영'    where id = 'e1' and category is null;
update experts set category = '마케팅'  where id = 'e2' and category is null;
update experts set category = '상권분석' where id = 'e3' and category is null;
update experts set category = '연금'    where id = 'e4' and category is null;
