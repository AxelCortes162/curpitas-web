-- La politica "admins ven pedidos" ya existia, pero nunca se le dio el GRANT
-- de tabla a 'authenticated' -- nadie lo habia notado porque hasta ahora
-- solo las Edge Functions (service_role) tocaban pedidos. Produccion.jsx es
-- la primera consulta directa desde el navegador con sesion de usuario.
grant select on pedidos to authenticated;
