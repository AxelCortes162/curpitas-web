create or replace function public.proteger_columnas_profiles()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin_user() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_admin := false;
    new.is_rescuer := false;
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.is_rescuer is distinct from old.is_rescuer
     or new.codigo_referido is distinct from old.codigo_referido
     or new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'No tienes permiso para cambiar esos datos del perfil';
  end if;

  return new;
end;
$$;

revoke execute on function public.proteger_columnas_profiles() from public, anon, authenticated;

drop trigger if exists proteger_columnas_profiles on public.profiles;
create trigger proteger_columnas_profiles
before insert or update on public.profiles
for each row execute function public.proteger_columnas_profiles();
