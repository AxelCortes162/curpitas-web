-- Mismo gotcha de siempre: service_role se salta RLS pero sigue necesitando
-- GRANT a nivel de tabla. Sin esto, estado-pedido (que usa el service role
-- key) lee la tabla vacia aunque los eventos si existan.
grant select, insert, update, delete on pedido_eventos to service_role;
grant select, insert, update, delete on inventario_placas to service_role;
