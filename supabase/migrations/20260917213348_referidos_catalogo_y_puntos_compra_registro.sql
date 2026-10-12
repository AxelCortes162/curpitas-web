-- Ajustes al programa de puntos, pedidos por Axel el 17/09:
--   - Catálogo de premios nuevo (5 opciones en vez de 3).
--   - Puntos por registrarse: 50 (retroactivo a las cuentas que ya existen).
--   - Puntos por compra propia: 150 por cada placa (antes no existía).
--   - Puntos por referido: 100 (antes 500).

-- 1. Catálogo de premios nuevo.
alter table public.solicitudes_canje drop constraint solicitudes_canje_premio_check;
alter table public.solicitudes_canje add constraint solicitudes_canje_premio_check
  check (premio in ('bolsas_popo', 'plato', 'totebag', 'segunda_placa', 'sudadera'));

-- 2. Dos fuentes nuevas de puntos: 'registro' y 'compra' (antes solo existían
--    'referido' y 'canje').
alter table public.puntos_movimientos drop constraint puntos_movimientos_tipo_check;
alter table public.puntos_movimientos add constraint puntos_movimientos_tipo_check
  check (tipo in ('registro', 'compra', 'referido', 'canje'));

-- Nunca más de un 'registro' por tutor, ni más de una 'compra' por pedido
-- (mismo principio que ya protegía 'referido' por pedido).
create unique index puntos_movimientos_registro_por_tutor
  on public.puntos_movimientos (tutor_id)
  where tipo = 'registro';

create unique index puntos_movimientos_compra_por_pedido
  on public.puntos_movimientos (pedido_id)
  where tipo = 'compra';

-- 3. Costos actualizados en el canje.
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
    when 'bolsas_popo' then 350
    when 'plato' then 750
    when 'totebag' then 1050
    when 'segunda_placa' then 1200
    when 'sudadera' then 3500
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

-- 4. 50 puntos por registrarse, en el mismo trigger que ya crea el perfil al
--    darse de alta -- una sola vez por cuenta, protegido por el unique index
--    de arriba (si algún día este trigger se dispara dos veces por la misma
--    cuenta, el segundo insert de puntos choca en vez de duplicar).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  );

  insert into public.puntos_movimientos (tutor_id, tipo, puntos, descripcion)
  values (new.id, 'registro', 50, 'Registro de cuenta');

  return new;
end;
$$;

-- 5. Retroactivo: las cuentas que ya existían antes de este cambio también
--    ganan sus 50 puntos de registro, una sola vez.
insert into public.puntos_movimientos (tutor_id, tipo, puntos, descripcion)
select id, 'registro', 50, 'Registro de cuenta (retroactivo)'
from public.profiles
on conflict (tutor_id) where (tipo = 'registro') do nothing;
