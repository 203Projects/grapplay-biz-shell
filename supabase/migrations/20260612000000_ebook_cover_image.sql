-- ───────────────────────────────────────────────────────────
-- 전자책 표지 이미지(썸네일) + 공개 'covers' 스토리지 버킷
-- ───────────────────────────────────────────────────────────

alter table ebooks add column if not exists cover_image text;

-- 공개 버킷 (강의·전자책 표지 공용)
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- 누구나 읽기(공개), 로그인 사용자는 업로드/수정 가능
drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "auth upload covers" on storage.objects;
create policy "auth upload covers" on storage.objects
  for insert to authenticated with check (bucket_id = 'covers');

drop policy if exists "auth update covers" on storage.objects;
create policy "auth update covers" on storage.objects
  for update to authenticated using (bucket_id = 'covers') with check (bucket_id = 'covers');
