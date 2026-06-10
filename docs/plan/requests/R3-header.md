# R3 — 헤더 (요청 ⑤ 시작하기 제거)

## 목표
헤더 우상단에 비로그인 시 "로그인" + "시작하기"가 둘 다 노출됨 → **"시작하기" 삭제**, "로그인"만 유지.

## 현재 상태
`src/components/AcademyLayout.tsx`의 `HeaderUtil()` 컴포넌트, `if (!session)` 분기에서
`/auth` (로그인) Link와 `/auth?mode=signup` (시작하기) Link 둘 다 렌더.

## 변경
- "시작하기" Link(`/auth?mode=signup`) 제거.
- 남는 "로그인" Link는 `sm:block`(모바일 숨김)으로 되어 있으므로, 유일 버튼이 되도록
  항상 보이게 + 버튼 스타일(보라 그라데이션)로 승격해 시각적 CTA 유지.

## 검증
- 비로그인 헤더에 버튼 1개("로그인")만.
- 모바일에서도 로그인 진입 가능.
</content>
