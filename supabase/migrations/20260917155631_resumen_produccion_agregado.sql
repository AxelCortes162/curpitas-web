-- Agregado de pedidos por etapa, calculado en la base (no en el cliente).
-- Necesario porque /admin/produccion va a paginar la lista de pedidos, pero
-- las tarjetas de resumen (pedidos + placas por etapa) tienen que seguir
-- mostrando el TOTAL real, no solo lo que trae la página actual. Devuelve
-- nada más 5 filas (una por etapa) sin importar cuántos pedidos haya.
--
-- security invoker (el default): corre con los privilegios de quien llama,
-- así que la RLS de "admins ven pedidos" se sigue aplicando sola adentro —
-- un no-admin que la llame simplemente recibe cero filas, sin necesidad de
-- duplicar aquí el chequeo de is_admin_user().
create or replace function public.resumen_produccion()
returns table(estado text, pedidos bigint, placas bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select estado, count(*)::bigint as pedidos, coalesce(sum(cantidad), 0)::bigint as placas
  from pedidos
  where estado in ('pagado', 'en_produccion', 'listo', 'enviado', 'entregado')
  group by estado;
$$;

-- Igual que avanzar_pedido_estado: capa extra, aunque la RLS ya protege el
-- contenido, un visitante sin sesión no debería ni poder llamarla.
revoke all on function public.resumen_produccion() from public;
grant execute on function public.resumen_produccion() to authenticated;
