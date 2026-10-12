-- Corrige lo que se capturó mal de un pedido: forma, color y nombre de la
-- mascota de cada pieza, y nombre/teléfono del cliente. Cantidad y precio no
-- se tocan aquí (mueven el dinero; para eso está corregir_pago).
-- p_piezas: [{forma, color, nombre_mascota}] en el mismo orden y número que
-- las piezas del pedido (1 si es un pedido de una sola pieza).
create or replace function editar_pedido(
  p_pedido_id uuid, p_piezas jsonb, p_nombre_cliente text, p_telefono text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_p pedidos%rowtype;
  v_n int;
  v_pz jsonb;
  v_nuevas jsonb := '[]'::jsonb;
  v_i int;
  v_viejas jsonb;
begin
  if not is_admin_user() then raise exception 'no autorizado'; end if;

  select * into v_p from pedidos where id = p_pedido_id for update;
  if v_p.id is null then raise exception 'pedido no encontrado'; end if;

  v_viejas := case when jsonb_array_length(coalesce(v_p.piezas, '[]'::jsonb)) > 0 then v_p.piezas
                   else jsonb_build_array(jsonb_build_object('cantidad', v_p.cantidad, 'precio_unitario', v_p.precio_unitario)) end;
  v_n := jsonb_array_length(v_viejas);
  if jsonb_typeof(p_piezas) <> 'array' or jsonb_array_length(p_piezas) <> v_n then
    raise exception 'el pedido tiene % pieza(s)', v_n;
  end if;
  if coalesce(trim(p_nombre_cliente), '') = '' then raise exception 'falta el nombre del cliente'; end if;
  if length(regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g')) < 10 then raise exception 'el telefono debe traer 10 digitos'; end if;

  for v_i in 0 .. v_n - 1 loop
    v_pz := p_piezas -> v_i;
    if not (v_pz->>'forma' = any (array['hueso','circulo','rect','cuadrado','pescado'])) then raise exception 'forma invalida'; end if;
    if not (v_pz->>'color' = any (array['verde','azul','morado','rojo','amarillo','blanco'])) then raise exception 'color invalido'; end if;
    if v_pz->>'forma' = 'hueso' and coalesce(trim(v_pz->>'nombre_mascota'), '') = '' then
      raise exception 'la placa de hueso siempre lleva el nombre de la mascota';
    end if;
    -- Cantidad y precio se conservan de la pieza original.
    v_nuevas := v_nuevas || jsonb_build_array((v_viejas -> v_i) || jsonb_build_object(
      'forma', v_pz->>'forma', 'color', v_pz->>'color',
      'nombre_mascota', left(coalesce(trim(v_pz->>'nombre_mascota'), ''), 12)));
  end loop;

  update pedidos set
    forma = v_nuevas->0->>'forma',
    color = v_nuevas->0->>'color',
    nombre_mascota = nullif(v_nuevas->0->>'nombre_mascota', ''),
    piezas = case when v_p.piezas is not null and jsonb_array_length(v_p.piezas) > 0 then v_nuevas end,
    nombre_cliente = left(trim(p_nombre_cliente), 80),
    telefono = left(regexp_replace(p_telefono, '\D', '', 'g'), 15)
  where id = p_pedido_id;
end $$;

revoke execute on function editar_pedido(uuid, jsonb, text, text) from anon;
