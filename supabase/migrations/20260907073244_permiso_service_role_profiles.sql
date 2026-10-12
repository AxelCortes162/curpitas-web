-- Mismo caso que pet_scans: service_role se salta el RLS pero necesita el
-- permiso a nivel tabla. Sin esto el Edge Function no lee full_name y el
-- correo sale sin el nombre del tutor.
grant select on public.profiles to service_role;
