-- ───────────────────────────────────────────────────────────
-- 그래플레이 비즈 — 인증/주문/수강/위시 스키마 + 소유자 쓰기 정책
-- (그래플레이 운영 DB와 분리된 비즈 전용 프로젝트에 적용)
-- ───────────────────────────────────────────────────────────

-- ── 역할 enum ──
do $$ begin
  create type user_role as enum ('user','expert','admin');
exception when duplicate_object then null; end $$;

-- ── 프로필 (auth.users ↔ 역할 ↔ 전문가) ──
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  role         user_role not null default 'user',
  expert_id    text references experts(id) on delete set null, -- role='expert'일 때 연결
  created_at   timestamptz default now()
);
alter table profiles enable row level security;

-- 가입 시 프로필 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── RLS 헬퍼 (security definer로 정책 재귀 방지) ──
create or replace function current_expert_id()
returns text language sql stable security definer set search_path = public as $$
  select expert_id from public.profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- profiles 정책: 본인만 read, 본인만 insert/update, role/expert_id 자기승격 차단
drop policy if exists "read own profile" on profiles;
create policy "read own profile"  on profiles for select using (auth.uid() = id);
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role      = (select role      from public.profiles where id = auth.uid())
    and expert_id is not distinct from (select expert_id from public.profiles where id = auth.uid())
  );
-- → role/expert_id 승격은 service role(관리자)로만.

-- ── 주문 (토스 결제 1건 = 1행, 멱등 앵커) ──
create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  order_key    text not null unique,                       -- 클라이언트가 만든 토스 orderId
  item_type    text not null check (item_type in ('course','ebook')),
  item_id      text not null,                              -- courses.id 또는 ebooks.id (text)
  amount       integer not null,                           -- KRW, 서버 검증 가격
  status       text not null default 'pending'
               check (status in ('pending','paid','failed','canceled')),
  payment_key  text,                                       -- 토스 승인 시
  method       text,
  raw_response jsonb,                                       -- 토스 결제 객체 전체
  created_at   timestamptz default now(),
  paid_at      timestamptz
);
create index if not exists orders_user_idx on orders(user_id);
create index if not exists orders_item_idx on orders(item_type, item_id);
alter table orders enable row level security;

-- 본인 주문 read. 쓰기는 Edge Function(service role)만 → 클라이언트 insert/update 정책 없음.
drop policy if exists "read own orders" on orders;
create policy "read own orders" on orders for select using (auth.uid() = user_id);
-- 전문가는 자기 강의 주문을 매출 분석용으로 read
drop policy if exists "expert reads own course orders" on orders;
create policy "expert reads own course orders" on orders for select using (
  item_type = 'course'
  and item_id in (select id from courses where expert_id = current_expert_id())
);

-- ── 수강 등록 (접근 권한 부여) ──
create table if not exists enrollments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_type  text not null check (item_type in ('course','ebook')),
  item_id    text not null,
  order_id   uuid references orders(id) on delete set null, -- 무료는 null
  progress   integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, item_type, item_id)                      -- 멱등 grant
);
alter table enrollments enable row level security;

drop policy if exists "read own enrollments" on enrollments;
create policy "read own enrollments" on enrollments for select using (auth.uid() = user_id);
-- 무료 강의 self-enroll 허용 (유료는 Edge Function이 service role로 insert)
drop policy if exists "self enroll free course" on enrollments;
create policy "self enroll free course" on enrollments for insert with check (
  auth.uid() = user_id and order_id is null and item_type = 'course'
  and exists (select 1 from courses where id = enrollments.item_id and price = 0)
);
drop policy if exists "update own progress" on enrollments;
create policy "update own progress" on enrollments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 위시리스트 ──
create table if not exists wishlist (
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_type  text not null check (item_type in ('course','ebook')),
  item_id    text not null,
  created_at timestamptz default now(),
  primary key (user_id, item_type, item_id)
);
alter table wishlist enable row level security;
drop policy if exists "rw own wishlist" on wishlist;
create policy "rw own wishlist" on wishlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 기존 테이블에 소유자 쓰기 정책 추가 ──
-- courses: 소유 전문가만 CRUD
drop policy if exists "expert insert own course" on courses;
create policy "expert insert own course" on courses for insert
  with check (expert_id = current_expert_id() or is_admin());
drop policy if exists "expert update own course" on courses;
create policy "expert update own course" on courses for update
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());
drop policy if exists "expert delete own course" on courses;
create policy "expert delete own course" on courses for delete
  using (expert_id = current_expert_id() or is_admin());

-- course_reviews: 강의 소유 전문가가 숨김/PDF카운트 관리(update)
drop policy if exists "expert manages reviews on own course" on course_reviews;
create policy "expert manages reviews on own course" on course_reviews for update
  using (course_id in (select id from courses where expert_id = current_expert_id()))
  with check (course_id in (select id from courses where expert_id = current_expert_id()));
-- 수강생은 자기가 등록한 강의에 리뷰 작성(insert)
drop policy if exists "enrolled user inserts review" on course_reviews;
create policy "enrolled user inserts review" on course_reviews for insert
  with check (exists (
    select 1 from enrollments e
    where e.user_id = auth.uid() and e.item_type = 'course' and e.item_id = course_reviews.course_id
  ));
