-- avanzar_pedido_estado ya se protege por dentro con is_admin_user(), pero
-- no hay razon para que un visitante sin sesion pueda ni siquiera llamarla.
-- Mismo endurecimiento que ya tiene reclamar_placa.
revoke execute on function avanzar_pedido_estado(uuid, text, text) from anon;
revoke execute on function avanzar_pedido_estado(uuid, text, text) from public;
