# 작업 10 — 전자책 읽기 진도 + 영상강의 정밀 진도(이어보기)

**작업일: 2026-06-11**

"어디까지 읽었는지/봤는지" 추적이 없던 문제. 전자책은 페이지 진도, 영상강의는 Vimeo Player SDK로
회차별 재생 위치까지 추적해 **이어보기 + 진도% 표시**를 추가. 둘 다 `enrollments` 행에 저장(새 테이블 없음).

---

## 저장 구조 (마이그레이션 없이 + 컬럼 1개 추가)

- `enrollments.progress`(integer, 0~100%) — **기존 컬럼 재활용**. 그동안 마이페이지에 진도바만
  그려졌을 뿐 **값을 쓰는 코드가 없어 항상 0%**였다. 이제 전자책·강의 진도가 여기에 들어간다.
- `enrollments.lesson_progress`(jsonb) — **신규**. 영상강의 회차별 위치.
  형태: `{ "<회차idx>": { "s": 마지막위치초, "d": 영상길이초 } }`
  - 마이그레이션: [supabase/migrations/20260623000000_lesson_progress.sql](../../supabase/migrations/20260623000000_lesson_progress.sql)
- RLS는 손대지 않음 — `enrollments`의 행 단위 정책(`read own` / `update own progress`,
  `auth.uid() = user_id`)이 **새 컬럼과 전자책 행까지 그대로 보호**한다.

---

## ① 전자책 읽기 진도

### 현재
[src/components/PdfReader.tsx](../../src/components/PdfReader.tsx)가 전체 페이지를 스크롤 캔버스로 렌더만 할 뿐
현재 페이지 추적/저장이 전혀 없었다.

### 변경
- **PdfReader**: 각 캔버스에 `data-page` 부여 + `IntersectionObserver`로 현재 보는 페이지 감지.
  - props 추가: `initialPercent`(이어읽기 시작 %), `onProgress(percent)`(부모가 디바운스 저장).
  - 로드 후 저장된 %를 페이지로 환산해 `scrollIntoView`로 이어읽기. 콜백/초기값은 ref로 보관해
    effect 재실행(전체 재렌더) 방지.
- [src/pages/AcademyEbookRead.tsx](../../src/pages/AcademyEbookRead.tsx): 진입 시 `enrollments`에서 progress 로드 →
  이어읽기. 진도 증가 시(되돌아가도 최고치 유지) **1.5초 디바운스 + 화면 이탈 시** 저장. 상단에 "N% 읽음".
- [src/lib/userData.ts](../../src/lib/userData.ts) `updateProgress(userId, type, id, %)`.

---

## ② 영상강의 정밀 진도 (Vimeo Player SDK)

### 현재
[src/pages/AcademyCourseLearn.tsx](../../src/pages/AcademyCourseLearn.tsx)가 영상을 **일반 iframe**으로만 띄워
재생 위치를 알 수 없었다.

### 변경
- 의존성: **`@vimeo/player`** 설치([package.json](../../package.json)).
- [src/components/VimeoPlayer.tsx](../../src/components/VimeoPlayer.tsx) 신규 — Vimeo 임베드 iframe에 SDK를 붙여
  `timeupdate`(약 4초 간격)로 위치 보고, `ready` 후 저장 위치로 `setCurrentTime`(이어보기). 영상이 끝나면 완료 처리.
  - Vimeo 임베드(`player.vimeo.com`)에만 사용 — YouTube 등은 기존 일반 iframe(추적 없음)으로 폴백.
- [src/pages/AcademyCourseLearn.tsx](../../src/pages/AcademyCourseLearn.tsx):
  - 진입 시 회차별 위치 로드 → **마지막으로 본 회차로 이어보기**.
  - 재생 중 회차별 `{s,d}` 갱신 → 4초 디바운스 + 이탈 시 저장.
  - 상단 "N% 수강", 목차에 90% 이상 본 회차 **✓** 표시.
  - 전체 % = 영상 있는 회차들의 시청 비율 평균(90%↑는 1로 간주).
- [src/lib/userData.ts](../../src/lib/userData.ts) `getCourseProgress` / `saveCourseProgress`(progress % + lesson_progress 동시 저장).

### 마이페이지
- [src/pages/AcademyMyPage.tsx](../../src/pages/AcademyMyPage.tsx): 전자책에도 진도바 + "이어읽기" 버튼 추가
  (강의와 동일 표시). 강의 진도바는 이제 실제 %를 반영.

---

## 마이그레이션 적용 메모 (중요)
- 새 컬럼(`lesson_progress`)을 추가하는 [20260623000000_lesson_progress.sql](../../supabase/migrations/20260623000000_lesson_progress.sql)을
  **원격 DB에 적용해야** 영상 진도 저장이 동작한다. (미적용 시 select/update가 컬럼 없음 에러)
- 이 세션의 Supabase MCP는 비즈 프로젝트(`sjnmkmsdzuvywtaasvdn`) **접근 권한이 없어 자동 적용 불가**.
  Supabase 대시보드 SQL Editor에서 직접 실행하거나 `supabase db push`로 적용한다.
  ```sql
  alter table enrollments add column if not exists lesson_progress jsonb not null default '{}'::jsonb;
  ```

## 한계
- Vimeo 영상 소유자 개인정보 설정이 임베드 SDK 제어를 막으면 `setCurrentTime`(이어보기)·위치 보고가
  제한될 수 있다. 정상 임베드 영상이면 동작.

## 배포
- 프론트는 `main` push로 Vercel 자동배포. **DB 마이그레이션 적용이 선행되어야 정상 동작.**

## 검증
- `npm run build` 통과.
- 전자책: 일부 읽고 나갔다 재진입 → 그 위치로 스크롤, "N% 읽음"·마이페이지 진도바 반영.
- 영상: 회차 일부 시청 후 재진입 → 그 회차/위치로 이어보기, "N% 수강"·목차 ✓ 반영.
