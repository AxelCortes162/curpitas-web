-- Igual que resumen_vendedores: solo pedidos reales, y la comisión se libera
-- con la placa entregada Y pagada completa.
create or replace view mis_ventas_vendedor as
 select id, forma, color, nombre_mascota, cantidad, total, estado, pagado_en, creado_en, comision_pct_aplicado,
        round(total * comision_pct_aplicado / 100::numeric, 2) as comision,
        estado = 'entregado'::text and pagado_en is not null as comision_liberada,
        comision_pagada
   from pedidos p
  where vendedor_id = auth.uid()
    and estado in ('pagado', 'en_produccion', 'listo', 'enviado', 'entregado');
