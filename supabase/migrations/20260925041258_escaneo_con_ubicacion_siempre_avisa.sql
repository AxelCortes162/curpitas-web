CREATE OR REPLACE FUNCTION public.registrar_escaneo(p_curpita text, p_lat double precision DEFAULT NULL::double precision, p_lng double precision DEFAULT NULL::double precision, p_accuracy double precision DEFAULT NULL::double precision)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_pet     pets%rowtype;
  v_scan_id uuid;
  v_notify  boolean := false;
begin
  select * into v_pet
  from pets
  where curpita = p_curpita and invalidated = false;

  if not found or v_pet.owner_id is null then
    return null;
  end if;

  if v_pet.is_lost and auth.uid() is distinct from v_pet.owner_id then
    if p_lat is not null and p_lng is not null then
      -- Un escaneo con ubicación siempre avisa (es lo que el tutor necesita),
      -- con su propio límite de un correo cada 2 minutos.
      select not exists (
        select 1 from pet_scans s
        where s.pet_id = v_pet.id
          and s.lat is not null
          and s.notified_at is not null
          and s.notified_at > now() - interval '2 minutes'
      ) into v_notify;
    else
      select not exists (
        select 1 from pet_scans s
        where s.pet_id = v_pet.id
          and s.notified_at is not null
          and s.notified_at > now() - interval '10 minutes'
      ) into v_notify;
    end if;
  end if;

  insert into pet_scans (pet_id, lat, lng, accuracy, was_lost, notify_pending)
  values (v_pet.id, p_lat, p_lng, p_accuracy, v_pet.is_lost, v_notify)
  returning id into v_scan_id;

  if v_pet.is_lost and p_lat is not null and p_lng is not null then
    update pets set lost_lat = p_lat, lost_lng = p_lng where id = v_pet.id;
  end if;

  return v_scan_id;
end;
$function$;
