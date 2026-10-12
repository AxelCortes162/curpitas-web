-- ---------------------------------------------------------------------------
-- PRODUCCIÓN Y ENVÍO — etapas del pedido después de pagado, línea de tiempo
-- para el cliente, e inventario suelto de placas ya hechas.
-- ---------------------------------------------------------------------------

-- Los cuatro estados nuevos: el pedido pagado avanza por producción y envío.
alter table pedidos drop constraint pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check
  check (estado = any (array[
    'pendiente','pagado','rechazado','cancelado','reembolsado',
    'en_produccion','listo','enviado','entregado'
  ]));

-- Historial de cada cambio de etapa: de aquí sale la línea de tiempo pública
-- y queda registro de quién movió qué pedido y cuándo. 'pagado' NO se
-- registra aquí: ya vive en pedidos.pagado_en, que lo escribe pago-webhook.
create table pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  estado text not null check (estado in ('en_produccion','listo','enviado','entregado')),
  nota text,
  creado_en timestamptz not null default now(),
  creado_por uuid references auth.users(id)
);
create index pedido_eventos_pedido_id_idx on pedido_eventos (pedido_id, creado_en);

alter table pedido_eventos enable row level security;
create policy "admins ven eventos" on pedido_eventos
  for select to authenticated using (is_admin_user());
grant select on pedido_eventos to authenticated;

-- Inventario suelto: placas ya hechas, sin pedido asignado todavía (para
-- tener stock de las formas/colores que más se piden). Una fila por
-- combinación forma+color; Esmeralda la actualiza a mano desde el panel.
create table inventario_placas (
  id uuid primary key default gen_random_uuid(),
  forma text not null check (forma in ('hueso','circulo','rect','cuadrado')),
  color text not null check (color in ('verde','azul','morado','rojo','amarillo','blanco')),
  cantidad int not null default 0 check (cantidad >= 0),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users(id),
  unique (forma, color)
);
alter table inventario_placas enable row level security;
create policy "admins ven inventario" on inventario_placas
  for select to authenticated using (is_admin_user());
create policy "admins escriben inventario" on inventario_placas
  for all to authenticated using (is_admin_user()) with check (is_admin_user());
grant select, insert, update, delete on inventario_placas to authenticated;

-- Avanza un pedido a una etapa de producción/envío y deja el evento en el
-- historial, en la misma transacción. Solo admins, y solo sobre pedidos que
-- ya estén pagados o más adelante en el flujo (no tiene sentido "iniciar
-- producción" de algo que nadie pagó).
create or replace function avanzar_pedido_estado(p_pedido_id uuid, p_estado text, p_nota text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_actual text;
begin
  if not is_admin_user() then
    raise exception 'no autorizado';
  end if;
  if p_estado not in ('en_produccion','listo','enviado','entregado') then
    raise exception 'estado invalido: %', p_estado;
  end if;

  select estado into v_estado_actual from pedidos where id = p_pedido_id;
  if v_estado_actual is null then
    raise exception 'pedido no encontrado';
  end if;
  if v_estado_actual not in ('pagado','en_produccion','listo','enviado','entregado') then
    raise exception 'el pedido todavia no esta pagado (estado actual: %)', v_estado_actual;
  end if;

  update pedidos set estado = p_estado where id = p_pedido_id;

  insert into pedido_eventos (pedido_id, estado, nota, creado_por)
  values (p_pedido_id, p_estado, nullif(trim(p_nota), ''), auth.uid());
end;
$$;

grant execute on function avanzar_pedido_estado(uuid, text, text) to authenticated;
