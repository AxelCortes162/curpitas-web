-- Pescado: forma que solo se vende por pedido manual (crear-pago no la acepta,
-- y no tiene fila de inventario suelto).
alter table pedidos drop constraint pedidos_forma_check;
alter table pedidos add constraint pedidos_forma_check
  check (forma = any (array['hueso', 'circulo', 'rect', 'cuadrado', 'pescado']));
