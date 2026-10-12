-- Debe seguir respetando el RLS de pedidos (solo admins), como en el original.
alter function resumen_vendedores() security invoker;
