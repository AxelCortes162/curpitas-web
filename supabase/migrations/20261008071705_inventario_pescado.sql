-- El pescado también se lleva en el inventario suelto.
alter table inventario_placas drop constraint inventario_placas_forma_check;
alter table inventario_placas add constraint inventario_placas_forma_check
  check (forma = any (array['hueso', 'circulo', 'rect', 'cuadrado', 'pescado']));
