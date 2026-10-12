-- Un pedido puede mezclar formas y colores. Cada linea va en piezas:
-- [{ forma, color, cantidad, nombre_mascota, precio_unitario }].
-- forma/color/nombre_mascota siguen guardando la PRIMERA linea y cantidad la
-- suma, para que todo lo que ya lee esas columnas siga funcionando. Los
-- pedidos viejos quedan con piezas = null y se leen como una sola linea.
alter table public.pedidos add column if not exists piezas jsonb;

create or replace view public.mis_ventas_vendedor as
 SELECT id,
    forma,
    color,
    nombre_mascota,
    cantidad,
    total,
    estado,
    pagado_en,
    creado_en,
    comision_pct_aplicado,
    round(((total * comision_pct_aplicado) / (100)::numeric), 2) AS comision,
    ((estado = 'entregado'::text) AND (pagado_en IS NOT NULL)) AS comision_liberada,
    comision_pagada,
    piezas
   FROM pedidos p
  WHERE ((vendedor_id = auth.uid()) AND (estado = ANY (ARRAY['pagado'::text, 'en_produccion'::text, 'listo'::text, 'enviado'::text, 'entregado'::text])));
