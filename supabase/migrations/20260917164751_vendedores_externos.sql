-- ---------------------------------------------------------------------------
-- VENDEDORES EXTERNOS
--
-- Gente ajena a los 4 socios que ayuda a vender y cobra comisión por eso.
-- Ninguno de los 4 principales pasa por aqui -- su reparto va en la carta de
-- entendimiento, no en este sistema.
--
-- Cada vendedor tiene su propio login (se lo da de alta un admin, no se
-- auto-registra) y su propio codigo. El codigo NO cambia el precio -- solo
-- dice quien cerro la venta, para calcular su comision. La comision se
-- "libera" hasta que el pedido llega a 'entregado' (no antes: si se cancela
-- o se rechaza en el camino, no hay nada que pagar), y ademas se marca aparte
-- cuando ya se le transfirio de verdad (comision_pagada).
-- ---------------------------------------------------------------------------

create table public.vendedores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  codigo text not null unique,
  comision_pct numeric not null check (comision_pct >= 0 and comision_pct <= 100),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.vendedores enable row level security;

create policy "admins gestionan vendedores" on public.vendedores
  for all using (is_admin_user()) with check (is_admin_user());

-- El vendedor puede ver su propio registro (para su codigo y % en el
-- dashboard), nada mas.
create policy "vendedor ve su propio registro" on public.vendedores
  for select using (id = auth.uid());

-- El gotcha de siempre, desde el principio esta vez: RLS no alcanza sin el
-- GRANT de tabla.
grant select, insert, update, delete on public.vendedores to authenticated;
revoke all on public.vendedores from anon;

-- ---------------------------------------------------------------------------
-- Atribucion en pedidos. vendedor_id nulo = el 99% de los pedidos (sin
-- vendedor). comision_pct_aplicado se copia del vendedor AL MOMENTO de la
-- venta -- si despues le cambias el % a alguien, su historial no se mueve
-- solo (mismo criterio que precio_unitario, que tampoco se recalcula).
-- ---------------------------------------------------------------------------
alter table public.pedidos
  add column vendedor_id uuid references public.vendedores(id),
  add column comision_pct_aplicado numeric,
  add column comision_pagada boolean not null default false;

-- A proposito NO se agrega una politica de RLS en 'pedidos' para que el
-- vendedor vea sus filas ahi directo -- eso expondria nombre_cliente,
-- telefono, correo y notas (que son para el negocio, no para un externo).
-- En vez de eso, una vista que solo trae lo que un vendedor necesita ver.
--
-- Las vistas en Postgres corren con los permisos del DUEÑO de la vista, no
-- de quien la consulta (a menos que se marque security_invoker) -- por eso
-- esta vista SI puede leer 'pedidos' aunque el vendedor no tenga acceso
-- directo a esa tabla. El WHERE de aqui adentro es la unica frontera de
-- seguridad, y por eso filtra por auth.uid() en vez de confiar en RLS.
create view public.mis_ventas_vendedor as
select
  p.id,
  p.forma,
  p.color,
  p.nombre_mascota,
  p.cantidad,
  p.total,
  p.estado,
  p.pagado_en,
  p.creado_en,
  p.comision_pct_aplicado,
  round(p.total * p.comision_pct_aplicado / 100, 2) as comision,
  (p.estado = 'entregado') as comision_liberada,
  p.comision_pagada
from public.pedidos p
where p.vendedor_id = auth.uid();

grant select on public.mis_ventas_vendedor to authenticated;
revoke all on public.mis_ventas_vendedor from anon;

-- ---------------------------------------------------------------------------
-- Marcar una comision como pagada (o revertirlo si fue un error). Solo
-- admin -- mismo patron que avanzar_pedido_estado: RPC en vez de UPDATE
-- directo, para no tener que abrir una politica de UPDATE mas ancha en
-- 'pedidos'.
-- ---------------------------------------------------------------------------
create or replace function public.marcar_comision_pagada(p_pedido_id uuid, p_pagada boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_user() then
    raise exception 'no autorizado';
  end if;

  update pedidos
  set comision_pagada = p_pagada
  where id = p_pedido_id and vendedor_id is not null;
end;
$$;

revoke all on function public.marcar_comision_pagada(uuid, boolean) from public;
grant execute on function public.marcar_comision_pagada(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Resumen por vendedor para /admin/vendedores -- mismo espiritu que
-- resumen_produccion(): security invoker, la RLS de 'pedidos' (solo admins)
-- hace el trabajo sola adentro, asi que un no-admin que la llame no ve nada.
-- ---------------------------------------------------------------------------
create or replace function public.resumen_vendedores()
returns table(
  vendedor_id uuid,
  ventas bigint,
  total_vendido numeric,
  comision_liberada numeric,
  comision_pendiente numeric,
  comision_pagada numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.vendedor_id,
    count(*)::bigint as ventas,
    coalesce(sum(p.total), 0) as total_vendido,
    coalesce(sum(case when p.estado = 'entregado' and not p.comision_pagada
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_liberada,
    coalesce(sum(case when p.estado <> 'entregado'
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_pendiente,
    coalesce(sum(case when p.comision_pagada
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_pagada
  from pedidos p
  where p.vendedor_id is not null
  group by p.vendedor_id;
$$;

revoke all on function public.resumen_vendedores() from public;
grant execute on function public.resumen_vendedores() to authenticated;
