-- Run this once in Supabase SQL Editor.
-- This matches the secret admin URL + token used by the supplied website files.
-- No attendee login is required.

create or replace function public.admin_list_registrations(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token <> 'iDCU0vXvJMxVAXPtN1Lb2yJUl7aKaB-pF1rG7DLlF-8' then
    raise exception 'Unauthorized';
  end if;

  return coalesce(
    (select json_agg(r order by r.registered_at desc) from public.registrations r),
    '[]'::json
  );
end;
$$;

create or replace function public.admin_delete_registration(p_token text, p_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_token <> 'iDCU0vXvJMxVAXPtN1Lb2yJUl7aKaB-pF1rG7DLlF-8' then
    raise exception 'Unauthorized';
  end if;

  delete from public.registrations where id = p_id;
  get diagnostics v_deleted = row_count;

  return json_build_object('ok', true, 'deleted', v_deleted);
end;
$$;

grant execute on function public.admin_list_registrations(text) to anon;
grant execute on function public.admin_delete_registration(text, uuid) to anon;
