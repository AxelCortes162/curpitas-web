alter table profiles add column if not exists phone_2 text;

drop function if exists public.get_pet_public(text);

create function public.get_pet_public(p_curpita text)
returns table(
  curpita text, name text, photo_url text, city text,
  is_lost boolean, lost_lat double precision, lost_lng double precision,
  species text, breed text, birth_date date, medical_info text,
  owner_name text, phone text, phone_2 text
)
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
    pr.phone_2
  from pets p
  join profiles pr on pr.id = p.owner_id
  where p.curpita = p_curpita
    and p.invalidated = false;
$function$;
