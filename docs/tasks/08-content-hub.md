# 작업 8 — 컨텐츠 허브 (강의 + 전자책 통합 페이지, 모바일 진입)

**모바일 하단 메뉴 "컨텐츠"**(`/content`)가 가리키는 페이지. 모바일에서는 강의/전자책을 따로 두지 않고
**한 곳에서** 카테고리·정렬로 둘러본다. (데스크톱은 상단 메뉴의 강의·전자책으로 따로 본다 — 작업 5.)
참고: <https://pudufu.co.kr/home/pdf_premium> (전자책·강의를 한 그리드에 섞어 노출, 정렬: 추천/판매/최신,
카드에 타입 배지·평점·구매수).

## 위치 (중요)
- `/content`는 **모바일 하단 메뉴 전용 진입점**(작업 5). 기존 `/library`(강의)·`/ebooks`(전자책)는 **그대로
  유지**되며 데스크톱 상단 메뉴에서 따로 접근. `/content`가 둘을 합쳐 보여주는 **추가 페이지**일 뿐,
  기존 페이지를 대체/통합하지 않는다.
- 페이지 자체는 어느 화면 폭에서도 렌더되지만, **메뉴 노출은 모바일 하단에서만**.

## 목표
- `/content`에서 **모든 강의 + 전자책**을 통합 그리드로 표시.
- **카테고리 필터**(전체 + `CATEGORIES`, 작업 ①의 "경영" 포함) + **타입 필터**(전체/강의/전자책) +
  **정렬**(추천순/인기순/최신순).
- 페이지 내부 **검색 박스는 없음**(검색은 통합검색 전용 — 작업 ③·⑦).

## 현재 상태
- 강의 목록 `/library`([AcademyLibrary.tsx](../../src/pages/AcademyLibrary.tsx)), 전자책 목록
  `/ebooks`([AcademyEbooks.tsx](../../src/pages/AcademyEbooks.tsx))가 **분리**돼 있음. 통합 페이지 없음.
- `useBizData()`에 `courses`·`ebooks` 모두 로드. 전자책 카테고리는 작업 ⑦에서 `category` 컬럼 추가 후 사용.

## 변경

### 1) 신규 페이지 — `src/pages/ContentHub.tsx` (라우트 `/content`)
- `useBizData()`로 `courses`+`ebooks`를 가져와 **공통 아이템 형태**로 합친다:
  ```ts
  type HubItem =
    | { kind: 'course'; id; title; category; price; rating; popularity: studentCount; cover; emoji; … }
    | { kind: 'ebook';  id; title; category; price; rating; popularity: buyerCount;  cover; emoji; … }
  ```
- 상태: `cat: '전체' | Category`(URL `?cat=` 반영, 작업 ④와 동일 패턴 `useSearchParams`),
  `type: '전체' | '강의' | '전자책'`, `sort: '추천순' | '인기순' | '최신순'`.
- 필터 → 정렬 → 그리드 렌더:
  - 카테고리: `cat === '전체' || item.category === cat`
  - 타입: `type === '전체' || (type==='강의' ? kind==='course' : kind==='ebook')`
  - 정렬: 인기순 = popularity desc, 최신순 = 기본 역순, 추천순 = 기본(추후 가중치).
- 카드: 기존 `CourseCard`/`EbookCard` 재사용하되 **타입 배지**(강의/전자책)를 카드에 표시
  (pudufu처럼 한 그리드에 섞이므로 구분 필요). 그리드 `sm:grid-cols-2 lg:grid-cols-3`(기존과 동일).
- 상단 컨트롤 바: 타입 탭(전체/강의/전자책) + 카테고리 칩 + 정렬 셀렉트. 빈 결과 상태 안내.
- (선택, pudufu 요소) 실시간 "구매현황" 위젯 — **범위 밖**(추후). 지금은 표시하지 않음.

### 2) 라우트 등록 — [src/App.tsx](../../src/App.tsx)
- 공개 라우트 `/content` 추가.

### 3) 진입점 연결
- **모바일 하단 메뉴 "컨텐츠" → `/content`**(작업 5). 데스크톱 메뉴에는 추가하지 않음.
- 랜딩 카테고리 타일은 **`/library?cat=`**(작업 ④) 유지 — 컨텐츠 허브로 보내지 않음.
- 푸터 "강의 둘러보기"는 `/library` 유지.

## 재사용
- `CourseCard`([src/components/CourseCard.tsx](../../src/components/CourseCard.tsx)),
  `EbookCard`([src/components/EbookCard.tsx](../../src/components/EbookCard.tsx)),
  `CATEGORIES`([mock.ts](../../src/data/mock.ts)), 작업 ⑦에서 추출할 `CategoryChips`.

## 의존성
- **작업 ①**(카테고리 "경영") + **작업 ⑦**(전자책 `category` 컬럼)이 **선행**되어야 통합 카테고리 필터가
  강의·전자책 모두에서 정상 동작.
- **작업 5**(메뉴 "컨텐츠" 항목)와 함께 배포.

## 검증
- `/content` 진입 → 강의+전자책이 한 그리드에 섞여 표시, 카드에 타입 배지.
- 타입 탭(전체/강의/전자책), 카테고리 칩(경영 포함), 정렬 동작.
- `/content?cat=마케팅` 진입 시 해당 카테고리 선택 상태 + 강의·전자책 모두 필터.
- 모바일 상단 메뉴 "컨텐츠"로 진입 가능(하단 탭 없음).
- 카드 클릭 → `/courses/:id` 또는 `/ebooks/:id`.
- `npm run build` 통과.
