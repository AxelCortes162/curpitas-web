-- Temas de edición especial (Día de Muertos 2026, y los que vengan).
-- Una mascota tiene un tema desbloqueado si su placa se vinculó antes del
-- cierre de la edición, o si su placa física es de esa edición.
-- Para una edición nueva: insertar otra fila aquí y su estilo en src/lib/temas.js.

create table public.pet_themes (
  id text primary key,
  cierre timestamptz not null,
  piezas int not null default 0 -- placas numeradas de la edición
);

alter table public.pet_themes enable row level security;
create policy "Todos ven los temas" on public.pet_themes for select using (true);
grant select on public.pet_themes to anon, authenticated;

-- 2 nov 2026 23:59 en CDMX = antes del 3 nov 00:00
insert into public.pet_themes (id, cierre, piezas)
values ('muertos_2026', timestamptz '2026-11-03 00:00 America/Mexico_City', 50);

alter table public.pets
  add column claimed_at timestamptz,          -- cuándo tuvo dueño por primera vez
  add column theme text references public.pet_themes,
  add column placa_edicion text references public.pet_themes,
  add column placa_numero int,
  add constraint pets_placa_numero_unico unique (placa_edicion, placa_numero);

-- Las placas ya vinculadas se vincularon antes de hoy (y antes del cierre).
update public.pets set claimed_at = created_at where owner_id is not null;

-- Temas desbloqueados. Sirve como columna calculada: .select('*, temas')
create function public.temas(p public.pets)
returns text[]
language sql stable
set search_path to 'public'
as $$
  select coalesce(array_agg(t.id order by t.cierre), '{}')
  from pet_themes t
  where p.claimed_at < t.cierre or p.placa_edicion = t.id;
$$;

grant execute on function public.temas(public.pets) to anon, authenticated;

create function public.pets_temas()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- La fecha de vinculación la pone el sistema; nadie la edita.
  new.claimed_at := coalesce(old.claimed_at, case when new.owner_id is not null then now() end);

  -- Placa numerada: solo el admin la marca; el número lo asigna el sistema
  -- (el menor libre, para reusar el de una placa desmarcada).
  if new.placa_edicion is distinct from old.placa_edicion then
    if auth.uid() is not null and not public.is_admin_user() then
      raise exception 'Solo el administrador puede marcar placas de edición';
    end if;

    if new.placa_edicion is null then
      new.placa_numero := null;
    else
      perform 1 from pet_themes where id = new.placa_edicion for update; -- un número a la vez
      select min(n) into new.placa_numero
      from pet_themes t, generate_series(1, t.piezas) n
      where t.id = new.placa_edicion
        and not exists (
          select 1 from pets
          where placa_edicion = new.placa_edicion and placa_numero = n and id <> new.id
        );
      if new.placa_numero is null then
        raise exception 'Ya se asignaron todas las placas de esta edición';
      end if;
    end if;
  else
    new.placa_numero := old.placa_numero;
  end if;

  if new.theme is not null and not (new.theme = any (public.temas(new))) then
    if new.theme is distinct from old.theme then
      raise exception 'Ese tema no está desbloqueado para esta mascota';
    end if;
    new.theme := null; -- perdió el tema (p. ej. le quitaron la placa)
  end if;

  return new;
end;
$$;

revoke execute on function public.pets_temas() from public, anon, authenticated;

create trigger pets_temas
before insert or update on public.pets
for each row execute function public.pets_temas();

-- Perfil público: ahora incluye tema, temas desbloqueados y placa numerada.
drop function if exists public.get_pet_public(text);

create function public.get_pet_public(p_curpita text)
 returns table(curpita text, name text, photo_url text, city text, is_lost boolean, lost_lat double precision, lost_lng double precision, species text, breed text, birth_date date, medical_info text, owner_name text, phone text, phone_2 text, found_instructions text, theme text, temas text[], placa_edicion text, placa_numero int, placa_total int)
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    p.curpita, p.name, p.photo_url, p.city,
    p.is_lost, p.lost_lat, p.lost_lng,
    case when p.show_breed then p.species end,
    case when p.show_breed then p.breed end,
    case when p.show_birth_date then p.birth_date end,
    case when p.show_medical_info then p.medical_info end,
    case when p.show_owner_name then pr.full_name end,
    pr.phone,
    pr.phone_2,
    p.found_instructions,
    p.theme,
    public.temas(p),
    p.placa_edicion,
    p.placa_numero,
    (select t.piezas from pet_themes t where t.id = p.placa_edicion)
  from pets p
  join profiles pr on pr.id = p.owner_id
  where p.curpita = p_curpita
    and p.invalidated = false;
$function$;

revoke all on function public.get_pet_public(text) from public;
grant execute on function public.get_pet_public(text) to anon, authenticated;
