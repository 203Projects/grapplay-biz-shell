# 작업 6 — 페이지 내부 검색 제거 + 전자책 카테고리

검색은 **통합검색([07](./07-global-search.md))으로만** 한다. 강의/전자책/전문가 페이지 안의 검색은 없앤다.
대신 전자책에는 (검색이 아니라) **카테고리 필터**를 추가해 강의·전문가와 맞춘다.

## ✅ 결정 요약
- 강의/전자책/전문가 **페이지 내부 검색 박스 전부 제거**. 검색은 통합검색만.
- 전자책 **카테고리 필터 추가**(검색 아님). 전문가는 **카테고리 그대로**(변경 없음).

---

## ⑥-A. 강의(`/library`) — 검색 박스 제거
### 현재 — [src/pages/AcademyLibrary.tsx](../../src/pages/AcademyLibrary.tsx)
- 검색 input(`:34-45`) + `query` state(`:13`) + 제목/부제 필터(`:15-20`) 존재.
- 카테고리 칩 필터 + 정렬은 별도로 있음.
### 변경
- 검색 input 블록(`:33-45` 부근)·`query` state·`query` 필터 조건 **삭제**. **카테고리·정렬은 유지**.

## ⑥-B. 전자책(`/ebooks`) — 카테고리 추가(검색 없음)
### 현재 — [src/pages/AcademyEbooks.tsx](../../src/pages/AcademyEbooks.tsx)
- 필터/검색 없음. `ebooks` 전체를 그리드로 렌더. **`category` 필드 없음**([mockEbooks.ts](../../src/data/mockEbooks.ts)).
### ✅ 결정: `ebooks.category` 컬럼 신설 (강의와 동일 구조)
- DB: 새 마이그레이션 `alter table ebooks add column category text;` + 시드 행 update(`20260615…`),
  [DB-SCHEMA.md](../plan/DB-SCHEMA.md) 갱신.
- 타입: `Ebook`에 `category: Category` 추가([mockEbooks.ts](../../src/data/mockEbooks.ts)) + `api.ts` 매퍼 +
  전자책 에디터([AcademyEbookEditor.tsx](../../src/pages/academy-expert/AcademyEbookEditor.tsx))에 카테고리 선택.
- `CATEGORIES` 재사용(작업 ① "경영" 포함). 이 카테고리는 컨텐츠 허브([08](./08-content-hub.md))에서도 사용.
### 변경 (AcademyEbooks.tsx)
- `filter: '전체' | Category` state + 카테고리 칩(강의와 동일 스타일) 추가. **검색 input은 넣지 않음.**
- 목록: `ebooks.filter((e) => filter === '전체' || e.category === filter)`. 빈 결과 안내.

## ⑥-C. 전문가(`/experts`) — 변경 없음(검색 추가 취소)
### 현재 — [src/pages/AcademyExperts.tsx](../../src/pages/AcademyExperts.tsx)
- 카테고리 필터만 있고 검색 없음(`:10`,`:23-37`). → **그대로 둔다.** (앞 버전의 "검색 추가"는 취소.)

---

## 공통 / 재사용
- 카테고리 칩이 강의·전자책 두 곳(및 허브)에서 반복되므로 `src/components/CategoryChips.tsx`로 추출 검토(선택).
- `SearchBar`는 페이지 내부에선 쓰지 않음(통합검색·헤더에서만).

## 검증
- 강의 페이지: 검색 박스 없음, 카테고리·정렬만 동작.
- 전자책 페이지: 검색 박스 없음, 카테고리 칩 동작(에디터에서 저장한 카테고리 반영).
- 전문가 페이지: 그대로(카테고리만).
- 검색은 헤더/하단 "검색"(통합검색)으로만 가능.
- `npm run build` 통과.
