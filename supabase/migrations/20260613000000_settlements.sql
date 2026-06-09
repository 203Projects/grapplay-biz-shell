-- ───────────────────────────────────────────────────────────
-- 정산 — 정산계좌 + 출금신청 (전문가 80% / 플랫폼 20%)
-- ───────────────────────────────────────────────────────────

-- 정산 계좌 (전문가 1명당 1행)
create table if not exists payout_accounts (
  expert_id  text primary key references experts(id) on delete cascade,
  bank       text not null,
  account_no text not null,
  holder     text not null,
  updated_at timestamptz default now()
);
alter table payout_accounts enable row level security;
drop policy if exists "expert rw own payout account" on payout_accounts;
create policy "expert rw own payout account" on payout_accounts for all
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());

-- 출금(정산) 신청
create table if not exists settlements (
  id           uuid primary key default gen_random_uuid(),
  expert_id    text not null references experts(id) on delete cascade,
  amount       integer not null,                     -- 전문가 수령액 (80%)
  fee_rate     numeric(4,3) not null default 0.200,  -- 플랫폼 수수료율 (20%)
  gross_amount integer not null,                     -- 차감 전 총매출 기준
  status       text not null default 'requested'
               check (status in ('requested','approved','paid','rejected')),
  requested_at timestamptz default now(),
  paid_at      timestamptz,
  note         text
);
create index if not exists settlements_expert_idx on settlements(expert_id);
alter table settlements enable row level security;

drop policy if exists "expert reads own settlements" on settlements;
create policy "expert reads own settlements" on settlements for select
  using (expert_id = current_expert_id() or is_admin());
drop policy if exists "expert requests settlement" on settlements;
create policy "expert requests settlement" on settlements for insert
  with check (expert_id = current_expert_id() and status = 'requested');
drop policy if exists "admin updates settlement" on settlements;
create policy "admin updates settlement" on settlements for update
  using (is_admin()) with check (is_admin());

-- 전문가가 자기 전자책 주문도 읽도록 (강의 주문은 기존 정책으로 이미 허용)
drop policy if exists "expert reads own ebook orders" on orders;
create policy "expert reads own ebook orders" on orders for select using (
  item_type = 'ebook' and item_id in (select id from ebooks where expert_id = current_expert_id())
);

-- 정산 신청 RPC — 서버에서 잔액 재계산 후 insert (금액 위변조 방지, 80% 지급)
create or replace function request_settlement()
returns settlements language plpgsql security definer set search_path = public as $$
declare
  v_expert  text := current_expert_id();
  v_gross   integer;
  v_already integer;
  v_amount  integer;
  v_row     settlements;
begin
  if v_expert is null then raise exception 'not an expert'; end if;

  -- 소유 강의/전자책의 결제완료 매출 합
  select coalesce(sum(o.amount), 0) into v_gross from orders o
   where o.status = 'paid' and (
     (o.item_type = 'course' and o.item_id in (select id from courses where expert_id = v_expert)) or
     (o.item_type = 'ebook'  and o.item_id in (select id from ebooks  where expert_id = v_expert))
   );

  -- 이미 신청/지급된 매출 기준 합
  select coalesce(sum(gross_amount), 0) into v_already from settlements
   where expert_id = v_expert and status in ('requested','approved','paid');

  v_amount := floor((v_gross - v_already) * 0.8);
  if v_amount <= 0 then raise exception 'no balance'; end if;

  insert into settlements (expert_id, amount, fee_rate, gross_amount, status)
   values (v_expert, v_amount, 0.200, v_gross - v_already, 'requested')
   returning * into v_row;
  return v_row;
end $$;
