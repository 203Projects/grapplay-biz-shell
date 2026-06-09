-- ───────────────────────────────────────────────────────────
-- 전자책 상세페이지(랜딩) 블록 컬럼 추가
-- ───────────────────────────────────────────────────────────

alter table ebooks add column if not exists use_landing_page boolean not null default false;
alter table ebooks add column if not exists detail_blocks   jsonb   not null default '[]'::jsonb;
