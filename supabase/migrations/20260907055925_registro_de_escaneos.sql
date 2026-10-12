create extension if not exists pg_net with schema extensions;

-- Cada vez que alguien abre el perfil público de una placa reclamada,
-- queda registrado aquí. Es el historial que ve el tutor.
create table if not exists public.pet_scans (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  scanned_at     timestamptz not null default now(),
  lat            double precision,
  lng            double precision,
  accuracy       double precision,
  was_lost       boolean not null default false,
  notify_pending boolean not null default false,
  notified_at    timestamptz
);

create index if not exists pet_scans_pet_idx
  on public.pet_scans (pet_id, scanned_at desc);

alter table public.pet_scans enable row level security;

-- Solo el tutor ve los escaneos de sus mascotas. No hay política de INSERT:
-- la única forma de escribir aquí es la función de abajo.
drop policy if exists "Tutor ve escaneos de sus mascotas" on public.pet_scans;
create policy "Tutor ve escaneos de sus mascotas"
  on public.pet_scans for select
  using (exists (
    select 1 from public.pets p
    where p.id = pet_scans.pet_id and p.owner_id = auth.uid()
  ));

drop policy if exists "Admins ven todos los escaneos" on public.pet_scans;
create policy "Admins ven todos los escaneos"
  on public.pet_scans for select
  using (public.is_admin_user());

grant select on public.pet_scans to authenticated;

-- Registra el escaneo. La llama el visitante anónimo que abre el perfil.
-- Devuelve el id del escaneo, o null si el folio no sirve.
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

  -- Folio inexistente, desactivado o sin reclamar: no se registra nada.
  if not found or v_pet.owner_id is null then
    return null;
  end if;

  -- Solo se avisa si está perdida, y como mucho una vez cada 10 minutos.
  -- Así nadie puede inundar de correos al tutor recargando la página.
  if v_pet.is_lost then
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

  -- Si quien la encontró compartió su ubicación y la mascota está perdida,
  -- esa es la posición más reciente que existe: actualiza el mapa.
  if v_pet.is_lost and p_lat is not null and p_lng is not null then
    update pets set lost_lat = p_lat, lost_lng = p_lng where id = v_pet.id;
  end if;

  return v_scan_id;
end;
$$;

revoke all on function public.registrar_escaneo(text, double precision, double precision, double precision) from public;
grant execute on function public.registrar_escaneo(text, double precision, double precision, double precision) to anon, authenticated;

-- Al insertar un escaneo que amerita aviso, se despierta el Edge Function.
create or replace function public.trigger_notificar_escaneo()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if new.notify_pending then
    perform net.http_post(
      url     := 'https://nfaxruxupnhqjzqlnbpb.supabase.co/functions/v1/notificar-escaneo',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := jsonb_build_object('scan_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists pet_scans_notificar on public.pet_scans;
create trigger pet_scans_notificar
  after insert on public.pet_scans
  for each row execute function public.trigger_notificar_escaneo();
