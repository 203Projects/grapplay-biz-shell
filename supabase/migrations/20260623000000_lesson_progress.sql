-- ───────────────────────────────────────────────────────────
-- 영상강의 정밀 진도: 회차별 재생 위치(초)/길이를 enrollments 행에 jsonb로 저장.
-- 형태: { "<lessonIdx>": { "s": 마지막위치초, "d": 영상길이초 } }
-- enrollments.progress(정수 %)는 전체 진도(시청 완료율)로 계속 사용한다.
-- RLS는 행 단위(read own / update own progress)라 새 컬럼도 그대로 보호됨. 재실행 안전.
-- ───────────────────────────────────────────────────────────
alter table enrollments add column if not exists lesson_progress jsonb not null default '{}'::jsonb;
