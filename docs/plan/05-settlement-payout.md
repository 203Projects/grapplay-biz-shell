# Phase 5 — 정산 (매출 집계 → 출금 신청/상태)

> 선행: [04-payment-toss.md](./04-payment-toss.md) — `orders`(status='paid')가 정산 원천

## 목표

지도자(전문가)가 자기 매출을 보고 정산(출금)을 신청·관리한다. 정산 가능 금액은
**결제로 쌓인 `orders`** 에서 계산한다(그래서 결제 다음 단계). 대시보드의 "정산"·"수익 분석"
탭을 실데이터로 채운다.

이번 범위는 **신청·상태 관리까지**. 실제 송금은 초기엔 관리자가 수동 처리. 자동 송금
(토스 지급대행 등)은 향후 과제로 명시만 한다.

## 정산 모델

```
정산 가능 잔액 = (소유 강의 paid orders 합계 × (1 − 수수료율))
              − 이미 정산 완료/신청된 금액
```

- 수수료율은 상수(예: 0.2 = 플랫폼 20%)로 시작. 추후 전문가별 설정 가능.
- 전자책 매출도 동일하게 포함(`item_type='ebook'` & 전자책 소유 전문가).

## 산출물 (새 마이그레이션)

`supabase/migrations/20260610000000_settlements.sql`

```sql
-- 정산 계좌 (전문가 1명당 1행)
create table if not exists payout_accounts (
  expert_id   text primary key references experts(id) on delete cascade,
  bank        text not null,
  account_no  text not null,
  holder      text not null,        -- 예금주
  updated_at  timestamptz default now()
);
alter table payout_accounts enable row level security;
create policy "expert rw own payout account" on payout_accounts for all
  using (expert_id = current_expert_id() or is_admin())
  with check (expert_id = current_expert_id() or is_admin());

-- 정산(출금) 신청
create table if not exists settlements (
  id           uuid primary key default gen_random_uuid(),
  expert_id    text not null references experts(id) on delete cascade,
  amount       integer not null,                       -- 신청 금액(수수료 차감 후)
  fee_rate     numeric(4,3) not null default 0.200,
  gross_amount integer not null,                        -- 차감 전 총매출 기준
  period_start date,
  period_end   date,
  status       text not null default 'requested'
               check (status in ('requested','approved','paid','rejected')),
  requested_at timestamptz default now(),
  paid_at      timestamptz,
  note         text
);
create index if not exists settlements_expert_idx on settlements(expert_id);
alter table settlements enable row level security;

-- 전문가는 본인 정산 read + 신청(insert)
create policy "expert reads own settlements" on settlements for select
  using (expert_id = current_expert_id() or is_admin());
create policy "expert requests settlement" on settlements for insert
  with check (expert_id = current_expert_id() and status = 'requested');
-- 승인/지급(상태 변경)은 관리자(service role)만 → update 정책은 is_admin()만
create policy "admin updates settlement" on settlements for update
  using (is_admin()) with check (is_admin());
```

> 잔액 계산을 정확·안전하게 하려면 **서버 집계가 바람직**하다. 옵션:
> - (간단) 클라이언트가 `orders`(본인 강의 read 정책 있음) 합계 − `settlements` 합계로 표시,
>   insert 시 RLS가 소유권만 보장. 금액 위변조 위험이 있으나 관리자 승인 단계에서 검증.
> - (권장) `request-settlement` Edge Function 또는 Postgres RPC(`security definer`)로 잔액을
>   서버에서 재계산해 insert. 신청 금액을 클라이언트가 못 부풀리게 한다.

### (권장) RPC `request_settlement()`
```sql
create or replace function request_settlement(p_fee_rate numeric default 0.200)
returns settlements language plpgsql security definer set search_path = public as $$
declare
  v_expert text := current_expert_id();
  v_gross  integer;
  v_already integer;
  v_amount integer;
  v_row settlements;
begin
  if v_expert is null then raise exception 'not an expert'; end if;
  select coalesce(sum(o.amount),0) into v_gross from orders o
    where o.status='paid' and (
      (o.item_type='course' and o.item_id in (select id from courses where expert_id=v_expert)) or
      (o.item_type='ebook'  and o.item_id in (select id from ebooks  where expert_id=v_expert)));
  select coalesce(sum(gross_amount),0) into v_already from settlements
    where expert_id=v_expert and status in ('requested','approved','paid');
  v_amount := floor((v_gross - v_already) * (1 - p_fee_rate));
  if v_amount <= 0 then raise exception 'no balance'; end if;
  insert into settlements (expert_id, amount, fee_rate, gross_amount, status)
    values (v_expert, v_amount, p_fee_rate, v_gross - v_already, 'requested')
    returning * into v_row;
  return v_row;
end $$;
```

## 산출물 (코드)

### `src/lib/expertApi.ts` 확장 (Phase 03 모듈 재사용)
- `getSettlementSummary(expertId)` → 총매출/수수료/기정산/잔액 계산값.
- `getPayoutAccount(expertId)` / `upsertPayoutAccount(...)`.
- `requestSettlement()` → RPC 호출(`supabase.rpc('request_settlement')`) 또는 insert.
- `getSettlements(expertId)` → 신청 내역 목록.

## 수정 파일

### `src/pages/academy-expert/AcademyExpertDashboard.tsx`
- **"정산" 탭**:
  - 정산 가능 잔액 카드(= summary), 수수료율 안내.
  - **계좌 등록/수정** 폼(`payout_accounts`).
  - **"출금 신청"** 버튼 → `requestSettlement()` → 성공 시 목록 갱신. 계좌 미등록 시 비활성.
  - 정산 신청 내역 테이블(금액/상태/일시).
- **"수익 분석" 탭**: Phase 03에서 연결한 `getExpertRevenue`에 더해 월별/누적 매출, 수수료 차감 후
  예상 정산액 표시. 하드코딩 제거.

## 코드 외 설정

- 수수료율 정책 확정(기본 20% 가정 — 사업자 결정 필요).
- 관리자 운영 흐름: 신청(`requested`) → 관리자 검토 → 계좌로 송금 → service role로
  `status='paid', paid_at=now()` 업데이트. (관리자 UI는 범위 밖, SQL/MCP로 처리.)

## 향후 과제 (이번 범위 밖, 명시만)

- **자동 송금**: 토스페이먼츠 지급대행/이체 API 연동으로 `approved` → 자동 `paid`.
- **정산 주기 자동화**: 월 마감 배치(cron/Edge Function)로 기간별 정산서 생성.
- **세금계산서/원천징수** 처리.

## 검증

1. 결제(Phase 04)로 paid 주문이 있는 전문가 로그인 → "정산" 탭에 잔액 = 매출×(1−수수료) 표시.
2. 계좌 등록 → `payout_accounts` 행 생성, 다시 수정 반영.
3. "출금 신청" → `settlements`에 `requested` 행 생성(RPC면 서버 계산 금액), 잔액이 그만큼 감소.
4. 잔액 0에서 신청 시 거부("no balance").
5. 다른 전문가의 정산/계좌가 안 보임(RLS).
6. 관리자(service role)가 `status='paid'`로 변경 → 내역 상태 갱신 확인.
7. `npm run build` 통과.
