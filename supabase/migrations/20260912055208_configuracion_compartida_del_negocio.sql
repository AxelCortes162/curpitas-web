-- Configuración compartida del negocio: costos, precios, escalones y
-- porcentajes. Vive aquí y no en el navegador para que los cuatro vean
-- exactamente los mismos números — es la promesa de "cuentas claras" de la
-- carta, convertida en pantalla.
--
-- Se guarda como jsonb a propósito: la estructura va a cambiar (nuevos
-- insumos, nuevas líneas, nuevos escalones) y no queremos una migración por
-- cada campo.

create table if not exists public.app_config (
  clave      text primary key,
  datos      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_config enable row level security;

-- Solo administradores. No es información pública ni de los tutores.
drop policy if exists "Admins leen la configuracion" on public.app_config;
create policy "Admins leen la configuracion"
  on public.app_config for select
  using (public.is_admin_user());

drop policy if exists "Admins crean la configuracion" on public.app_config;
create policy "Admins crean la configuracion"
  on public.app_config for insert
  with check (public.is_admin_user());

drop policy if exists "Admins actualizan la configuracion" on public.app_config;
create policy "Admins actualizan la configuracion"
  on public.app_config for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

grant select, insert, update on public.app_config to authenticated;

-- La lección de pet_scans y profiles: service_role necesita el grant a nivel
-- tabla aunque se salte el RLS, por si algún Edge Function la lee después.
grant select, insert, update, delete on public.app_config to service_role;
