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

  -- pedido_eventos solo acepta etapas de producción; 'pagado' sale de pagado_en.
  if p_entregada then
    insert into pedido_eventos (pedido_id, estado, nota, creado_por)
    values (v_id, 'entregado', 'Venta en persona', auth.uid());
  end if;

  if p_de_inventario then
    update inventario_placas
       set cantidad = greatest(cantidad - p_cantidad, 0), actualizado_en = now(), actualizado_por = auth.uid()
     where forma = p_forma and color = p_color;
  end if;

  return v_id;
end $$;
