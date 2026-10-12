create table public.prospectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'veterinaria' check (tipo in ('veterinaria','tienda','otro')),
  telefono text,
  direccion text,
  maps_url text,
  estado text not null default 'por_visitar' check (estado in ('por_visitar','visitada','seguimiento','negada','aceptada','afiliada')),
  nota text,
  lat double precision,
  lng double precision,
  resumen_publico text,
  actualizado_por uuid references auth.users(id) on delete set null,
  actualizado_en timestamptz not null default now(),
  creado_en timestamptz not null default now()
);

alter table public.prospectos enable row level security;

create policy "admins gestionan prospectos" on public.prospectos
  for all to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

revoke all on public.prospectos from anon;
grant select, insert, update, delete on public.prospectos to authenticated;

create or replace function public.prospectos_marcar_cambio()
returns trigger language plpgsql set search_path = public as $$
begin
  new.actualizado_en := now();
  new.actualizado_por := auth.uid();
  return new;
end;
$$;

create trigger prospectos_marcar_cambio
before insert or update on public.prospectos
for each row execute function public.prospectos_marcar_cambio();
