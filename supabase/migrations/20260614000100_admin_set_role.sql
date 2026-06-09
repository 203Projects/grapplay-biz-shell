-- ───────────────────────────────────────────────────────────
-- 관리자 회원 역할 변경 RPC
-- profiles.update의 자기승격 잠금(20260609000000)을 우회하는 유일하게
-- 허가된 경로. is_admin() 가드 + security definer. request_settlement() 패턴 미러링.
-- 하나의 RPC로 승격(expert)·강등(user)·관리자 지정(admin)을 모두 처리한다.
-- ───────────────────────────────────────────────────────────
create or replace function admin_set_user_role(
  target_user   uuid,
  new_role      user_role,
  new_expert_id text default null
)
returns profiles language plpgsql security definer set search_path = public as $$
declare
  v_row profiles;
begin
  -- definer 권한으로 profiles를 수정하기 전에 호출자가 관리자인지 먼저 확인
  if not is_admin() then raise exception 'not admin'; end if;

  -- expert로 승격하려면 expert_id가 반드시 있어야 하고 실제 experts 행이어야 함
  if new_role = 'expert' then
    if new_expert_id is null
       or not exists (select 1 from experts where id = new_expert_id) then
      raise exception 'expert_id required and must exist';
    end if;
  end if;

  update profiles
     set role = new_role,
         -- expert가 아니면 expert_id를 비워 권한 잔존 방지
         expert_id = case when new_role = 'expert' then new_expert_id else null end
   where id = target_user
   returning * into v_row;

  if v_row.id is null then raise exception 'user not found'; end if;
  return v_row;
end $$;
