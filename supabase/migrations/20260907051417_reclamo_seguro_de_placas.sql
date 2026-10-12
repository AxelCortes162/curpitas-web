-- Antes: cualquier usuario registrado podía LISTAR todas las placas sin
-- dueño y ponerse como dueño de las que quisiera, sin conocer el folio.
-- Ahora: reclamar exige conocer el folio y pasa por esta función.

create or replace function public.reclamar_placa(p_curpita text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión para vincular una placa';
  end if;

  update pets
     set owner_id = auth.uid()
   where curpita = p_curpita
     and owner_id is null
     and invalidated = false
  returning id into v_id;

  if v_id is null then
    raise exception 'Ese folio no existe, ya fue vinculado o está desactivado';
  end if;

  return v_id;
end;
$$;

revoke all on function public.reclamar_placa(text) from public, anon;
grant execute on function public.reclamar_placa(text) to authenticated;

-- Cerrar las políticas: ya nadie ve ni edita placas ajenas sin reclamar
drop policy if exists "Ver mascota propia o sin reclamar" on public.pets;
create policy "Ver mascota propia"
  on public.pets for select
  using (auth.uid() = owner_id);

drop policy if exists "Editar o reclamar mascota" on public.pets;
create policy "Editar mascota propia"
  on public.pets for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
