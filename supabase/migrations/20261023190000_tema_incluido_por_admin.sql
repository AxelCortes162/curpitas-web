-- Placas vendidas antes del cierre pero vinculadas después (p. ej. pedido del
-- 1 nov que llega el 5): el admin les incluye el tema a mano, sin número.

alter table public.pets
  add column tema_incluido text references public.pet_themes;

create or replace function public.temas(p public.pets)
returns text[]
language sql stable
set search_path to 'public'
as $$
  select coalesce(array_agg(t.id order by t.cierre), '{}')
  from pet_themes t
  where p.claimed_at < t.cierre or p.placa_edicion = t.id or p.tema_incluido = t.id;
$$;

create or replace function public.pets_temas()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- La fecha de vinculación la pone el sistema; nadie la edita.
  new.claimed_at := coalesce(old.claimed_at, case when new.owner_id is not null then now() end);

  if new.tema_incluido is distinct from old.tema_incluido
     and auth.uid() is not null and not public.is_admin_user() then
    raise exception 'Solo el administrador puede incluir temas';
  end if;

  -- Placa numerada: solo el admin la marca; el número lo asigna el sistema
  -- (el menor libre, para reusar el de una placa desmarcada).
  if new.placa_edicion is distinct from old.placa_edicion then
    if auth.uid() is not null and not public.is_admin_user() then
      raise exception 'Solo el administrador puede marcar placas de edición';
    end if;

    if new.placa_edicion is null then
      new.placa_numero := null;
    else
      perform 1 from pet_themes where id = new.placa_edicion for update; -- un número a la vez
      select min(n) into new.placa_numero
      from pet_themes t, generate_series(1, t.piezas) n
      where t.id = new.placa_edicion
        and not exists (
          select 1 from pets
          where placa_edicion = new.placa_edicion and placa_numero = n and id <> new.id
        );
      if new.placa_numero is null then
        raise exception 'Ya se asignaron todas las placas de esta edición';
      end if;
    end if;
  else
    new.placa_numero := old.placa_numero;
  end if;

  if new.theme is not null and not (new.theme = any (public.temas(new))) then
    if new.theme is distinct from old.theme then
      raise exception 'Ese tema no está desbloqueado para esta mascota';
    end if;
    new.theme := null; -- perdió el tema (p. ej. le quitaron la placa)
  end if;

  return new;
end;
$$;
