-- Reemplaza las vistas SECURITY DEFINER (que devolvían TODAS las filas,
-- teléfonos incluidos, a cualquiera con la anon key) por funciones que
-- exigen un folio y devuelven una sola fila.

-- 1) Estado de un folio
create or replace function public.get_pet_status(p_curpita text)
returns table (curpita text, invalidated boolean, reclamada boolean)
language sql security definer stable set search_path = public
as $$
  select p.curpita, p.invalidated, (p.owner_id is not null)
  from pets p
  where p.curpita = p_curpita;
$$;

-- 2) Perfil público de una mascota, respetando sus banderas de privacidad
create or replace function public.get_pet_public(p_curpita text)
returns table (
  curpita text, name text, photo_url text, city text,
  is_lost boolean, lost_lat double precision, lost_lng double precision,
  species text, breed text, birth_date date, medical_info text,
  owner_name text, phone text
)
language sql security definer stable set search_path = public
as $$
  select
    p.curpita, p.name, p.photo_url, p.city,
    p.is_lost, p.lost_lat, p.lost_lng,
    case when p.show_breed then p.species end,
    case when p.show_breed then p.breed end,
    case when p.show_birth_date then p.birth_date end,
    case when p.show_medical_info then p.medical_info end,
    case when p.show_owner_name then pr.full_name end,
    pr.phone
  from pets p
  join profiles pr on pr.id = p.owner_id
  where p.curpita = p_curpita
    and p.invalidated = false;
$$;

-- 3) Mapa de perdidos: sí es una lista, pero solo con campos inocuos.
--    Sin teléfono, sin info médica, sin nombre del tutor.
create or replace function public.get_lost_pets_map()
returns table (
  curpita text, name text, photo_url text,
  lost_lat double precision, lost_lng double precision
)
language sql security definer stable set search_path = public
as $$
  select p.curpita, p.name, p.photo_url, p.lost_lat, p.lost_lng
  from pets p
  where p.is_lost = true
    and p.invalidated = false
    and p.owner_id is not null
    and p.lost_lat is not null
    and p.lost_lng is not null;
$$;

-- 4) Directorio de adopción: la lista NO lleva teléfono.
create or replace function public.get_adoptable_dogs()
returns table (
  id uuid, name text, species text, breed text, age_text text,
  description text, photo_url text, photo_urls text[], city text,
  status text, got_curpita boolean, rescuer_name text, has_contact boolean
)
language sql security definer stable set search_path = public
as $$
  select d.id, d.name, d.species, d.breed, d.age_text,
         d.description, d.photo_url, d.photo_urls, d.city,
         d.status, d.got_curpita, pr.full_name,
         (pr.phone is not null and pr.phone <> '')
  from adoptable_dogs d
  join profiles pr on pr.id = d.rescuer_id;
$$;

-- 5) El teléfono del rescatista se pide de uno en uno, al dar clic.
create or replace function public.get_adoptable_contact(p_dog_id uuid)
returns text
language sql security definer stable set search_path = public
as $$
  select pr.phone
  from adoptable_dogs d
  join profiles pr on pr.id = d.rescuer_id
  where d.id = p_dog_id;
$$;

-- Permisos: solo estas funciones quedan expuestas
revoke all on function public.get_pet_status(text) from public;
revoke all on function public.get_pet_public(text) from public;
revoke all on function public.get_lost_pets_map() from public;
revoke all on function public.get_adoptable_dogs() from public;
revoke all on function public.get_adoptable_contact(uuid) from public;

grant execute on function public.get_pet_status(text) to anon, authenticated;
grant execute on function public.get_pet_public(text) to anon, authenticated;
grant execute on function public.get_lost_pets_map() to anon, authenticated;
grant execute on function public.get_adoptable_dogs() to anon, authenticated;
grant execute on function public.get_adoptable_contact(uuid) to anon, authenticated;

-- Fuera las vistas que filtraban todo
drop view if exists public.pet_public_profile;
drop view if exists public.pet_status_public;
drop view if exists public.adoptable_dogs_public;

-- Funciones internas que no deberían ser llamables por REST
revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.rls_auto_enable() from anon, authenticated;
