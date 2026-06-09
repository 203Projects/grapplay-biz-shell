-- 강의 표지 이미지 (covers 버킷 재사용)
alter table courses add column if not exists cover_image text;
