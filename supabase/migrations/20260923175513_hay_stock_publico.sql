create or replace function public.hay_stock(p_forma text, p_color text, p_cantidad integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(cantidad), 0) >= greatest(coalesce(p_cantidad, 1), 1)
  from inventario_placas
  where forma = p_forma and color = p_color;
$$;

revoke all on function public.hay_stock(text, text, integer) from public;
grant execute on function public.hay_stock(text, text, integer) to anon, authenticated;
