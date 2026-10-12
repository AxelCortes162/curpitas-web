-- Nuevo tipo de movimiento
alter table public.puntos_movimientos drop constraint puntos_movimientos_tipo_check;
alter table public.puntos_movimientos add constraint puntos_movimientos_tipo_check
  check (tipo in ('registro', 'compra', 'referido', 'canje', 'testimonio'));

-- Una sola vez por tutor, aunque borre su testimonio y deje otro
create unique index puntos_movimientos_testimonio_por_tutor
  on public.puntos_movimientos (tutor_id) where tipo = 'testimonio';

-- Un testimonio nuevo siempre entra sin aprobar (antes un usuario podía
-- mandarlo ya aprobado desde el navegador y saltarse la moderación)
create or replace function public.testimonio_entra_sin_aprobar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin_user() then
    new.approved := false;
  end if;
  return new;
end;
$$;

create trigger testimonio_entra_sin_aprobar
before insert on public.testimonials
for each row execute function public.testimonio_entra_sin_aprobar();

-- 150 puntos cuando el admin aprueba su primer testimonio
create or replace function public.puntos_por_testimonio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.approved = true
     and new.owner_id is not null
     and (tg_op = 'INSERT' or old.approved is distinct from true) then
    insert into puntos_movimientos (tutor_id, tipo, puntos, descripcion)
    values (new.owner_id, 'testimonio', 150, 'Testimonio publicado')
    on conflict (tutor_id) where tipo = 'testimonio' do nothing;
  end if;
  return new;
end;
$$;

create trigger puntos_por_testimonio
after insert or update of approved on public.testimonials
for each row execute function public.puntos_por_testimonio();

revoke all on function public.puntos_por_testimonio() from public, anon, authenticated;
revoke all on function public.testimonio_entra_sin_aprobar() from public, anon, authenticated;

-- Retroactivo: quienes ya tienen un testimonio aprobado
insert into public.puntos_movimientos (tutor_id, tipo, puntos, descripcion)
select distinct owner_id, 'testimonio', 150, 'Testimonio publicado'
from public.testimonials
where approved = true and owner_id is not null
on conflict (tutor_id) where tipo = 'testimonio' do nothing;
