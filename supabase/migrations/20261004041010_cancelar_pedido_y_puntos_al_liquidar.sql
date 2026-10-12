-- Ya existía /admin/pedido-manual (edge function pedido-manual); esa es la
-- puerta para ventas manuales. Esta función quedó duplicada.
drop function if exists registrar_venta_manual(text, text, int, numeric, text, text, text, numeric, boolean, boolean);

-- Abono a un pedido que todavía debe. Al completar el total se marca la fecha
-- de liquidación (desde ahí cuenta en la calculadora) y se acreditan los
-- puntos del programa, igual que pedido-manual cuando entra pagado completo.
create or replace function registrar_abono(p_pedido_id uuid, p_monto numeric)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_p pedidos%rowtype;
  v_tutor uuid;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto invalido'; end if;

  update pedidos set monto_pagado = least(monto_pagado + p_monto, total)
   where id = p_pedido_id and pagado_en is null and estado <> 'cancelado'
  returning * into v_p;

  if v_p.id is null then raise exception 'el pedido no existe, ya estaba liquidado o fue cancelado'; end if;

  if v_p.monto_pagado >= v_p.total then
    update pedidos set pagado_en = now() where id = p_pedido_id;

    -- Mismas reglas que pedido-manual (ver claude/sistema-referidos.md).
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
  end if;

  return v_p.monto_pagado;
end $$;

-- Cancelar un pedido que nunca se terminó de pagar. Los liquidados no se
-- cancelan aquí: eso ya sería un reembolso.
create or replace function cancelar_pedido(p_pedido_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  update pedidos set estado = 'cancelado'
   where id = p_pedido_id and pagado_en is null
     and estado in ('pagado', 'en_produccion', 'listo', 'enviado', 'entregado');
  if not found then raise exception 'solo se pueden cancelar pedidos que no se han liquidado'; end if;
end $$;

-- Comisiones: solo pedidos reales (ni checkouts abandonados ni cancelados), y
-- se liberan hasta que la placa está entregada Y pagada completa.
create or replace function resumen_vendedores()
returns table(vendedor_id uuid, ventas bigint, total_vendido numeric, comision_liberada numeric, comision_pendiente numeric, comision_pagada numeric)
language sql stable security definer set search_path = public as $$
  select
    p.vendedor_id,
    count(*)::bigint as ventas,
    coalesce(sum(p.total), 0) as total_vendido,
    coalesce(sum(case when p.estado = 'entregado' and p.pagado_en is not null and not p.comision_pagada
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_liberada,
    coalesce(sum(case when not (p.estado = 'entregado' and p.pagado_en is not null)
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_pendiente,
    coalesce(sum(case when p.comision_pagada
                       then p.total * p.comision_pct_aplicado / 100 else 0 end), 0) as comision_pagada
  from pedidos p
  where p.vendedor_id is not null
    and p.estado in ('pagado', 'en_produccion', 'listo', 'enviado', 'entregado')
  group by p.vendedor_id;
$$;

revoke execute on function cancelar_pedido(uuid) from anon;
