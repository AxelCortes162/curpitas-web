-- Sistema de referidos para dueños de mascotas: puntos, no comisión.
-- Ver claude/sistema-referidos.md (proyecto de Claude) para el diseño completo.

-- 1. Código de referido por tutor. Se genera bajo demanda (generar_codigo_referido),
--    no al crear la cuenta -- la mayoría de los tutores nunca lo va a usar.
alter table public.profiles add column codigo_referido text unique;

-- 2. Atribución en el pedido. Convive con vendedor_id (mutuamente excluyentes en
--    la práctica: el checkout solo tiene un campo de código, y las funciones
--    prueban primero vendedores y luego perfiles).
alter table public.pedidos add column referido_por uuid references public.profiles(id);

-- 3. El ledger de puntos. Un movimiento por evento (nunca una sola columna de
--    saldo) para poder auditar de dónde salió cada punto y agregar después las
--    otras fuentes ya definidas (compra propia, perfil completo) sin rediseñar
--    nada -- solo otro valor de `tipo`.
create table public.puntos_movimientos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id),
  tipo text not null check (tipo in ('referido', 'canje')),
  puntos integer not null,
  pedido_id uuid references public.pedidos(id),
  descripcion text,
  vence_en timestamptz,
  creado_en timestamptz not null default now()
);

-- Nunca más de un movimiento de tipo 'referido' por pedido -- si el webhook de
-- Mercado Pago reintenta el aviso, el segundo insert choca contra esto en vez
-- de acreditar el referido dos veces.
create unique index puntos_movimientos_referido_por_pedido
  on public.puntos_movimientos (pedido_id)
  where tipo = 'referido';

-- Los puntos que se ganan (no los que se canjean) vencen a 12 meses de
-- ganados -- regla ya definida del programa de puntos. Se calcula solo en la
-- base para no repetir la cuenta en cada Edge Function que inserte un
-- movimiento.
create or replace function public.fijar_vencimiento_puntos()
returns trigger
language plpgsql
as $$
begin
  if new.tipo <> 'canje' and new.vence_en is null then
    new.vence_en := new.creado_en + interval '12 months';
  end if;
  return new;
end;
$$;

create trigger trg_fijar_vencimiento_puntos
before insert on public.puntos_movimientos
for each row execute function public.fijar_vencimiento_puntos();

alter table public.puntos_movimientos enable row level security;

create policy "tutor ve sus propios movimientos" on public.puntos_movimientos
  for select using (tutor_id = auth.uid());

create policy "admins ven todos los movimientos" on public.puntos_movimientos
  for select using (is_admin_user());

-- Nadie inserta directo desde el navegador: siempre via solicitar_canje
-- (security definer) o desde las Edge Functions con el service role, que
-- necesita su propio GRANT a nivel de tabla aparte de RLS -- el mismo gotcha
-- ya documentado tres veces en este proyecto (pet_scans, pedido_eventos,
-- vendedores): service_role se salta RLS pero no los GRANT.
grant select on public.puntos_movimientos to authenticated;
grant select, insert on public.puntos_movimientos to service_role;

-- Saldo disponible: solo cuenta lo que no ha vencido (los canjes siempre
-- cuentan, restan). SECURITY INVOKER (no definer) a propósito, mismo patrón
-- que resumen_produccion()/resumen_vendedores() -- las políticas de RLS de
-- arriba ya limitan un tutor a sus propias filas sin importar qué tutor_id
-- se le pase.
create or replace function public.saldo_puntos(p_tutor_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(puntos), 0)::integer
  from public.puntos_movimientos
  where tutor_id = p_tutor_id
    and (tipo = 'canje' or vence_en > now());
$$;

-- 4. Solicitudes de canje. El tutor las pide desde su cuenta; Axel las surte a
--    mano y las marca entregadas.
create table public.solicitudes_canje (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id),
  premio text not null check (premio in ('plato', 'segunda_placa', 'sudadera')),
  puntos_usados integer not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now(),
  atendido_en timestamptz
);

alter table public.solicitudes_canje enable row level security;

create policy "tutor ve sus propias solicitudes" on public.solicitudes_canje
  for select using (tutor_id = auth.uid());

create policy "admins gestionan solicitudes" on public.solicitudes_canje
  for all using (is_admin_user()) with check (is_admin_user());

grant select on public.solicitudes_canje to authenticated;

-- Pide un canje: valida que le alcance, descuenta los puntos y crea la
-- solicitud en la misma transacción. Los costos son fijos aquí adentro, igual
-- que los precios de las placas nunca vienen del navegador.
create or replace function public.solicitar_canje(p_premio text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_costo integer;
  v_saldo integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'necesitas iniciar sesión';
  end if;

  v_costo := case p_premio
    when 'plato' then 800
    when 'segunda_placa' then 1500
    when 'sudadera' then 3000
    else null
  end;
  if v_costo is null then
    raise exception 'premio no reconocido';
  end if;

  v_saldo := saldo_puntos(auth.uid());
  if v_saldo < v_costo then
    raise exception 'no te alcanzan los puntos: tienes % y necesitas %', v_saldo, v_costo;
  end if;

  insert into solicitudes_canje (tutor_id, premio, puntos_usados)
  values (auth.uid(), p_premio, v_costo)
  returning id into v_id;

  insert into puntos_movimientos (tutor_id, tipo, puntos, descripcion)
  values (auth.uid(), 'canje', -v_costo, 'Canje: ' || p_premio);

  return v_id;
end;
$$;

revoke execute on function public.solicitar_canje(text) from public;
grant execute on function public.solicitar_canje(text) to authenticated;

-- Solo un admin marca un canje como entregado (mismo patrón de doble candado
-- que marcar_comision_pagada).
create or replace function public.marcar_canje_entregado(p_solicitud_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not is_admin_user() then
    raise exception 'no autorizado';
  end if;

  update solicitudes_canje
  set estado = 'entregado', atendido_en = now()
  where id = p_solicitud_id;
end;
$$;

revoke execute on function public.marcar_canje_entregado(uuid) from public;
grant execute on function public.marcar_canje_entregado(uuid) to authenticated;

-- Genera el código de referido de un tutor la primera vez que lo pide (por
-- ejemplo, al abrir el bloque "Refiere y gana" en /mi-cuenta). Si ya tiene
-- uno, regresa el mismo -- nunca se le cambia solo.
create or replace function public.generar_codigo_referido()
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_codigo text;
  v_existente text;
begin
  if auth.uid() is null then
    raise exception 'necesitas iniciar sesión';
  end if;

  select codigo_referido into v_existente from profiles where id = auth.uid();
  if v_existente is not null then
    return v_existente;
  end if;

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      update profiles set codigo_referido = v_codigo where id = auth.uid();
      exit;
    exception when unique_violation then
      -- choque con otro código ya existente -- se intenta de nuevo con otro
    end;
  end loop;

  return v_codigo;
end;
$$;

revoke execute on function public.generar_codigo_referido() from public;
grant execute on function public.generar_codigo_referido() to authenticated;
