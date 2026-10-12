-- De donde salio el pedido: la venta en linea (Mercado Pago) sigue siendo la
-- default, para no tocar ninguna fila existente. Los pedidos que Esmeralda
-- captura a mano (alguien escribio por WhatsApp o compro en persona) se
-- marcan 'manual' -- mismo tratamiento despues (aparecen igual en
-- /admin/produccion y en la linea de tiempo del cliente), pero le sirve para
-- distinguirlos a simple vista y, mas adelante, para reportes.
alter table public.pedidos
  add column origen text not null default 'mercadopago'
  check (origen in ('mercadopago', 'manual'));
