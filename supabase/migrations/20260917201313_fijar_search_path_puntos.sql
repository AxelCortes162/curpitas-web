create or replace function public.fijar_vencimiento_puntos()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.tipo <> 'canje' and new.vence_en is null then
    new.vence_en := new.creado_en + interval '12 months';
  end if;
  return new;
end;
$$;

create or replace function public.saldo_puntos(p_tutor_id uuid)
returns integer
language sql
stable
set search_path to 'public'
as $$
  select coalesce(sum(puntos), 0)::integer
  from public.puntos_movimientos
  where tutor_id = p_tutor_id
    and (tipo = 'canje' or vence_en > now());
$$;
