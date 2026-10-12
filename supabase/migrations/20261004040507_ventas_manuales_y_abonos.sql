-- Cuánto se ha cobrado de cada pedido. pagado_en sigue siendo la fecha en que
-- se LIQUIDA: la calculadora cuenta la venta en ese mes, no antes.
alter table pedidos add column monto_pagado numeric not null default 0;
update pedidos set monto_pagado = total where pagado_en is not null;

-- Venta registrada a mano (en persona, por WhatsApp...). Entra a producción
-- aunque no se haya pagado nada. Si ya se entregó, entra directo como entregada;
-- si salió del inventario suelto, se descuenta de ahí.
create or replace function registrar_venta_manual(
  p_forma text, p_color text, p_cantidad int, p_precio_unitario numeric,
  p_nombre_cliente text, p_telefono text, p_nombre_mascota text,
  p_pagado numeric, p_entregada boolean, p_de_inventario boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_total numeric := p_cantidad * p_precio_unitario;
  v_pagado numeric := least(greatest(coalesce(p_pagado, 0), 0), p_cantidad * p_precio_unitario);
  v_estado text := case when p_entregada then 'entregado' else 'pagado' end;
  v_id uuid;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  if p_precio_unitario is null or p_precio_unitario < 0 then raise exception 'precio invalido'; end if;
  if coalesce(trim(p_nombre_cliente), '') = '' then raise exception 'falta el nombre del cliente'; end if;

  insert into pedidos (forma, color, cantidad, precio_unitario, total, nombre_cliente, telefono,
                       nombre_mascota, estado, origen, monto_pagado, pagado_en)
  values (p_forma, p_color, p_cantidad, p_precio_unitario, v_total, trim(p_nombre_cliente),
          coalesce(trim(p_telefono), ''), nullif(trim(p_nombre_mascota), ''), v_estado, 'manual',
          v_pagado, case when v_pagado >= v_total then now() end)
  returning id into v_id;

  insert into pedido_eventos (pedido_id, estado, nota, creado_por)
  values (v_id, v_estado, 'Venta registrada a mano', auth.uid());

  if p_de_inventario then
    update inventario_placas
       set cantidad = greatest(cantidad - p_cantidad, 0), actualizado_en = now(), actualizado_por = auth.uid()
     where forma = p_forma and color = p_color;
  end if;

  return v_id;
end $$;

-- Abono a un pedido que todavía debe. Al completar el total, se marca la fecha
-- de liquidación y desde ahí cuenta en la calculadora.
create or replace function registrar_abono(p_pedido_id uuid, p_monto numeric)
returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_pagado numeric;
  v_total numeric;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto invalido'; end if;

  update pedidos set monto_pagado = least(monto_pagado + p_monto, total)
   where id = p_pedido_id and pagado_en is null
  returning monto_pagado, total into v_pagado, v_total;

  if v_pagado is null then raise exception 'el pedido no existe o ya estaba liquidado'; end if;
  if v_pagado >= v_total then
    update pedidos set pagado_en = now() where id = p_pedido_id;
  end if;

  return v_pagado;
end $$;

revoke execute on function registrar_venta_manual(text, text, int, numeric, text, text, text, numeric, boolean, boolean) from anon;
revoke execute on function registrar_abono(uuid, numeric) from anon;
