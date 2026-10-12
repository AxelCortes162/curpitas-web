-- Puntos del programa al liquidarse un pedido (mismas reglas que pedido-manual,
-- ver claude/sistema-referidos.md). Los índices únicos por pedido evitan
-- acreditar dos veces.
create or replace function acreditar_puntos_pedido(p_pedido_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_p pedidos%rowtype;
  v_tutor uuid;
begin
  select * into v_p from pedidos where id = p_pedido_id;
  if v_p.referido_por is not null then
    insert into puntos_movimientos (tutor_id, tipo, puntos, pedido_id, descripcion)
    values (v_p.referido_por, 'referido', 100, v_p.id, 'Referido: pedido de ' || v_p.nombre_cliente)
    on conflict do nothing;
  end if;
  if v_p.email is not null then
    select id into v_tutor from profiles where email = lower(trim(v_p.email));
    if v_tutor is not null then
      insert into puntos_movimientos (tutor_id, tipo, puntos, pedido_id, descripcion)
      values (v_tutor, 'compra', 150 * greatest(v_p.cantidad, 1), v_p.id, 'Compra: ' || v_p.cantidad || ' placa(s)')
      on conflict do nothing;
    end if;
  end if;
end $$;
revoke execute on function acreditar_puntos_pedido(uuid) from public, anon, authenticated;

create or replace function registrar_abono(p_pedido_id uuid, p_monto numeric)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_p pedidos%rowtype;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto invalido'; end if;

  update pedidos set monto_pagado = least(monto_pagado + p_monto, total)
   where id = p_pedido_id and pagado_en is null and estado <> 'cancelado'
  returning * into v_p;

  if v_p.id is null then raise exception 'el pedido no existe, ya estaba liquidado o fue cancelado'; end if;

  if v_p.monto_pagado >= v_p.total then
    update pedidos set pagado_en = now() where id = p_pedido_id;
    perform acreditar_puntos_pedido(p_pedido_id);
  end if;

  return v_p.monto_pagado;
end $$;

-- Corrige cuánto se ha pagado de un pedido (se capturó mal). Si queda
-- completo, se liquida (y si ya estaba liquidado conserva su fecha); si no,
-- vuelve a deber y deja de contar en la calculadora.
-- ponytail: si un pedido liquidado vuelve a deber, los puntos ya dados no se quitan.
create or replace function corregir_pago(p_pedido_id uuid, p_monto_pagado numeric)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_p pedidos%rowtype;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  if p_monto_pagado is null or p_monto_pagado < 0 then raise exception 'monto invalido'; end if;

  update pedidos
     set monto_pagado = least(p_monto_pagado, total),
         pagado_en = case when p_monto_pagado >= total then coalesce(pagado_en, now()) end
   where id = p_pedido_id and estado in ('pagado', 'en_produccion', 'listo', 'enviado', 'entregado')
  returning * into v_p;

  if v_p.id is null then raise exception 'el pedido no existe o esta cancelado'; end if;
  if v_p.pagado_en is not null then perform acreditar_puntos_pedido(p_pedido_id); end if;
end $$;

-- Deshace el último avance de etapa (se picó por error). Borra el evento de
-- la etapa que se deshace para que la línea de tiempo del cliente no mienta.
create or replace function regresar_etapa(p_pedido_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_etapas text[] := array['pagado', 'en_produccion', 'listo', 'enviado', 'entregado'];
  v_actual text;
  v_i int;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;

  select estado into v_actual from pedidos where id = p_pedido_id for update;
  v_i := array_position(v_etapas, v_actual);
  if v_i is null or v_i = 1 then raise exception 'este pedido no tiene etapa anterior'; end if;

  update pedidos set estado = v_etapas[v_i - 1] where id = p_pedido_id;
  delete from pedido_eventos
   where id = (select id from pedido_eventos where pedido_id = p_pedido_id and estado = v_actual
               order by creado_en desc limit 1);

  return v_etapas[v_i - 1];
end $$;

revoke execute on function corregir_pago(uuid, numeric) from anon;
revoke execute on function regresar_etapa(uuid) from anon;
