-- ───────────────────────────────────────────────────────────
-- 전문가 다중 분야 + 프로필 사진 + 마이페이지 프로필 (요청 ⑥⑦⑧)
-- 재실행 안전.
-- ───────────────────────────────────────────────────────────

-- ⑥ 전문가 다중 카테고리
alter table experts add column if not exists categories text[] not null default '{}';
-- 기존 단일 category 값을 배열로 이관 (배열이 비어 있을 때만)
update experts set categories = array[category]
  where category is not null and (categories is null or categories = '{}');

-- ⑦ 전문가 프로필 사진
alter table experts add column if not exists avatar_url text;

-- ⑧ 회원 프로필 사진 (마이페이지)
alter table profiles add column if not exists avatar_url text;

-- 전문가 본인이 자기 experts 행을 수정할 수 있게 (마이페이지에서 공개 프로필 편집).
-- profiles.expert_id = experts.id 매칭으로 소유권 확인. 관리자 정책(admin updates expert)과 OR 합집합.
create or replace function public.owns_expert(target_expert text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'expert' and expert_id = target_expert
  );
$$;

drop policy if exists "expert updates own row" on experts;
create policy "expert updates own row" on experts for update
  using (owns_expert(id)) with check (owns_expert(id));
