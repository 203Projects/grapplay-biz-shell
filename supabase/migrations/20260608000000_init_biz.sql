-- 그래플레이 비즈 — 초기 스키마 (그래플레이 운영 DB와 완전히 분리된 별도 프로젝트)
-- 전문가 / 강의 / 전문가리뷰(별점) / 강의리뷰(댓글형)

-- ── 전문가 ──
create table if not exists experts (
  id         text primary key,
  name       text not null,
  title      text not null,
  avatar     text,
  bio        text,
  created_at timestamptz default now()
);

-- ── 강의 ──
create table if not exists courses (
  id                       text primary key,
  expert_id                text references experts(id) on delete cascade,
  title                    text not null,
  subtitle                 text,
  category                 text not null,
  price                    integer not null default 0,
  is_subscription_excluded boolean not null default false,
  cover                    text,
  thumb_emoji              text,
  lesson_count             integer not null default 0,
  duration_min             integer not null default 0,
  rating                   numeric(2,1) not null default 0,
  review_count             integer not null default 0,
  student_count            integer not null default 0,
  summary                  text,
  what_you_learn           jsonb not null default '[]'::jsonb,
  curriculum               jsonb not null default '[]'::jsonb,
  use_landing_page         boolean not null default false,
  detail_blocks            jsonb not null default '[]'::jsonb,
  review_reward_pdf_url    text,
  sort_order               integer not null default 0,
  created_at               timestamptz default now()
);
create index if not exists courses_category_idx on courses (category);
create index if not exists courses_expert_idx on courses (expert_id);

-- ── 전문가 리뷰 (별점, 전문가 1명당) ──
create table if not exists expert_reviews (
  id         text primary key,
  expert_id  text references experts(id) on delete cascade,
  user_name  text not null,
  rating     integer not null check (rating between 1 and 5),
  content    text,
  created_at text
);
create index if not exists expert_reviews_expert_idx on expert_reviews (expert_id);

-- ── 강의 리뷰 (댓글형, 별점 없음) ──
create table if not exists course_reviews (
  id             text primary key,
  course_id      text references courses(id) on delete cascade,
  user_name      text not null,
  user_email     text,
  content        text not null,
  hidden         boolean not null default false,
  pdf_sent_count integer not null default 0,
  created_at     text
);
create index if not exists course_reviews_course_idx on course_reviews (course_id);

-- ── RLS: 프론트(anon)에서 읽기만 허용 ──
alter table experts        enable row level security;
alter table courses        enable row level security;
alter table expert_reviews enable row level security;
alter table course_reviews enable row level security;

create policy "public read experts"        on experts        for select using (true);
create policy "public read courses"         on courses         for select using (true);
create policy "public read expert_reviews"  on expert_reviews  for select using (true);
create policy "public read course_reviews"  on course_reviews  for select using (true);
-- 쓰기(INSERT/UPDATE/DELETE) 정책은 인증/대시보드 연동 단계에서 추가 예정.
