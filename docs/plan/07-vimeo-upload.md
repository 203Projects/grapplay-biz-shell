# Phase 7 — 강의 영상 Vimeo 업로드

> 선행: [03 강의 에디터](./03-expert-dashboard.md), [06 플레이어](./06-course-player-and-ebook-editor.md)
> 상태: **구현 완료 · 검증됨** (2026-06-09). VIMEO_ACCESS_TOKEN 설정 + 함수 배포 완료, 업로드 동작 확인.

## 목표
지금은 지도자가 강의 레슨에 **Vimeo/YouTube URL을 직접 붙여넣기**만 가능. 이걸 확장해
**웹에서 영상 파일을 선택하면 자동으로 Vimeo에 업로드**되고, 업로드된 영상이 레슨에 연결되게 한다.
(그래플레이 본 서비스와 동일하게 Vimeo 호스팅 사용)

## 핵심 동작 (업로드 플로우)
Vimeo 업로드는 **tus 재개가능 프로토콜**을 쓰고, **액세스 토큰은 비밀**이라 Edge Function에서만 다룬다.

1. **클라이언트**: 레슨에서 영상 파일 선택 → 파일 크기를 Edge Function `vimeo-create-upload`에 전송
2. **Edge Function**: Vimeo API `POST /me/videos` (approach=tus, size, privacy) 호출(토큰 사용)
   → `upload_link`(tus 엔드포인트) + 영상 id + `player_embed_url`(해시 포함) 반환
3. **클라이언트**: `tus-js-client`로 파일을 `upload_link`에 직접 업로드 (**진행률 표시**)
4. **완료** → 레슨 `videoUrl = player_embed_url` 저장 → 강의 저장
5. Vimeo가 **트랜스코딩(처리)** 하는 동안 플레이어엔 "처리 중"이 보이고, 완료 후 정상 재생

## 산출물

### 의존성
- `tus-js-client` (클라이언트 업로드)

### Edge Function — `supabase/functions/vimeo-create-upload/index.ts`
- 로그인 전문가만 호출 가능(JWT 검증, `requireExpert` 성격).
- 입력: `{ size, name? }`. 호출:
  ```
  POST https://api.vimeo.com/me/videos
  Authorization: Bearer VIMEO_ACCESS_TOKEN
  Accept: application/vnd.vimeo.*+json;version=3.4
  body: { upload: { approach:'tus', size }, name, privacy: { view:'unlisted', embed:'public' } }
  ```
- 반환: `{ uploadLink, videoId, embedUrl }`
- CORS(OPTIONS) 처리. 시크릿 `VIMEO_ACCESS_TOKEN`.

### 클라이언트 — `src/lib/vimeo.ts`
- `createVimeoUpload(file)` → Edge Function 호출해 `{ uploadLink, videoId, embedUrl }` 획득
- `uploadToVimeo(file, uploadLink, onProgress)` → tus 업로드(진행률 콜백) → 완료 시 resolve

### 에디터 — `AcademyCourseEditor.tsx`
- 각 레슨 행에 **"영상 업로드"** 버튼(파일 선택) 추가.
  - 선택 → createVimeoUpload → uploadToVimeo(진행률 바) → 완료 시 `lesson.videoUrl = embedUrl`
  - **URL 직접 입력 칸은 유지**(외부 영상/폴백). 업로드 중 다른 행도 동작하도록 행별 상태.
- (선택) 대시보드 "영상" 탭의 데모 업로드도 동일 로직으로 교체.

## 사전 준비 (코드 외 — 사용자)
1. **Vimeo 유료 플랜** (API 업로드는 Plus/Pro 이상 필요. 무료는 API 업로드 불가/주간 용량 제한).
2. Vimeo 개발자 콘솔에서 **앱 생성 → 액세스 토큰** 발급.
   - 스코프: `public private upload edit video_files`
3. Supabase 비즈 프로젝트 → **Edge Functions → Secrets**: `VIMEO_ACCESS_TOKEN` 설정.
4. Edge Function `vimeo-create-upload` 배포.

## 보안 / 권한
- `VIMEO_ACCESS_TOKEN`은 **Edge Function 전용**(클라이언트 노출 금지).
- 영상 privacy: `view='unlisted'`(링크 보유자), `embed='public'`. 필요하면 임베드 도메인
  화이트리스트로 강화 가능(`embed='whitelist'` + 도메인 등록).

## 검증
1. 토큰/시크릿 설정 + 함수 배포 후, 에디터 레슨에서 **영상 파일 업로드** → 진행률 → 완료
2. 저장 → 레슨 `videoUrl`이 `player.vimeo.com/video/<id>?h=...` 로 저장됨
3. 강의 상세 미리보기 / 강의실(`/learn`)에서 재생 (트랜스코딩 완료 후)
4. `npm run build` 통과

## 리스크
- **Vimeo 플랜**: 무료/저가 플랜은 API 업로드 제한 → 업로드 401/403 가능. 사전 확인 필요.
- **트랜스코딩 지연**: 업로드 직후엔 재생 불가(처리 중). 안내 문구 필요.
- **대용량 파일**: 업로드 오래 걸림 → tus 재개로 완화, 진행률 표시 필수.
- **토큰 스코프 부족** → 401/403. upload·edit 스코프 확인.
- 비용/용량: 영상 호스팅 비용은 Vimeo 플랜에 종속.
