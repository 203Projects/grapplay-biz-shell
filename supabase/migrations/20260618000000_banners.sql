-- ───────────────────────────────────────────────────────────
-- 랜딩 히어로 배너 — 관리자가 대시보드에서 편집 (요청 ②③)
-- 공개 read(active), 관리자만 write. is_admin() 보안정의자 헬퍼 재사용.
-- 재실행 안전.
-- ───────────────────────────────────────────────────────────
create table if not exists banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  gradient    text not null default 'from-violet-600 to-purple-500',
  cta         text,
  link        text,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now()
);

alter table banners enable row level security;

-- 공개: 활성 배너만 read (비로그인 포함)
drop policy if exists "public reads active banners" on banners;
create policy "public reads active banners" on banners for select using (active = true);

-- 관리자: 전체 read + 생성/수정/삭제
drop policy if exists "admin reads all banners" on banners;
create policy "admin reads all banners" on banners for select using (is_admin());
drop policy if exists "admin inserts banner" on banners;
create policy "admin inserts banner" on banners for insert with check (is_admin());
drop policy if exists "admin updates banner" on banners;
create policy "admin updates banner" on banners for update using (is_admin()) with check (is_admin());
drop policy if exists "admin deletes banner" on banners;
create policy "admin deletes banner" on banners for delete using (is_admin());

-- 시드 없음(목업 제거). 배너는 관리자 대시보드 → 배너 탭에서 직접 추가한다.
