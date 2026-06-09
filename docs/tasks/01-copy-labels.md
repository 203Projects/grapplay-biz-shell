# 작업 1 — 카피·라벨 수정

두 가지 텍스트 변경: ① "체육관 운영" → "경영", ② 메뉴 "관심 강의" → "내 컨텐츠".

---

## ① "체육관 운영" → "경영"

### ✅ 결정: 카테고리까지 변경 (A안 확정)
카테고리 명을 **`경영`** 으로 통일한다(타입·목업·시드·**기존 DB 행**까지). 설명 카피의 "체육관 운영자"도
"체육관 경영자"로 함께 정리(B안 포함). 아래 A·B 둘 다 적용.

### A안 — 카테고리까지 변경 (확정)
| 위치 | 현재 | 변경 |
|---|---|---|
| [src/data/mock.ts:4](../../src/data/mock.ts#L4) | `'마케팅' \| '상권분석' \| '연금' \| '체육관 운영'` | `… \| '경영'` |
| [src/data/mock.ts:10](../../src/data/mock.ts#L10) | `{ key: '체육관 운영', emoji: '🏋️', desc: '운영 효율과 수익 구조 설계' }` | `key: '경영'` |
| [src/data/mock.ts:54](../../src/data/mock.ts#L54) | 전문가 title `15년차 체육관 운영 컨설턴트` | `15년차 체육관 경영 컨설턴트` |
| mock.ts:174/232, mockEbooks.ts | `category: '체육관 운영'` | `'경영'` |
| seed.sql / setup.sql / `20260609000100_ebooks.sql` | 시드 데이터 `체육관 운영` | `경영` |
| **DB 기존 행** | — | 새 마이그레이션: `update courses set category='경영' where category='체육관 운영';` (전자책은 category 컬럼 없음 — 확인) |

> ⚠️ 이미 적용한 마이그레이션 파일은 **수정 금지**. 카테고리 rename은 **새 마이그레이션 파일**
> (`20260615000000_rename_category.sql` 등)로 `update` 처리하고 [DB-SCHEMA.md](../plan/DB-SCHEMA.md)도 갱신.
> `is_subscription_excluded` 등 다른 컬럼엔 영향 없음.

### B안 — 설명 카피만 변경 (DB 무관)
| 위치 | 현재 | 변경(예) |
|---|---|---|
| [src/components/AcademyLayout.tsx:124](../../src/components/AcademyLayout.tsx#L124) | 체육관 운영자와 지도자를 위한 비즈니스 교육 플랫폼. | 체육관 경영자와 지도자를 위한… |
| [src/pages/AuthPage.tsx:58](../../src/pages/AuthPage.tsx#L58) | 체육관 운영자와 지도자를 위한 비즈니스 교육 플랫폼 | 체육관 경영자와 지도자를 위한… |
| [index.html:6](../../index.html#L6) | `<title>그래플레이 비즈 — 체육관 운영자를 위한 비즈니스 교육</title>` | …체육관 경영자를 위한… |

> 에디터 placeholder([AcademyCourseEditor.tsx:75](../../src/pages/academy-expert/AcademyCourseEditor.tsx#L75),
> [AcademyEbookEditor.tsx:227](../../src/pages/academy-expert/AcademyEbookEditor.tsx#L227))의 "체육관 운영" 예시도
> 일관성 위해 함께 검토(선택).

### 검증
- 랜딩/라이브러리/카테고리 타일에 "경영"으로 표기, 깨진 필터 없음(라이브러리 카테고리 칩이 "경영"으로 동작).
- A안이면: DB `select distinct category from courses;` 에 `체육관 운영` 잔존 없음.
- `npm run build` 통과(유니온 타입 변경 시 `Filter`/매퍼 타입 에러 없는지).

---

## ② 메뉴 "관심 강의" → "내 강의"

### ✅ 결정: 라벨 "내 강의", 이동 대상 `/my`
- 라벨 `관심 강의` → **`내 강의`**, 이동 `to: '/my'`(찜이 아니라 마이페이지 기본 = 구매/수강한 강의).
- **이 항목은 작업 5의 네비게이션 전면 개편에 흡수된다.** 새 상단 메뉴 `홈 / 검색 / 컨텐츠 / 내강의`의
  마지막 항목이 곧 이 "내 강의"(`/my`)다. 단독 라벨 교체가 아니라 [05-nav-menu-restructure.md](./05-nav-menu-restructure.md)
  에서 메뉴 배열 전체를 교체하며 처리한다.

### 검증
- 상단 메뉴 마지막 항목이 "내강의"이며 클릭 시 `/my` 진입(작업 5 검증과 통합).
