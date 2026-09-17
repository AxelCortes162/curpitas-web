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
// La personalizada (hueso con nombre grabado) NUNCA entra al precio de
// mayoreo, sin importar la cantidad: cada placa lleva su propio grabado a
// mano, así que el trabajo no baja por pedir más. Antes se revisaba primero
// la cantidad, así que un pedido grande de placas con nombre se cobraba al
// precio de mayoreo por error — se perdía el costo del grabado en cada una.
export function calcularTotal(precios, { forma, cantidad, nombreMascota }) {
  if (!precios) return null;
  const n = Math.max(1, Math.min(100, parseInt(cantidad, 10) || 1));
  const esPersonalizada = forma === 'hueso' && !!String(nombreMascota || '').trim();
  const esMayoreo = !esPersonalizada && n >= precios.mayoreo_desde;
  let unitario;
  if (esPersonalizada) unitario = precios.personalizada;
  else if (esMayoreo) unitario = precios.mayoreo;
  else unitario = precios.sencilla;
  return {
    unitario,
    cantidad: n,
    total: Math.round(unitario * n * 100) / 100,
    esMayoreo,
    esPersonalizada,
  };
}

// Crea el pedido y la orden de pago. Devuelve { pedido_id, total, url }.
// La url es la página de Mercado Pago: el que llama redirige ahí.
export async function iniciarPago({
  forma, color, cantidad, nombreMascota, nombreCliente, telefono, email, codigoVendedor,
}) {
  const res = await fetch(`${BASE}/crear-pago`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      forma,
      color,
      cantidad,
      nombre_mascota: nombreMascota || '',
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
export function textoCotizacion({ forma, color, cantidad, nombreMascota }) {
  const partes = [
    'Hola, quiero cotizar una CURPita.',
    forma ? `Forma: ${forma}` : null,
    color ? `Color: ${color}` : null,
    nombreMascota ? `Nombre: ${nombreMascota}` : null,
    cantidad ? `Cantidad: ${cantidad}` : null,
  ].filter(Boolean);
  return partes.join('\n');
}

export const pesos = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);