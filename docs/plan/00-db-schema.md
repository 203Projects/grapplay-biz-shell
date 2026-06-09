# Phase 0 — DB 스키마 (인증/주문/수강/위시/전자책)

> 선행: 없음 · 후행: 01~05 전부가 이 스키마에 의존

## 목표

인증·결제·수강·위시·정산을 받칠 테이블과 RLS 정책을 한 번에 깐다. 기존 읽기 전용 스키마
(`experts`, `courses`, `expert_reviews`, `course_reviews`)는 유지하고, 그 위에 사용자 데이터
테이블을 추가하며, 기존 테이블에는 **소유자 쓰기 정책**을 덧붙인다.

이 Phase는 UI 변경이 없다. SQL 에디터 / Supabase MCP로만 검증한다.

## 산출물 (새 파일)

- `supabase/migrations/20260609000000_auth_orders_enroll.sql` — 아래 전체 SQL.
- `supabase/migrations/20260609000100_ebooks.sql` — 전자책 테이블 + 시드(선택 분리).

> 기존 `supabase/migrations/20260608000000_init_biz.sql` 옆에 둔다. 타임스탬프 접두 규칙 유지.

## 타입 규칙 (중요)

- `profiles.id` = **uuid** (auth.users 참조).
- `orders.user_id` / `enrollments.user_id` / `wishlist.user_id` = **uuid**.
- `item_id`(강의/전자책 참조)와 `expert_id` = **text** (기존 PK가 text).

---

## SQL — `20260609000000_auth_orders_enroll.sql`

```sql
-- ───────────────────────────────────────────────────────────
-- 그래플레이 비즈 — 인증/주문/수강/위시 스키마 + 소유자 쓰기 정책
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
create policy "read own profile"  on profiles for select using (auth.uid() = id);
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "update own profile" on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role      = (select role      from public.profiles where id = auth.uid())
    and expert_id is not distinct from (select expert_id from public.profiles where id = auth.uid())
  );
-- → role/expert_id 승격은 service role(관리자)로만. (아래 "전문가 연결" 참고)

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
create policy "read own orders" on orders for select using (auth.uid() = user_id);
-- 전문가는 자기 강의 주문을 매출 분석용으로 read
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

create policy "read own enrollments" on enrollments for select using (auth.uid() = user_id);
-- 무료 강의 self-enroll 허용 (유료는 Edge Function이 service role로 insert)
create policy "self enroll free course" on enrollments for insert with check (
  auth.uid() = user_id and order_id is null and item_type = 'course'
  and exists (select 1 from courses where id = enrollments.item_id and price = 0)
);
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
create policy "rw own wishlist" on wishlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── 기존 테이블에 소유자 쓰기 정책 추가 ──
-- courses: 소유 전문가만 CRUD
create policy "expert insert own course" on courses for insert
  with check (expert_id = current_expert_id() or is_admin());
create policy "expert update own course" on courses for update
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());
create policy "expert delete own course" on courses for delete
  using (expert_id = current_expert_id() or is_admin());

-- course_reviews: 강의 소유 전문가가 숨김/PDF카운트 관리(update)
create policy "expert manages reviews on own course" on course_reviews for update
  using (course_id in (select id from courses where expert_id = current_expert_id()))
  with check (course_id in (select id from courses where expert_id = current_expert_id()));
-- 수강생은 자기가 등록한 강의에 리뷰 작성(insert)
create policy "enrolled user inserts review" on course_reviews for insert
  with check (exists (
    select 1 from enrollments e
    where e.user_id = auth.uid() and e.item_type = 'course' and e.item_id = course_reviews.course_id
  ));
```

> `course_reviews.id`/`created_at`이 현재 `text`다. 수강생 insert 시 클라이언트가 id/created_at을
> 만들어 넣거나, 컬럼 기본값(`gen_random_uuid()::text`, `now()::text`)을 추후 보강한다.
> 이번 Phase에서는 정책만 깔고, 실제 리뷰 작성 UI는 후속에서 다룬다(현재 범위 밖이면 생략 가능).

---

## SQL — `20260609000100_ebooks.sql` (전자책 테이블)

`src/data/mockEbooks.ts`의 `Ebook` 인터페이스를 컬럼화한다.

```sql
create table if not exists ebooks (
  id            text primary key,
  title         text not null,
  subtitle      text,
  author        text,
  expert_id     text references experts(id) on delete set null,
  avatar        text,        -- 이모지
  cover         text,        -- Tailwind 그라데이션
  emoji         text,
  price         integer not null default 0,
  original_price integer,
  page_count    integer not null default 0,
  rating        numeric(2,1) not null default 0,
  buyer_count   integer not null default 0,
  summary       text,
  highlights    jsonb not null default '[]'::jsonb,
  pdf_url       text,
  is_new        boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz default now()
);
alter table ebooks enable row level security;
create policy "public read ebooks" on ebooks for select using (true);
create policy "expert insert own ebook" on ebooks for insert
  with check (expert_id = current_expert_id() or is_admin());
create policy "expert update own ebook" on ebooks for update
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());
create policy "expert delete own ebook" on ebooks for delete
  using (expert_id = current_expert_id() or is_admin());

-- 무료 전자책 self-enroll 정책 보강 (enrollments)
create policy "self enroll free ebook" on enrollments for insert with check (
  auth.uid() = user_id and order_id is null and item_type = 'ebook'
  and exists (select 1 from ebooks where id = enrollments.item_id and price = 0)
);
```

시드: `src/data/mockEbooks.ts`의 `EBOOKS` 배열을 `insert ... on conflict (id) do nothing`으로 옮긴다
(`supabase/seed.sql` 패턴 참고). 그러면 `src/lib/api.ts`/`useBizData`가 전자책도 라이브로 읽을 수 있다.

---

## 코드 외 설정 (Supabase 대시보드)

- 이 Phase에는 인증 provider 설정 불필요(트리거가 auth.users에 붙으므로 마이그레이션만으로 동작).
- 적용 방법:
  - MCP: `mcp__claude_ai_Supabase__apply_migration`(name + query)로 두 마이그레이션 순서대로 적용.
  - 또는 로컬 `supabase db push` / SQL 에디터 붙여넣기.

## 전문가 ↔ auth 사용자 연결

전문가 4명 규모이므로 **수동 승격** 채택:
1. 전문가가 일반 가입(Phase 01 완료 후).
2. 관리자가 service role로 실행:
   ```sql
   update profiles set role='expert', expert_id='e1'
   where id = '<해당 사용자 uuid>';
   ```
   (self-update 정책이 role/expert_id를 막으므로 반드시 service role / SQL 에디터로.)

> 향후 자동화가 필요하면 `experts.claim_code` + Edge Function 클레임 플로우로 확장(현재 범위 밖).

## 검증

1. 마이그레이션 적용 후 `mcp__claude_ai_Supabase__list_tables`로 5개 신규 테이블 존재 확인.
2. `mcp__claude_ai_Supabase__get_advisors`(security)로 RLS 누락/경고 점검.
3. 테스트 유저 1명 가입 → `profiles`에 자동 행 생성되는지 확인(트리거).
4. 그 유저로 `select * from orders` → 빈 결과(본인 것만, 에러 없이). 다른 유저 행은 안 보여야 함.
5. service role로 전문가 1명 승격 후 `current_expert_id()`가 해당 세션에서 'e1' 반환하는지 확인.
6. 무료 강의(c3/c6) self-enroll insert는 성공, 유료 강의 self-enroll insert는 정책 위반으로 거부되는지 확인.
