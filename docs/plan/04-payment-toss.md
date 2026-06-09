# Phase 4 — 토스페이먼츠 결제 + Edge Function 승인

> 선행: [00](./00-db-schema.md), [01](./01-auth.md), [02](./02-mypage-wishlist.md) · 후행: [05](./05-settlement-payout.md)
> **상태: 구현 완료 · E2E 검증됨(테스트 키).** 아래는 실제 구현 기준 요약(원래 계획의 위젯 방식 → `payment()` 직접 결제로 변경됨).

## 실제 구현 요약 (2026-06-09)

- **방식 변경**: 토스 v2 위젯(`widgets()`)은 위젯 전용 키(`test_gck_...`)가 필요해, **`payment()` 직접
  결제 방식**으로 구현. API 개별 연동 키(`test_ck_...`)/시크릿(`test_sk_...`) 쌍 사용.
- 경로(앱이 bare path): `/checkout?type=&id=`, `/payments/success`, `/payments/fail` (앞 둘은 ProtectedRoute).
- 파일: [Checkout.tsx](../../src/pages/Checkout.tsx)(`loadTossPayments(CLIENT_KEY).payment({customerKey:user.id}).requestPayment({method:'CARD', amount:{currency:'KRW',value}, orderId, orderName, successUrl, failUrl, ...})`),
  [PaymentSuccess.tsx](../../src/pages/PaymentSuccess.tsx), [PaymentFail.tsx](../../src/pages/PaymentFail.tsx),
  Edge Function [confirm-payment](../../supabase/functions/confirm-payment/index.ts).
- 기본 테스트 키(미설정 시): client `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq` / secret `test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R`.
  `.env`의 `VITE_TOSS_CLIENT_KEY`로 override, 시크릿은 Edge Function `TOSS_SECRET_KEY`에만.
- 배포: Edge Function `confirm-payment` 배포 + `TOSS_SECRET_KEY` 시크릿 설정 완료.
- orderId = `crypto.randomUUID()` = `orders.order_key`. Edge Function이 멱등·금액 재검증 후
  `orders`(paid) + `enrollments` upsert. 구매 후 `/learn`·`/read`로 진입.

---

### (참고) 원래 계획 — 위젯 방식

## 목표

강의/전자책을 실제로 결제한다. 토스페이먼츠 위젯으로 결제 요청 → 성공 리다이렉트 →
**Supabase Edge Function이 시크릿 키로 서버 승인** → `orders`/`enrollments` 기록.
결제 완료 시 마이페이지(Phase 02)에 수강이 나타나며 루프가 닫힌다.

## 보안 핵심 (반복)

- **시크릿 키는 클라이언트 금지.** `VITE_*`에 절대 두지 않는다. 승인은 Edge Function에서만.
- **금액은 서버에서 재조회·검증.** 클라이언트가 보낸 amount를 그대로 믿지 않는다.
- **멱등.** `order_key` UNIQUE + "이미 paid면 즉시 성공" + `enrollments` UNIQUE.

## 패키지 / 환경변수

```
npm i @tosspayments/tosspayments-sdk     # v2 위젯 SDK (payment-widget-sdk v1 아님)
```

| 변수 | 위치 | 비밀 |
|---|---|---|
| `VITE_TOSS_CLIENT_KEY` | 클라이언트 `.env`, `.env.example` | 공개(client) |
| `TOSS_SECRET_KEY` | Edge Function secret | **비밀** |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function(자동 제공) | **비밀** |

개발은 토스 **테스트 키**(`test_ck_...` / `test_sk_...`)로 끝까지 검증 가능.

## 산출물 (새 파일)

### `src/pages/Checkout.tsx` — 결제 페이지 (`/academy/checkout?type=course&id=c1`)
- `ProtectedRoute`로 보호(로그인 필수). 쿼리에서 `type`,`id` 파싱 → `useBizData`로 아이템·표시가격 조회.
- **무료(price===0)**: 토스 생략, `enrollments` self-insert 후 마이페이지로.
- 유료 흐름:
  ```ts
  const orderId = crypto.randomUUID()                 // = orders.order_key
  const toss = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY)
  const widgets = toss.widgets({ customerKey: user.id })
  await widgets.setAmount({ currency: 'KRW', value: price })
  await widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' })
  await widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' })
  // 결제하기 클릭:
  await widgets.requestPayment({
    orderId,
    orderName: item.title,
    successUrl: `${location.origin}/academy/payments/success?type=${type}&id=${id}`,
    failUrl:    `${location.origin}/academy/payments/fail`,
    customerEmail: user.email,
    customerName: profile.display_name,
  })
  ```
- `#payment-method`, `#agreement` 컨테이너 div 렌더.

### `src/pages/PaymentSuccess.tsx` (`/academy/payments/success`)
- 쿼리 `paymentKey`,`orderId`,`amount`(+ `type`,`id`)를 읽어 Edge Function에 POST:
  ```ts
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), itemType: type, itemId: id }),
  })
  ```
- 성공(`ok`): "결제 완료" + "내 강의로 가기"(`/academy/my`). 실패: 재시도/문의 안내.
- 중복 호출(뒤로가기/새로고침) 대비 → Edge Function 멱등이 처리.

### `src/pages/PaymentFail.tsx` (`/academy/payments/fail`)
- 쿼리 `code`,`message` 표시 + "다시 시도"(checkout으로).

### `supabase/functions/confirm-payment/index.ts` — Deno Edge Function
책임(전부 서버, 멱등):
1. **인증**: `Authorization` Bearer → 요청 범위 클라이언트로 `getUser()` → `user.id`.
2. body 파싱: `{ paymentKey, orderId, amount, itemType, itemId }`.
3. **멱등 확인**: service-role 클라이언트로 `orders.order_key = orderId` 조회.
   이미 `status='paid'`면 즉시 `{ ok: true }` 반환.
4. **가격 재검증**: `itemType`에 따라 `courses`/`ebooks`에서 `price` 재조회 →
   `price === amount` 아니면 거부(400).
5. **토스 승인 호출**:
   ```ts
   const auth = btoa(`${Deno.env.get('TOSS_SECRET_KEY')}:`)   // 콜론 뒤 빈 비번
   const r = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
     method: 'POST',
     headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
     body: JSON.stringify({ paymentKey, orderId, amount }),
   })
   const pay = await r.json()
   ```
   non-2xx면 `orders` upsert(status='failed') 후 토스 에러 반환.
6. **성공(`pay.status === 'DONE'`)**: service-role로
   - `orders` upsert(order_key, user_id, item_type, item_id, amount, status='paid', payment_key, method, raw_response=pay, paid_at=now),
   - `enrollments` upsert(user_id, item_type, item_id, order_id) — UNIQUE로 멱등,
   - (선택) `courses.student_count`/`ebooks.buyer_count` +1.
7. **CORS**: `OPTIONS` 프리플라이트 + `Access-Control-Allow-Origin` 헤더 처리.
8. `import { createClient } from 'jsr:@supabase/supabase-js@2'`. service-role 클라이언트가 RLS 우회.

## 수정 파일

- `src/components/PurchaseBar.tsx` "구매하기" → `navigate('/academy/checkout?type=course&id=' + courseId)`.
- `src/pages/AcademyEbookDetail.tsx` "구매하기"(약 317~322줄) → `/academy/checkout?type=ebook&id=...`.
  무료 전자책은 기존 unlock 대신 self-enroll(또는 즉시 열람).
- `src/App.tsx`: `/academy/checkout`, `/academy/payments/success`, `/academy/payments/fail` 라우트 추가
  (checkout/success는 `ProtectedRoute`).
- `.env.example`: `VITE_TOSS_CLIENT_KEY=` 추가.

## 코드 외 설정

1. **토스페이먼츠**: 가맹점 가입 → 클라이언트/시크릿 키 발급(개발은 테스트 키).
2. Edge Function 시크릿: `supabase secrets set TOSS_SECRET_KEY=test_sk_...`
   (또는 대시보드 Functions → Secrets). `SUPABASE_URL`/`SERVICE_ROLE_KEY`는 자동.
3. 배포: `mcp__claude_ai_Supabase__deploy_edge_function`(slug=`confirm-payment`) 또는 `supabase functions deploy`.
4. 토스 대시보드 또는 SDK 설정에서 successUrl/failUrl 도메인 허용(필요 시).

## 멱등성·무결성 요약

- `orders.order_key` UNIQUE + 4단계 "이미 paid면 단락" → 중복 승인 방지.
- `enrollments` UNIQUE(user,type,item) → 중복 수강 방지.
- 서버 가격 재조회 → 금액 위변조 방지.
- (향후) 사용자가 success 리다이렉트 전 탭을 닫는 경우 대비 **토스 웹훅** Edge Function 백스톱은
  [05 문서] 이후/선택 과제로. 동일 멱등 upsert 재사용.

## 검증 (토스 테스트 키)

1. 로그인 → 유료 강의 상세 "구매하기" → `/academy/checkout` → 위젯 렌더.
2. 테스트 결제수단으로 결제 → `/academy/payments/success` → Edge Function 승인 → "결제 완료".
3. `orders`에 `status='paid'` 1행, `enrollments`에 해당 강의 1행 생성(MCP 확인).
4. 마이페이지 "수강 중"에 강의 노출(Phase 02와 루프 닫힘).
5. 성공 페이지 새로고침/뒤로가기 → 중복 주문/수강 생성 안 됨(멱등).
6. 금액을 임의로 바꿔 호출 → 가격 불일치로 거부.
7. 무료 강의/전자책 → 토스 없이 즉시 수강 등록.
8. 결제 실패 시 `/academy/payments/fail`에 사유 표시.
9. `npm run build` 통과 + 시크릿 키가 클라이언트 번들에 없음 확인(`grep -r TOSS_SECRET dist/` → 없음).
