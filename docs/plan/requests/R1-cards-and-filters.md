# R1 — 카드 · 필터 (요청 ① 무료 강의 필터, ④ 카드 통일)

## ① 무료 강의 필터 (pudufu 스타일 체크박스)
### 목표
강의/전자책 목록에서 **"무료만 보기" 체크박스**로 `price === 0` 항목만 필터.

### 현재 상태
- `src/pages/AcademyLibrary.tsx`: 카테고리 칩 + 정렬 셀렉트. `무료` 개념은 `price===0`(`formatPrice`가 '무료' 표기).
- `src/pages/AcademyEbooks.tsx`: 동일 구조.

### 변경
- 두 페이지에 `const [freeOnly, setFreeOnly] = useState(false)` 추가.
- 필터 체인에 `&& (!freeOnly || x.price === 0)` 추가.
- 카테고리 칩 줄 옆(또는 정렬 옆)에 체크박스 라벨 `무료만`(pudufu 톤: 둥근 토글형) 배치.

## ④ 강의/전자책 카드 통일 (전문가 이름)
### 목표
전자책 카드에는 저자(`avatar + author`)가 보이는데 **강의 카드에는 전문가 이름이 없음**. 통일.

### 현재 상태
- `EbookCard.tsx`: `{ebook.avatar} {ebook.author}` 표시.
- `CourseCard.tsx`: 별점·구매수·강수만 표시, 전문가 정보 없음.
- 강의→전문가 연결: `course.expertId` → `useBizData().getExpert(id)` → `{avatar, name}`.

### 변경
- `CourseCard`에서 `useBizData()`로 `getExpert(course.expertId)` 조회.
- 제목 아래 메타 줄 위에 전자책 카드와 **동일한 포맷**(`{expert.avatar} {expert.name}`) 한 줄 추가.
- 전문가 아바타가 사진(`avatarUrl`)이면 작은 원형 이미지, 이모지면 그대로 (R4와 호환).

### 검증
- 강의 카드·전자책 카드 모두 작성자(전문가/저자) 한 줄이 동일 위치에 노출.
- "무료만" 체크 시 유료 항목 사라짐.
</content>
