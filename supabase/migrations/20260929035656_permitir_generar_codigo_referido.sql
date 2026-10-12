CREATE OR REPLACE FUNCTION public.proteger_columnas_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- El código de referido solo lo puede poner generar_codigo_referido(),
  -- y solo cuando todavía no tenía uno.
  if new.codigo_referido is distinct from old.codigo_referido
     and old.codigo_referido is null
     and current_setting('curpitas.generando_codigo', true) = 'si' then
    new.codigo_referido := new.codigo_referido;
  elsif new.codigo_referido is distinct from old.codigo_referido then
    raise exception 'No tienes permiso para cambiar esos datos del perfil';
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.is_rescuer is distinct from old.is_rescuer
     or new.id is distinct from old.id
     or new.created_at is distinct from old.created_at then
    raise exception 'No tienes permiso para cambiar esos datos del perfil';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.generar_codigo_referido()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_codigo text;
  v_existente text;
begin
  if auth.uid() is null then
    raise exception 'necesitas iniciar sesión';
  end if;

  select codigo_referido into v_existente from profiles where id = auth.uid();
  if v_existente is not null then
    return v_existente;
  end if;

  -- Le avisa al trigger proteger_columnas_profiles que este cambio sí viene
  -- de aquí (solo dura esta transacción).
  perform set_config('curpitas.generando_codigo', 'si', true);

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      update profiles set codigo_referido = v_codigo where id = auth.uid();
      exit;
    exception when unique_violation then
      -- choque con otro código ya existente -- se intenta de nuevo con otro
    end;
  end loop;

  perform set_config('curpitas.generando_codigo', '', true);
  return v_codigo;
end;
$function$;
