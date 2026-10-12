-- El Edge Function corre como service_role. Ese rol se salta el RLS, pero
-- igual necesita permiso a nivel tabla, y al crear pet_scans a mano no lo
-- recibió. Sin esto el aviso falla con "permission denied".
grant select, insert, update, delete on public.pet_scans to service_role;
