-- El revoke anterior no bastó: el privilegio venía heredado del rol PUBLIC.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- is_admin_user() se deja como está a propósito: las políticas RLS la
-- invocan como el usuario que consulta, así que quitarle EXECUTE rompería
-- el acceso de los admins. No filtra nada: solo dice si QUIEN llama es admin.
