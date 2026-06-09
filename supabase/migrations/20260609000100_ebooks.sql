-- ───────────────────────────────────────────────────────────
-- 그래플레이 비즈 — 전자책 테이블 (mockEbooks 인터페이스 컬럼화) + 시드
-- ───────────────────────────────────────────────────────────

create table if not exists ebooks (
  id             text primary key,
  title          text not null,
  subtitle       text,
  author         text,
  expert_id      text references experts(id) on delete set null,
  avatar         text,        -- 이모지
  cover          text,        -- Tailwind 그라데이션
  emoji          text,
  price          integer not null default 0,
  original_price integer,
  page_count     integer not null default 0,
  rating         numeric(2,1) not null default 0,
  buyer_count    integer not null default 0,
  summary        text,
  highlights     jsonb not null default '[]'::jsonb,
  pdf_url        text,
  is_new         boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz default now()
);

alter table ebooks enable row level security;

drop policy if exists "public read ebooks" on ebooks;
create policy "public read ebooks" on ebooks for select using (true);
drop policy if exists "expert insert own ebook" on ebooks;
create policy "expert insert own ebook" on ebooks for insert
  with check (expert_id = current_expert_id() or is_admin());
drop policy if exists "expert update own ebook" on ebooks;
create policy "expert update own ebook" on ebooks for update
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());
drop policy if exists "expert delete own ebook" on ebooks;
create policy "expert delete own ebook" on ebooks for delete
  using (expert_id = current_expert_id() or is_admin());

-- 무료 전자책 self-enroll 정책 보강 (enrollments)
drop policy if exists "self enroll free ebook" on enrollments;
create policy "self enroll free ebook" on enrollments for insert with check (
  auth.uid() = user_id and order_id is null and item_type = 'ebook'
  and exists (select 1 from ebooks where id = enrollments.item_id and price = 0)
);

-- ── 시드 (mockEbooks.ts와 동일, 재실행 안전) ──
-- 데모 PDF: 실제 서비스에선 Supabase Storage URL로 교체
insert into ebooks (id, title, subtitle, author, expert_id, avatar, cover, emoji, price, original_price, page_count, rating, buyer_count, summary, highlights, pdf_url, is_new, sort_order) values
  ('eb1','체육관 운영 체크리스트 50','오픈부터 운영까지 빠짐없이 챙기는 50가지','김도장','e1','🥋','from-violet-500 to-fuchsia-500','📋',0,null,42,4.9,1280,
   '체육관을 처음 열거나 운영 중인 관장님이 놓치기 쉬운 항목 50가지를 체크리스트로 정리했습니다. 인쇄해서 바로 쓰세요.',
   '["오픈 전 준비 항목 한눈에","월별 운영 점검 리스트","바로 인쇄해서 사용"]'::jsonb,
   'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',true,0),
  ('eb2','관장이 꼭 아는 세무 가이드','자영업자 절세, 이것만 알아도 충분','최재무','e4','💼','from-emerald-500 to-teal-500','📗',19000,29000,88,4.8,342,
   '복잡한 세무를 체육관 운영자 눈높이로 풀었습니다. 노란우산공제부터 부가세·종소세 신고까지 핵심만 담았어요.',
   '["노란우산공제 활용법","부가세·종소세 신고 절차","놓치기 쉬운 절세 포인트"]'::jsonb,
   'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',false,1),
  ('eb3','회원 상담 스크립트 모음','체험 → 등록 전환을 높이는 대화 템플릿','이마케팅','e2','📈','from-rose-500 to-pink-500','📕',14000,null,56,4.7,211,
   '체험 수업 상담에서 바로 쓰는 멘트와 흐름을 상황별로 정리했습니다. 그대로 읽기만 해도 전환율이 올라갑니다.',
   '["체험 상담 오프닝 멘트","가격 안내 시 대응법","등록 클로징 스크립트"]'::jsonb,
   'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',false,2),
  ('eb4','상권분석 실전 워크북','후보지를 점수로 비교하는 양식 포함','박상권','e3','🗺️','from-sky-500 to-indigo-500','📘',24000,34000,64,4.8,156,
   '공공데이터로 상권을 직접 분석하는 절차와, 후보지를 점수로 비교하는 워크시트를 담은 실습형 전자책입니다.',
   '["후보지 점수 비교 양식","유동인구 데이터 읽기","임대료 대비 손익 계산"]'::jsonb,
   'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',true,3)
on conflict (id) do nothing;
