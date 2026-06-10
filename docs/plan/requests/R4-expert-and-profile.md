# R4 — 전문가 · 프로필 (요청 ⑥ 다중 카테고리, ⑦ 사진, ⑧ 마이페이지)

## 현재 상태
- `experts` 테이블: `avatar`(이모지 text), `category`(단일 text). `avatar_url` 없음.
- `profiles` 테이블: `display_name, role, expert_id`. 아바타/이미지 없음.
- `AcademyExperts.tsx`: 단일 선택 필터. `e.category`(단일) 또는 강의 기반 카테고리로만 매칭 → 다중 분야 미반영.
- 전문가 자기 프로필 편집 UI 없음(`AcademyExpertDashboard`는 읽기전용). 관리자만 `ExpertsTab`에서 편집.
- `AcademyMyPage.tsx`: 프로필 편집 폼 없음(이름 첫 글자 원형만).

## ⑥ 전문가 다중 카테고리 + 전문가 페이지 반영
### DB (`20260618000100_expert_categories.sql`)
```
alter table experts add column if not exists categories text[] not null default '{}';
update experts set categories = array[category] where category is not null and categories = '{}';
```
- 목업 `Expert`에 `categories?: Category[]`. `api.ts mapExpert`에 `categories: r.categories ?? (r.category ? [r.category] : [])`.
- `AcademyExperts.tsx` 필터: 다중 선택(`Set<Category>`)으로 변경, 매칭은
  `e.categories?.includes(filter) || e.category===filter || stats.categories.includes(filter)`.
  하나도 선택 안 하면 전체. 카드의 분야 칩도 `e.categories` 우선 표시.

## ⑦ 전문가 아이콘 → 사진 업로드
### DB (위 마이그레이션에 포함)
```
alter table experts add column if not exists avatar_url text;
```
- 목업 `Expert`에 `avatarUrl?: string`. `mapExpert`에 `avatarUrl: r.avatar_url ?? undefined`.
- 표시 헬퍼: `avatarUrl` 있으면 `<img class=rounded-full object-cover>`, 없으면 기존 이모지.
  적용처: `AcademyExperts` 카드, `ExpertsTab`, 강의/전자책 카드 작성자, 전문가 리뷰 페이지.
- 업로드: `uploadToCovers(file, 'avatars')`. 관리자 `ExpertsTab` 폼 + 전문가 마이페이지에 파일 입력.

## ⑧ 마이페이지 프로필 편집 (전문가는 본인 이미지·프로필)
### DB
```
alter table profiles add column if not exists avatar_url text;
```
- `auth.tsx Profile`에 `avatar_url` 추가, select에 포함.
- `AcademyMyPage.tsx`에 "프로필" 섹션/탭: `display_name` 수정 + 아바타 업로드(`uploadToCovers(file,'avatars')`) → `profiles` update.
- 전문가(`profile.expert_id`)인 경우: 같은 화면에서 **전문가 공개 프로필**(title, bio, 사진, categories) 편집.
  쓰기 = `expertApi.updateMyExpert(...)` 신규(본인 `expert_id` 행만, RLS는 `is_expert_owner` 또는 expert_id=프로필 매칭).
- `profiles` RLS는 본인 row update 허용(role/expert_id 변경 금지) — 기존 정책 유지, `avatar_url`은 허용 컬럼.

## 검증
- 전문가 분야 2개 지정 → 전문가 페이지에서 각 분야 필터에 모두 노출.
- 전문가 사진 업로드 → 카드/리뷰/관리자에서 사진 표시.
- 마이페이지에서 이름·사진 저장 → 헤더/마이페이지 반영. 전문가는 본인 공개 프로필 수정 가능.
</content>
