# R5 — 콘텐츠 에디터 텍스트 꾸미기 (요청 ⑨)

## 목표
랜딩(리치 상세페이지) 제작 시 텍스트의 **굵기 / 크기 / 색상**을 지정할 수 있게.

## 현재 상태
- `DetailBlock = { id, type: 'heading'|'text'|'image', value: string }` (`src/data/mock.ts`).
- 에디터: `AcademyCourseEditor.tsx`, `AcademyEbookEditor.tsx` — 블록 추가/순서/삭제, heading=input, text=textarea.
- 렌더: `AcademyCourseDetail.tsx`(+ebook detail) — heading/text 스타일 **하드코딩**.

## 변경 (DB 무관 — JSONB 안에 스타일 필드 추가, 하위호환)
- `DetailBlock`에 선택 스타일 추가:
  ```
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  weight?: 'normal' | 'medium' | 'bold' | 'black'
  color?: string   // hex (예: #7c3aed) 또는 프리셋 키
  align?: 'left' | 'center' | 'right'
  ```
- 에디터: heading/text 블록마다 작은 툴바(크기·굵기·색상 picker·정렬). 색상은 프리셋 스와치 + 직접 입력.
- 렌더(상세페이지): 스타일 → Tailwind 클래스/인라인 style 매핑 헬퍼 `blockStyle(b)` 공통화.
  값 없으면 기존 기본값 유지(하위호환).

## 검증
- 에디터에서 텍스트 굵기/크기/색상 변경 → 상세페이지에 그대로 반영.
- 기존(스타일 없는) 블록은 종전과 동일하게 표시.
</content>
