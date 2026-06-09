-- 전자책 미리보기 페이지 수 (상세 페이지에서 앞 N페이지만 공개)
alter table ebooks add column if not exists preview_pages integer not null default 3;
