# 작업 7 — 통합 검색 페이지 (강의·전자책·전문가 종류별)

헤더 검색창에 검색하면 **강의 / 전자책 / 전문가**를 종류별 섹션으로 보여주는 검색 결과 페이지를 만든다.

## 현재 상태
- 헤더 검색 input이 **동작하지 않음**: [AcademyLayout.tsx](../../src/components/AcademyLayout.tsx)
  데스크톱 `:32-43`, 모바일 `:49-59` 모두 `onSubmit={(e) => e.preventDefault()}` 로 폼만 막는다.
- 검색 결과 페이지 없음. `useBizData()`에 `courses`/`ebooks`/`experts`가 모두 로드돼 있어 클라이언트 검색 가능.

## 변경

### 1) 검색 페이지 — `src/pages/SearchResults.tsx` (신규, 라우트 `/search`)
- `useSearchParams`로 `q` 읽기. `useBizData()`로 세 종류 검색:
  ```ts
  const ql = q.trim()
  const courseHits = courses.filter((c) => c.title.includes(ql) || c.subtitle.includes(ql) || c.category.includes(ql))
  const ebookHits  = ebooks.filter((e) => e.title.includes(ql) || e.subtitle.includes(ql) || e.author.includes(ql))
  const expertHits = experts.filter((x) => x.name.includes(ql) || x.title.includes(ql) || x.bio.includes(ql))
  ```
- 레이아웃: 상단에 `"<q>" 검색 결과` + 총 건수. **종류별 섹션** 3개:
  - **강의** (`CourseCard` 그리드 재사용), **전자책** (`EbookCard` 재사용), **전문가** (Experts 카드 스타일 재사용).
  - 각 섹션 헤더에 건수, 섹션별 "더보기" → `/library?cat=`·`/ebooks`·`/experts` (선택).
  - 종류별 결과 0건이면 해당 섹션 숨김. 전체 0건이면 빈 상태 안내.
- (선택) 상단에 `전체 / 강의 / 전자책 / 전문가` 탭으로 종류 필터 — 기본 "전체"는 모든 섹션 표시.

### 2) 헤더 검색창을 검색 페이지로 연결 — [AcademyLayout.tsx](../../src/components/AcademyLayout.tsx)
- 데스크톱·모바일 두 폼을 controlled input + submit으로 변경:
  ```tsx
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const onSearch = (e) => { e.preventDefault(); const v = q.trim(); if (v) navigate(`/search?q=${encodeURIComponent(v)}`) }
  ```
  `onSubmit={onSearch}`, input은 `value={q} onChange`. (두 폼이 같은 state를 공유하도록 컴포넌트 상단에 둔다.)
- 엔터(submit) 시 `/search?q=...` 이동.

### 3) 라우트 등록 — [src/App.tsx](../../src/App.tsx)
- 공개 라우트 `/search` 추가(`*` 폴백 위).

## 재사용
- `CourseCard`([src/components/CourseCard.tsx](../../src/components/CourseCard.tsx)),
  `EbookCard`([src/components/EbookCard.tsx](../../src/components/EbookCard.tsx)), 전문가 카드 스타일
  ([AcademyExperts.tsx](../../src/pages/AcademyExperts.tsx) `:44-81`)을 그대로 재사용.
- 작업 6에서 `SearchBar`를 추출했다면 헤더에서도 재사용 가능.

## 의존성 / 순서
- **작업 5와 직접 연결**: 새 상단 메뉴의 **"검색"** 항목이 이 `/search` 페이지를 가리킨다. 모바일 상단
  검색바를 없애는 대신(작업 5), 검색은 메뉴 "검색" + 데스크톱 중앙 검색창으로만 진입. 함께 배포.
- 통합검색이 전문가 도달 경로를 보강하므로(작업 5에서 전문가를 메뉴에서 뺌) 전문가 결과 섹션 중요.
- 작업 ⑦(전자책 `category`)을 적용하면 전자책 검색 대상에 `category`도 포함 가능.

## 검증
- 헤더에서 "마케팅" 검색 → `/search?q=마케팅`, 강의/전자책/전문가 섹션이 종류별로 표시.
- 한 종류만 결과 있을 때 나머지 섹션 숨김, 전체 0건 시 빈 상태.
- 모바일/데스크톱 헤더 검색 모두 동작(엔터 이동).
- 카드 클릭 시 각 상세로 이동(`/courses/:id`, `/ebooks/:id`, `/experts/:id/reviews`).
- `npm run build` 통과.
