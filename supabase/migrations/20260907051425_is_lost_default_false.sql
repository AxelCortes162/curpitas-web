-- Las placas nuevas nacían marcadas como perdidas: el banner rojo salía
-- desde el día uno. El default correcto es false.
alter table public.pets alter column is_lost set default false;

-- Y las placas todavía sin dueño no están perdidas, están sin activar.
-- No se tocan las que ya tienen dueño: ahí la bandera la decide el tutor.
update public.pets
   set is_lost = false
 where owner_id is null
   and is_lost is distinct from false;
