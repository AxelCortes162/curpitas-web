-- Si quien abre el perfil es el propio tutor (por ejemplo revisando cómo se
-- ve su placa), el escaneo se registra pero no se le manda correo a sí mismo.
create or replace function public.registrar_escaneo(
  p_curpita  text,
  p_lat      double precision default null,
  p_lng      double precision default null,
  p_accuracy double precision default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
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
    select not exists (
      select 1 from pet_scans s
      where s.pet_id = v_pet.id
        and s.notified_at is not null
        and s.notified_at > now() - interval '10 minutes'
    ) into v_notify;
  end if;

  insert into pet_scans (pet_id, lat, lng, accuracy, was_lost, notify_pending)
  values (v_pet.id, p_lat, p_lng, p_accuracy, v_pet.is_lost, v_notify)
  returning id into v_scan_id;

  if v_pet.is_lost and p_lat is not null and p_lng is not null then
    update pets set lost_lat = p_lat, lost_lng = p_lng where id = v_pet.id;
  end if;

  return v_scan_id;
end;
$$;
