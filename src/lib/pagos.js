// ---------------------------------------------------------------------------
// PAGOS — todo lo que el navegador necesita para cobrar.
//
// Regla que no se rompe: el navegador NUNCA manda el precio. Solo dice qué
// quiere el cliente (forma, color, nombre, cantidad) y el servidor calcula el
// total. Si el precio viajara desde aquí, cualquiera podría abrir la consola y
// comprarse una placa en $1.
//
// Lo que sí se pide al servidor es la LISTA de precios, para poder mostrar el
// total antes de pagar. Escribirla a mano en este archivo sería el mismo error
// que ya nos costó caro: dos listas que se desfasan.
//
// Las formas y los colores viven en lib/placa.js, que describe el producto.
// ---------------------------------------------------------------------------

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function leerJson(res) {
  const texto = await res.text();
  let cuerpo = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    // El servidor respondió algo que no es JSON (una página de error del
    // gateway, por ejemplo). Se trata como fallo, no se rompe la pantalla.
  }
  if (!res.ok) {
    throw new Error(cuerpo?.error || `El servidor respondió ${res.status}.`);
  }
  return cuerpo;
}

// Lista de precios vigente, leída de app_config por la función
// precios-publicos. Cambia rara vez, así que se puede cachear un rato.
export async function obtenerPrecios() {
  const res = await fetch(`${BASE}/precios-publicos`, {
    headers: { accept: 'application/json' },
  });
  return leerJson(res);
}

// Espejo de la regla del servidor, SOLO para mostrar el total en pantalla.
// El cobro real lo decide crear-pago. Si esta función y el servidor no
// coinciden, manda el servidor: el cliente vería un monto distinto al llegar a
// Mercado Pago, así que cualquier cambio en los tiers hay que reflejarlo en
// los dos lados.
//
// El hueso SIEMPRE es personalizada: siempre lleva el nombre grabado y
// siempre cuesta el precio de personalizada (regla de Axel, 29/09/2026).
//
// La personalizada NUNCA entra al precio de
// mayoreo, sin importar la cantidad: cada placa lleva su propio grabado a
// mano, así que el trabajo no baja por pedir más. Antes se revisaba primero
// la cantidad, así que un pedido grande de placas con nombre se cobraba al
// precio de mayoreo por error — se perdía el costo del grabado en cada una.
//
// Un pedido puede mezclar formas y colores (piezas). El mayoreo se decide con
// la suma de TODAS las placas sin grabado del pedido, no línea por línea: 5
// círculos verdes + 5 cuadrados azules son 10 placas y van a mayoreo.
export const cantidadValida = (c) => Math.max(1, Math.min(100, parseInt(c, 10) || 1));

export function calcularTotal(precios, piezas) {
  if (!precios || !piezas?.length) return null;
  const sencillas = piezas
    .filter((p) => p.forma !== 'hueso')
    .reduce((a, p) => a + cantidadValida(p.cantidad), 0);
  const esMayoreo = sencillas >= precios.mayoreo_desde;
  const lineas = piezas.map((p) => {
    const cantidad = cantidadValida(p.cantidad);
    let unitario;
    if (p.forma === 'hueso') unitario = precios.personalizada;
    else if (esMayoreo) unitario = precios.mayoreo;
    else unitario = precios.sencilla;
    return { ...p, cantidad, unitario, subtotal: unitario * cantidad };
  });
  const cantidad = lineas.reduce((a, l) => a + l.cantidad, 0);
  return {
    lineas,
    // El unitario solo tiene sentido cuando todas las placas cuestan lo mismo.
    unitario: lineas.every((l) => l.unitario === lineas[0].unitario) ? lineas[0].unitario : null,
    cantidad,
    total: Math.round(lineas.reduce((a, l) => a + l.subtotal, 0) * 100) / 100,
    esMayoreo,
    esPersonalizada: lineas.every((l) => l.forma === 'hueso'),
    hayPersonalizada: lineas.some((l) => l.forma === 'hueso'),
  };
}

// Crea el pedido y la orden de pago. Devuelve { pedido_id, total, url }.
// La url es la página de Mercado Pago: el que llama redirige ahí.
// piezas: [{ forma, color, cantidad, nombreMascota }]
export async function iniciarPago({
  piezas, nombreCliente, telefono, email, codigoVendedor,
}) {
  const res = await fetch(`${BASE}/crear-pago`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      piezas: piezas.map((p) => ({
        forma: p.forma,
        color: p.color,
        cantidad: cantidadValida(p.cantidad),
        nombre_mascota: p.nombreMascota || '',
      })),
      nombre_cliente: nombreCliente,
      telefono,
      email,
      codigo_vendedor: codigoVendedor || '',
    }),
  });
  const datos = await leerJson(res);
  if (!datos?.url) throw new Error('La pasarela no devolvió el link de pago.');
  return datos;
}

// En qué estado está un pedido: 'pendiente' | 'pagado' | 'rechazado' |
// 'cancelado' | 'reembolsado'. Se usa en /gracias, porque Mercado Pago regresa
// al cliente antes de avisarle a nuestro servidor.
export async function consultarPedido(pedidoId) {
  const res = await fetch(`${BASE}/estado-pedido?pedido=${encodeURIComponent(pedidoId)}`, {
    headers: { accept: 'application/json' },
  });
  return leerJson(res);
}

// Mensaje para cotizar por WhatsApp, con lo que ya eligió el cliente. Es la
// otra puerta: quien no quiere pagar en línea escribe, y no se pierde la venta.
// lineas: [{ forma, color, cantidad, nombreMascota }] con nombres legibles.
export function textoCotizacion(lineas) {
  return [
    'Hola, quiero cotizar una CURPita.',
    ...lineas.map((l) => `${l.cantidad} × ${l.forma} ${l.color.toLowerCase()}`
      + (l.nombreMascota ? ` (nombre: ${l.nombreMascota})` : '')),
  ].join('\n');
}

export const pesos = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);