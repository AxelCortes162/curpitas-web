# Sistema de referidos — puntos para dueños de mascotas

**Ya construido y desplegado (17/09/2026).** La otra mitad del programa de
puntos/referidos original de Axel (la primera mitad, vendedores externos,
se construyó primero — ver `vendedores-externos.md`). Este sistema es para
tutores que ya tienen una CURPita: puntos por registrarse, por comprar, y
por recomendar a otro dueño de mascota — sin dinero de por medio.

## Fuentes de puntos y catálogo de premios (actualizado 17/09)

La primera versión solo cubría el referido. Axel pidió después expandirlo
a un programa de puntos completo, con estos números:

- **Registrarse:** 50 pts, una sola vez por cuenta. Se acredita en el mismo
  trigger que crea el perfil (`handle_new_user`), y se aplicó **retroactivo**
  a las 8 cuentas que ya existían antes de este cambio.
- **Comprar una placa:** 150 pts por cada placa del pedido (`150 × cantidad`).
  Se acredita al tutor cuya cuenta tenga el mismo correo que el pedido — ver
  la limitación de esto más abajo.
- **Referir a alguien:** 100 pts cuando el pedido de la persona referida
  queda `pagado` (antes eran 500 — se bajó cuando se agregaron las otras dos
  fuentes, para que el total no se disparara).

Catálogo de canje (`solicitudes_canje.premio`, costos fijos en
`solicitar_canje`, igual que los precios de las placas nunca vienen del
navegador):

| Premio | Costo |
|---|---|
| Bolsitas para popó (`bolsas_popo`) | 350 pts |
| Plato CURPitas (`plato`) | 750 pts |
| Totebag (`totebag`) | 1,050 pts |
| Segunda placa (`segunda_placa`) | 1,200 pts |
| Sudadera CURPitas (`sudadera`) | 3,500 pts |

## Limitación conocida: puntos por compra propia y checkout de invitado

El checkout de `/pedir` no exige sesión — cualquiera compra con solo su
nombre, teléfono y correo, sin necesitar cuenta. Los puntos por compra
(150/placa) se acreditan buscando un perfil cuyo `email` coincida
(exacto, en minúsculas) con el correo del pedido. Si nadie tiene cuenta con
ese correo — el caso más común, sobre todo con clientes nuevos — **no se
acredita nada**, silenciosamente. No es un bug: no hay a quién acreditarle
si no hay cuenta. Si algún día se quiere que todo el mundo gane sus puntos
de compra, hay que decidir si vale la pena forzar login para comprar (cambio
grande) o resolverlo de otra forma (p. ej. que el tutor reclame retroactivo
sus pedidos viejos por correo, como ya existe `reclamar_placa` para folios).

El referido, en cambio, **no tiene este problema**: quien gana los puntos
es siempre el dueño del código (una cuenta real), sin importar si la
persona que compró con ese código tiene cuenta o no.

## Reglas que Axel confirmó antes de construir

1. **El referido se acredita cuando el pedido queda `pagado`** — no se
   espera a `entregado` (a diferencia de la comisión de vendedores, que sí
   espera a la entrega, porque ahí sí hay dinero real saliendo del negocio;
   aquí son puntos internos).
2. **El canje lo pide el propio tutor desde su cuenta** — un botón
   "Canjear" que descuenta los puntos y crea una solicitud pendiente; Axel
   la ve en un panel y la surte a mano (le habla al tutor, le manda el
   premio, etc.). No es autoservicio de principio a fin — el que se
   automatiza es pedir el canje, no entregarlo.
3. **Anti-abuso: bloqueo simple.** Un código no se puede usar en un pedido
   cuyo correo o teléfono coincida con el del dueño de ese código —
   evita el caso obvio de auto-referirse con otra cuenta, sin construir
   nada más elaborado. Esto solo aplica al código de referido, no a los
   puntos de compra.

## Columna nueva en `profiles`

```sql
alter table profiles add column codigo_referido text unique;
```

Se genera la primera vez que el bloque "Refiere y gana" de `/mi-cuenta` se
monta (`generar_codigo_referido()`, 6 caracteres alfanuméricos, con
reintento si choca con el unique). No hace falta una tabla aparte tipo
`vendedores`: a diferencia de un vendedor externo, un tutor **ya es** una
cuenta real con perfil — el código es solo un dato más de esa fila.

## Columna nueva en `pedidos`

```sql
alter table pedidos add column referido_por uuid references profiles(id);
```

`null` si nadie puso código. Convive con `vendedor_id` — en la práctica
nunca se llenan los dos a la vez, porque el checkout solo tiene un campo de
código y el helper prueba primero contra vendedores.

## Un solo campo de código en el checkout, dos tablas por dentro

El checkout ya tenía el campo "Código de quien te recomendó" (para
vendedores). Se reutiliza para los dos casos, en `crear-pago` y
`pedido-manual`: primero se busca en `vendedores`; si no coincide, se busca
en `profiles.codigo_referido`. Solo si NO coincidió con ningún vendedor se
intenta contra tutores — así nunca se llenan `vendedor_id` y
`referido_por` en el mismo pedido.

Si coincide con el código de un tutor, antes de atribuirlo se revisa el
anti-abuso: si el correo o teléfono del pedido coincide con el del dueño
del código, se ignora igual que un código inválido (no truena el checkout
público). En el alta manual (`pedido-manual`), igual que con vendedores,
aquí sí avisa si el código no existe — quien lo escribe es del equipo.

## Tabla `puntos_movimientos` (el ledger)

```sql
create table puntos_movimientos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id),
  tipo text not null check (tipo in ('registro', 'compra', 'referido', 'canje')),
  puntos integer not null,              -- positivo si gana, negativo si canjea
  pedido_id uuid references pedidos(id),  -- de dónde salió, si aplica
  descripcion text,
  vence_en timestamptz,                  -- solo en movimientos que ganan puntos
  creado_en timestamptz not null default now()
);
```

Ledger (histórico de movimientos), no una sola columna de saldo en
`profiles` — mismo principio que `comision_pct_aplicado` en vendedores:
cada movimiento queda fijo en su momento, se audita de dónde salió, y
agregar una fuente nueva es solo otro valor de `tipo`, no un rediseño.
Índices únicos parciales evitan duplicados: un solo `'registro'` por
tutor, y un solo `'compra'` o `'referido'` por `pedido_id` (protege contra
reintentos del webhook de Mercado Pago).

`vence_en` se llena solo a 12 meses de `creado_en` en los movimientos que
ganan puntos, vía trigger (`fijar_vencimiento_puntos`) — así ninguna Edge
Function tiene que calcularlo. El saldo disponible (`saldo_puntos`) solo
cuenta lo que no ha vencido; los canjes siempre restan. **Simplificación
consciente:** no hace vencimiento FIFO estricto, pero el resultado final
(cuánto puede gastar hoy) siempre es correcto.

RLS: cada tutor lee sus propios movimientos (`tutor_id = auth.uid()`);
admins ven todo. Nadie inserta directo desde el navegador — siempre vía
`solicitar_canje`/`handle_new_user` (security definer) o desde las Edge
Functions con el service role (que necesita su propio `GRANT` a nivel de
tabla, aparte de RLS).

## Solicitud de canje

```sql
create table solicitudes_canje (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references profiles(id),
  premio text not null check (premio in ('bolsas_popo', 'plato', 'totebag', 'segunda_placa', 'sudadera')),
  puntos_usados integer not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now(),
  atendido_en timestamptz
);
```

`solicitar_canje(premio text)` — security definer, valida sesión, calcula
el costo (tabla fija arriba), confirma `saldo_puntos(auth.uid()) >= costo`,
y en la misma transacción inserta la solicitud **y** el movimiento
negativo. Si no alcanza, truena antes de tocar nada.

`marcar_canje_entregado(solicitud_id)` — mismo patrón de doble candado que
`marcar_comision_pagada`: solo admin.

## Pantallas

**`/mi-cuenta`** — bloque "Refiere y gana": código con botón de
copiar/compartir el link (`?v=CODIGO`, mismo parámetro que usan los
vendedores), saldo de puntos, los cinco premios con botón "Canjear"
(deshabilitado si no alcanza o si ya hay una solicitud pendiente), e
historial de movimientos.

**`/admin/referidos`** (`ReferidosCanjes.jsx`) — lista de solicitudes de
canje, con botón "Marcar entregado" por cada una pendiente. Enlazada desde
`/admin` junto a Vendedores.

**`/admin/producción`** — badge verde "Ref: Nombre" junto al morado de
vendedor, cuando el pedido tiene `referido_por`.

## Diferencias clave contra vendedores externos (por qué es más simple)

- No hace falta crear cuentas nuevas ni una ruta protegida especial — el
  tutor ya tiene sesión y ya tiene `/mi-cuenta`.
- No hace falta una vista tipo `mis_ventas_vendedor` para esconder datos de
  otros clientes — cada tutor solo ve sus propios movimientos por RLS
  normal.
- No hay dinero real saliendo del negocio, así que no hay bloque de
  "comisión" en la calculadora del admin — el pasivo pendiente vive en
  `solicitudes_canje.estado = 'pendiente'`.

## Pendiente

- Los puntos por compra propia (150/placa) solo se acreditan si el
  comprador ya tenía cuenta con ese correo al momento de pagar — ver la
  limitación completa arriba. No hay backfill de pedidos viejos.
- No hay forma de que un tutor reclame puntos de una compra anterior a que
  tuviera cuenta (paralelo a `reclamar_placa`, pero para puntos) — no se
  pidió, se deja anotado por si hace falta después.
