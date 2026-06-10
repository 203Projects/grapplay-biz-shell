-- ───────────────────────────────────────────────────────────
-- 전자책 리뷰 (댓글형) — course_reviews 미러. 관리자 대시보드에서 열람/모더레이션.
-- 공개 read, 구매(수강)자 insert, 소유 전문가/관리자 update(숨김). 재실행 안전.
-- ───────────────────────────────────────────────────────────
create table if not exists ebook_reviews (
  id         text primary key,
  ebook_id   text references ebooks(id) on delete cascade,
  user_name  text not null,
  user_email text,
  content    text not null,
  hidden     boolean not null default false,
  created_at text
);
create index if not exists ebook_reviews_ebook_idx on ebook_reviews (ebook_id);

alter table ebook_reviews enable row level security;

drop policy if exists "public read ebook_reviews" on ebook_reviews;
create policy "public read ebook_reviews" on ebook_reviews for select using (true);

-- 구매자(전자책 수강)만 리뷰 작성
drop policy if exists "buyer inserts ebook review" on ebook_reviews;
create policy "buyer inserts ebook review" on ebook_reviews for insert
  with check (exists (
    select 1 from enrollments e
    where e.user_id = auth.uid() and e.item_type = 'ebook' and e.item_id = ebook_reviews.ebook_id
  ));

-- 소유 전문가는 자기 전자책 리뷰 숨김 관리
drop policy if exists "expert manages reviews on own ebook" on ebook_reviews;
create policy "expert manages reviews on own ebook" on ebook_reviews for update
  using (ebook_id in (select id from ebooks where expert_id = current_expert_id()))
  with check (ebook_id in (select id from ebooks where expert_id = current_expert_id()));

-- 관리자 모더레이션(숨김/해제) + 삭제
drop policy if exists "admin manages ebook_reviews" on ebook_reviews;
create policy "admin manages ebook_reviews" on ebook_reviews for update
  using (is_admin()) with check (is_admin());
drop policy if exists "admin deletes ebook_reviews" on ebook_reviews;
create policy "admin deletes ebook_reviews" on ebook_reviews for delete using (is_admin());

-- 시드 없음(목업 제거). 리뷰는 구매자가 작성하면 쌓인다.
