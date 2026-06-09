# 작업 2 — 모바일 푸터 / 하단 메뉴 (결제 페이지)

모바일에서 푸터는 기본 숨기고, **결제 페이지에서만** 하단 메뉴를 숨기고 푸터를 노출한다.

## 요구사항
1. **모바일 전체**: 푸터 숨김(데스크톱에만 표시).
2. **결제하기(`/checkout`)에서만**: 모바일 **하단 메뉴 숨김 + 푸터 노출**.

## 현재 상태 — [src/components/AcademyLayout.tsx](../../src/components/AcademyLayout.tsx)
- 모바일 하단 메뉴(`:88-113`): `!isReaderDetail`일 때 표시(작업 5에서 항목을 홈/검색/컨텐츠/내강의로 교체).
- 푸터(`:116`): 반응형 분기 없이 **항상 표시**(모바일에서도 보임).

## 변경
상단(`:16` 부근)에 플래그:
```ts
const isCheckout = pathname.startsWith('/checkout')
```

### 하단 메뉴(`:88`) — 결제에서 숨김
```tsx
{!isReaderDetail && !isCheckout && (
  <nav className="… grid-cols-4 … md:hidden"> … </nav>
)}
```

### 푸터(`:116`) — 모바일 기본 숨김, 결제에서 노출
```tsx
<footer className={`border-t border-slate-200 bg-slate-50 ${isCheckout ? '' : 'hidden md:block'}`}>
```
> 결과: 일반 페이지(모바일) = 푸터 X + 하단 메뉴 O. 결제 페이지(모바일) = 푸터 O + 하단 메뉴 X.
> 데스크톱 = 항상 푸터 O(하단 메뉴는 원래 `md:hidden`).

## 엣지 케이스
- `/payments/success`·`/payments/fail` 미포함 → `startsWith('/checkout')`로 한정.
- 결제 페이지 하단 고정 결제바와 푸터가 겹치지 않게 여백(`pb-*`) 확인.

## 검증
- 모바일 일반 페이지: 푸터 X, 하단 메뉴 O.
- 모바일 `/checkout`: 하단 메뉴 X, 푸터 O.
- 데스크톱: 모든 페이지 푸터 정상.
