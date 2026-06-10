# R2 — 배너 (요청 ② 링크 이동, ③ 관리자 편집)

## 현재 상태
- 랜딩 히어로 배너는 `src/pages/AcademyLanding.tsx`의 `BannerCarousel`이 렌더.
- 데이터는 `src/data/mockMarketplace.ts`의 하드코딩 `PROMO_BANNERS`(`{title, subtitle, gradient, cta}`).
- CTA 버튼에 **onClick/링크 없음** → 클릭해도 이동 안 함.
- 배너 편집 UI **없음**, 배너 DB 테이블 **없음**.

## ② 배너 → 알맞은 링크로 이동
- `PromoBanner`에 `link?: string` 필드 추가(목업·DB 공통).
- 배너 전체를 `link`가 있으면 내부경로는 `<Link to>`, 외부 URL이면 `<a href>`로 감싸 이동.
- 기존 3개 배너에 적절한 링크 지정(예: `/library`, `/ebooks`, `/experts`).

## ③ 관리자 대시보드에서 배너 편집
### DB (마이그레이션 `20260618000000_banners.sql`)
```
create table banners (
  id uuid pk default gen_random_uuid(),
  title text not null,
  subtitle text,
  gradient text not null default 'from-violet-500 to-purple-600',
  cta text,
  link text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);
-- RLS: 공개 read(active), 관리자만 write (is_admin() 헬퍼 재사용)
```
- `api.ts`에 `banners` 로드 추가(실패 시 `PROMO_BANNERS` 폴백). `BizData.banners`.
- `adminApi.ts`에 `listBanners/createBanner/updateBanner/deleteBanner`.

### 관리자 탭
- `src/pages/admin/AdminDashboard.tsx`의 `Tab` 유니온/`TABS` 배열에 `'배너'` 추가 + `<BannerTab/>` 렌더.
- 신규 `src/pages/admin/tabs/BannerTab.tsx`: 목록/추가/수정/삭제, 그라데이션·링크·노출순서·활성 토글.
- 그라데이션은 프리셋 선택(`from-x to-y` 몇 종) 제공.

### 랜딩 반영
- `AcademyLanding`이 `useBizData().banners`(없으면 `PROMO_BANNERS`)를 사용하도록 변경.

## 검증
- 배너 클릭 → 지정 링크 이동.
- 관리자 배너 탭에서 추가/수정/삭제 → 랜딩 즉시 반영(refetch).
- 비로그인/일반 유저는 active 배너만 read.
</content>
