-- ───────────────────────────────────────────────────────────
-- 카테고리 정리
-- 1) 강의 카테고리 "체육관 운영" → "경영" rename (기존 행 갱신)
-- 2) 전자책에 category 컬럼 신설 + 시드 행 카테고리 지정
-- 재실행 안전: if not exists / where 조건으로 멱등.
-- ───────────────────────────────────────────────────────────

-- 1) 강의 카테고리 rename
update courses set category = '경영' where category = '체육관 운영';

-- 2) 전자책 category 컬럼 (강의와 동일하게 4종: 마케팅/상권분석/연금/경영)
alter table ebooks add column if not exists category text;

-- 3) 시드 전자책 카테고리 지정 (이미 값이 있으면 덮어쓰지 않음 — 전문가/관리자 편집 보존)
update ebooks set category = '경영'    where id = 'eb1' and category is null;
update ebooks set category = '연금'    where id = 'eb2' and category is null;
update ebooks set category = '마케팅'  where id = 'eb3' and category is null;
update ebooks set category = '상권분석' where id = 'eb4' and category is null;
