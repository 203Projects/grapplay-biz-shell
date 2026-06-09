# 작업 4 — 카테고리 네비게이션

랜딩의 "무엇을 배우고 싶으세요?" 카테고리 타일을 누르면 **해당 카테고리로 필터된 강의 목록(`/library`)** 으로
이동하게 한다. (강의 페이지가 카테고리 필터를 갖는 1차 대상.)

## 현재 상태
- 랜딩 카테고리 타일: [src/pages/AcademyLanding.tsx:46-56](../../src/pages/AcademyLanding.tsx#L46-L56)
  — 모든 타일이 **무조건 `/library`** 로 이동(카테고리 정보 없이).
  ```tsx
  {CATEGORIES.map((c) => (
    <Link key={c.key} to="/library" …>
  ```
- 강의 페이지: [src/pages/AcademyLibrary.tsx](../../src/pages/AcademyLibrary.tsx) — 필터가 로컬 `useState`,
  URL 파라미터를 읽지 않음(초기값 `전체`).

## 변경

### 1) 랜딩 — 타일에 카테고리 쿼리 추가 ([AcademyLanding.tsx:49](../../src/pages/AcademyLanding.tsx#L49))
```tsx
to={`/library?cat=${encodeURIComponent(c.key)}`}
```

### 2) 강의 페이지 — `?cat=` 을 초기 필터로 반영 ([AcademyLibrary.tsx](../../src/pages/AcademyLibrary.tsx))
`useSearchParams`로 `cat`을 읽어 카테고리 필터 초기값에 적용. 유효한 `Category`일 때만(아니면 `전체`):
```tsx
import { useSearchParams } from 'react-router-dom'
const [params] = useSearchParams()
const initial = params.get('cat')
const validInitial: Filter = initial && CATEGORIES.some((c) => c.key === initial) ? (initial as Category) : '전체'
const [filter, setFilter] = useState<Filter>(validInitial)
```
> 칩 클릭 필터는 기존대로 로컬 state. (선택) 컨텐츠 허브(`/content`)도 동일 `?cat=` 패턴 지원 가능.

## 의존성
- 작업 ①(카테고리 "경영")과 동일 `CATEGORIES` 소스라 충돌 없음(타일 `c.key`가 자동으로 새 값).
- 작업 ⑥-A(강의 검색 박스 제거)와 **같은 파일**(AcademyLibrary.tsx)을 건드리므로 함께 적용.

## 검증
- 랜딩 카테고리 타일 클릭 → `/library?cat=<카테고리>` 이동 + 해당 카테고리 칩 **선택 상태**로 필터링.
- 잘못된 `?cat=xyz` → `전체`로 안전 폴백.
- `npm run build` 통과.
