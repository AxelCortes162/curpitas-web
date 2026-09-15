// ---------------------------------------------------------------------------
// QUÉ ES UNA PLACA
//
// Este archivo describe el producto físico: qué formas existen, de qué color,
// y la geometría exacta de cada una. No sabe nada de pagos ni de pantallas.
//
// La geometría de las cuatro formas está MEDIDA de fotos del producto real,
// ajustando la silueta por superposición (IoU 0.97-0.99). Los números no son a
// ojo: si se cambian, el modelo deja de parecerse a la placa. Lo único que
// sigue siendo aproximado es el barreno y la argolla del cuadrado y del
// rectángulo, y está explicado ahí abajo por qué.
//
// construirForma recibe THREE por parámetro en vez de importarlo. Así este
// archivo no arrastra three.js al bundle: solo lo carga quien de verdad va a
// dibujar en 3D.
// ---------------------------------------------------------------------------

export const MAX_NOMBRE = 12;

// Los seis colores de resina reales. Solo el verde está medido de una foto;
// los otros cinco son aproximaciones hasta que haya foto de cada uno.
export const COLORES = [
  { id: 'verde',    nombre: 'Verde',    hex: '#0B7345' },
  { id: 'azul',     nombre: 'Azul',     hex: '#16559B' },
  { id: 'morado',   nombre: 'Morado',   hex: '#63368F' },
  { id: 'rojo',     nombre: 'Rojo',     hex: '#B4202F' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#D9A310' },
  { id: 'blanco',   nombre: 'Blanco',   hex: '#D8D9D4' },
];

// grabaNombre marca las formas que llevan el nombre al frente. Tiene que
// coincidir con la regla de precios de la función crear-pago, que cobra
// "personalizada" solo cuando la forma es hueso y hay nombre. Si algún día el
// rectángulo también lleva nombre, hay que cambiarlo en los dos lados o el
// cliente vería un precio distinto en Mercado Pago.
//
// medida dice qué tanto del modelo viene de medir una foto del producto:
//   'todo'     silueta, barreno, argolla y calcomanías, todo medido
//   'contorno' silueta y calcomanías medidas; barreno y argolla aproximados,
//              porque en las fotos el alambre tapa el barreno y el brillo del
//              metal no deja ajustar bien el anillo
export const FORMAS = [
  {
    id: 'hueso', nombre: 'Hueso', grabaNombre: true, medida: 'todo',
    icono: 'M4 13c-1.6 0-2.6-1-2.6-2.3 0-.9.5-1.5 1.1-1.8-.6-.3-1.1-.9-1.1-1.8C1.4 5.8 2.4 4.8 4 4.8c1.3 0 2.2.7 2.5 1.7h11c.3-1 1.2-1.7 2.5-1.7 1.6 0 2.6 1 2.6 2.3 0 .9-.5 1.5-1.1 1.8.6.3 1.1.9 1.1 1.8 0 1.3-1 2.3-2.6 2.3-1.3 0-2.2-.7-2.5-1.7h-11C6.2 12.3 5.3 13 4 13z',
  },
  {
    id: 'circulo', nombre: 'Círculo', grabaNombre: false, medida: 'todo',
    icono: 'M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8z',
  },
  {
    id: 'rect', nombre: 'Rectángulo', grabaNombre: false, medida: 'contorno',
    icono: 'M9.6 3.2h4.8a2.6 2.6 0 012.6 2.6v12.4a2.6 2.6 0 01-2.6 2.6H9.6A2.6 2.6 0 017 18.2V5.8a2.6 2.6 0 012.6-2.6z',
  },
  {
    id: 'cuadrado', nombre: 'Cuadrado', grabaNombre: false, medida: 'contorno',
    icono: 'M7.2 4.2h9.6a3 3 0 013 3v9.6a3 3 0 01-3 3H7.2a3 3 0 01-3-3V7.2a3 3 0 013-3z',
  },
];

export const formaPorId = (id) => FORMAS.find((f) => f.id === id) ?? FORMAS[0];
export const colorPorId = (id) => COLORES.find((c) => c.id === id) ?? COLORES[0];

/* ---------------------------------------------------------------------------
   HUESO — medido de la foto del producto.

   Un hueso de placa no es un dibujo: son cuatro lóbulos, dos entrantes y una
   cintura, todos círculos tangentes entre sí. Por eso la forma se construye
   resolviendo las tangencias, no poniendo curvas a mano: así los diez arcos
   cierran exactamente, sin costuras.
--------------------------------------------------------------------------- */
function formaHueso(THREE) {
  const cx = 0.6901, cy = 0.2602, r = 0.3099, rw = 1.2397, rn = 0.2204;
  const yt = 0.5164, rt = 0.2246;                     // pestaña
  const P = Math.PI;
  const yc = cy + Math.sqrt((r + rw) * (r + rw) - cx * cx);  // centro de la cintura
  const xn = cx + Math.sqrt((r + rn) * (r + rn) - cy * cy);  // centro del entrante
  const aW = Math.atan2(cy - yc, cx);                 // tangente cintura ↔ lóbulo
  const aN = Math.atan2(cy, cx - xn);                 // tangente entrante ↔ lóbulo

  // La pestaña no es tangente a la cintura: la corta. Ese corte es justo la
  // arista que se ve en la placa real, así que se calcula dónde se cruzan los
  // dos círculos.
  const D = yc - yt;
  const fr = Math.asin((rt * rt - rw * rw - D * D) / (2 * rw * D));
  const fl = -P - fr;
  const qx = rw * Math.cos(fr), qy = yc + rw * Math.sin(fr);
  const tr = Math.atan2(qy - yt, qx), tl = P - tr;

  const s = new THREE.Shape();
  s.absarc( xn,  0,  rn, -aN,      aN,       true);   // entrante derecho
  s.absarc( cx,  cy, r,  aN + P,   aW + P,   false);  // lóbulo sup. der.
  s.absarc( 0,   yc, rw, aW,       fr,       true);   // cintura, tramo derecho
  s.absarc( 0,   yt, rt, tr,       tl,       false);  // pestaña
  s.absarc( 0,   yc, rw, fl,       P - aW,   true);   // cintura, tramo izquierdo
  s.absarc(-cx,  cy, r,  -aW,      2 * P - aN, false); // lóbulo sup. izq.
  s.absarc(-xn,  0,  rn, P - aN,   P + aN,   true);   // entrante izquierdo
  s.absarc(-cx, -cy, r,  aN,       aW,       false);  // lóbulo inf. izq.
  s.absarc( 0,  -yc, rw, P + aW,   -aW,      true);   // cintura inferior
  s.absarc( cx, -cy, r,  P - aW,   P - aN,   false);  // lóbulo inf. der.

  return {
    shape: s,
    bbox: { x0: -(cx + r), x1: cx + r, y0: -(cy + r), y1: yt + rt },
    hoyo: [0, 0.520, 0.080],
    anillo: { radio: 0.448, tubo: 0.040 },
    decal: {
      nombre: { x: 0, y: 0, em: 0.467, maxW: 1.12 },
      // El escudo mide 0.320 de alto en la placa, pero el PNG del logo trae
      // 37% de margen transparente, así que el cuadro donde se dibuja va más
      // grande que el escudo: 0.320 / 0.6248.
      logo: { x: 0.685, y: -0.323, tam: 0.5122 },
      qr: { x: 0, y: 0, d: 0.588, patron: 0.68 },
    },
  };
}

/* CÍRCULO — medido de la foto, expresado en radios del disco, para que si
   cambia el diámetro real todo se reacomode solo. */
function formaCirculo(THREE, radio) {
  const P = Math.PI;
  const yt = 1.0589 * radio, rt = 0.2243 * radio;

  // La pestaña corta el disco, igual que en el hueso.
  const cor = Math.acos((yt * yt + radio * radio - rt * rt) / (2 * yt * radio));
  const ar = P / 2 - cor, al = P / 2 + cor;
  const qx = radio * Math.cos(ar), qy = radio * Math.sin(ar);
  const tr = Math.atan2(qy - yt, qx), tl = P - tr;

  const s = new THREE.Shape();
  s.absarc(0, 0,  radio, al, ar, false);   // el disco, por el camino largo
  s.absarc(0, yt, rt,    tr, tl, false);   // la pestaña, por encima

  return {
    shape: s,
    bbox: { x0: -radio, x1: radio, y0: -radio, y1: yt + rt },
    hoyo: [0, yt, 0.356 * rt],
    anillo: { radio: 0.7763 * radio, tubo: 0.0524 * radio },
    decal: {
      logo: { x: 0, y: 0, tam: 1.7348 * radio },
      qr: { x: 0, y: 0, d: 1.2797 * radio },
    },
  };
}

function redondeada(THREE, w, h, rad) {
  const s = new THREE.Shape();
  const x = w / 2, y = h / 2;
  s.moveTo(-x + rad, -y);
  s.lineTo(x - rad, -y);   s.quadraticCurveTo(x, -y, x, -y + rad);
  s.lineTo(x, y - rad);    s.quadraticCurveTo(x, y, x - rad, y);
  s.lineTo(-x + rad, y);   s.quadraticCurveTo(-x, y, -x, y - rad);
  s.lineTo(-x, -y + rad);  s.quadraticCurveTo(-x, -y, -x + rad, -y);
  return s;
}

/* ---------------------------------------------------------------------------
   CUADRADO y RECTÁNGULO — medidos de las fotos del producto (15/09/2026).

   Lo que quedó MEDIDO, y qué tan bien:
     contorno    cuadrado IoU 0.971-0.972 · rectángulo IoU 0.976-0.980
     esquinas    r/ancho = 0.1313 (cuadrado) · 0.1293 (rectángulo)
     proporción  cuadrado 1.003 (es cuadrado de verdad)
                 rectángulo 1.498 de alto/ancho (o sea 2:3)
     disco QR    diámetro/ancho = 0.5768 · 0.8454   (IoU 0.958 / 0.965)
     escudo      alto de la tinta / alto de la placa = 0.6091 · 0.5121

   Lo que NO se pudo medir de estas fotos, y no se va a fingir que sí:
     · El BARRENO. El alambre de la argolla lo tapa por completo en las cuatro
       vistas, y alrededor solo hay resina verde, así que no hay hueco que
       detectar. Los valores de abajo son los de antes.
     · La ARGOLLA. El ajuste del anillo se quedó en IoU 0.67-0.69 porque los
       brillos lo parten en pedazos y en la cuadrada hay además un anillito
       intermedio. Los números son del orden correcto —en las fotos la argolla
       es claramente más grande respecto a la placa que en el hueso y el
       círculo— pero son aproximados.

   El escudo y el QR salieron medidos ligeramente descentrados (hasta 0.08 del
   alto), pero cada placa con un corrimiento distinto. Eso es variación de
   pegado de un producto hecho a mano, no diseño, así que se dibujan centrados.

   LA ESCALA entre cuadrado y rectángulo sale de suponer que la calcomanía del
   QR es la misma en las dos fotos: sus radios midieron 102.66 y 99.49 px, 3.1%
   de diferencia. Con eso las dos fotos quedan a la misma escala, y resulta que
   las dos placas miden casi lo mismo de alto (357.9 vs 353.4 px, 1.3%) y el
   rectángulo es 0.666 de ancho respecto al lado del cuadrado. El tamaño
   absoluto sigue siendo libre: el visor reencuadra cada forma sola.
--------------------------------------------------------------------------- */
const LADO_CUADRADO = 1.34;

function formaCuadrada(THREE) {
  const L = LADO_CUADRADO;
  return {
    shape: redondeada(THREE, L, L, 0.1313 * L),
    bbox: { x0: -L / 2, x1: L / 2, y0: -L / 2, y1: L / 2 },
    hoyo: [0, 0.535, 0.055],                                  // no medido
    anillo: { radio: 0.4371 * L, tubo: 0.0369 * L },           // aproximado
    decal: {
      // 0.6091 de tinta, corregido por el margen del PNG (0.6248).
      logo: { x: 0, y: 0, tam: 0.9749 * L },
      qr: { x: 0, y: 0, d: 0.5768 * L, patron: 0.6441 },
    },
  };
}

function formaRect(THREE) {
  const w = 0.6663 * LADO_CUADRADO;
  const h = 0.9900 * LADO_CUADRADO;
  return {
    shape: redondeada(THREE, w, h, 0.1293 * w),
    bbox: { x0: -w / 2, x1: w / 2, y0: -h / 2, y1: h / 2 },
    hoyo: [0, h / 2 - 0.10 * h, 0.055],                        // no medido
    anillo: { radio: 0.5484 * w, tubo: 0.0382 * w },           // aproximado
    decal: {
      logo: { x: 0, y: 0, tam: 0.8196 * h },
      qr: { x: 0, y: 0, d: 0.8454 * w, patron: 0.5420 },
    },
  };
}

export function construirForma(THREE, id) {
  if (id === 'hueso') return formaHueso(THREE);
  // 0.7627 sale de suponer que las dos fotos del producto están a la misma
  // escala. Si se miden las placas con regla, este número y el ancho del hueso
  // son lo único que hay que corregir.
  if (id === 'circulo') return formaCirculo(THREE, 0.7627);
  if (id === 'rect') return formaRect(THREE);
  return formaCuadrada(THREE);
}

/* ---------------------------------------------------------------------------
   QR
   De verdad, no decorativo: versión 2, nivel de corrección Q, 25×25 módulos,
   codificando https://curpitas.com. La matriz va precalculada porque la
   dirección es fija, así no hace falta cargar ninguna librería de QR. Se puede
   escanear desde la pantalla.
--------------------------------------------------------------------------- */
export const QR_MATRIZ = [
  '0000000001001110000000000', '0111110010110010000111110', '0100010001100110000100010',
  '0101010011100101100101010', '0100010011101110000100010', '0111110001110110000111110',
  '0000000010101010100000000', '0000000011010101000000000', '0101111010110011011011010',
  '0010100111110111010111110', '1101011010010001101101001', '1011010110101010101001111',
  '1010001010000111101100001', '1101100011001011110010010', '1100011111011111101011111',
  '1011110001010100000101101', '1001011100110111111110110', '0000000011001001100010110',
  '0000000001010110101010001', '0111110011001001100010001', '0100010010001011111110011',
  '0101010011011001111000011', '0100010000100111100011111', '0111110010010010011110111',
  '0000000001011100111001001',
];

// `patron` es qué fracción del disco ocupa el cuadro de módulos. NO es igual en
// todas las placas: medido de las fotos salió 0.68 en el hueso, 0.644 en la
// cuadrada y 0.542 en la rectangular. Estaba fijo en 0.68 para todas, que era
// una regla que me inventé yo. Lo que sobra de disco alrededor hace de zona de
// silencio, que el QR necesita para poder leerse.
export function dibujarQR(g, cx, cy, d, patron = 0.68) {
  const N = QR_MATRIZ.length;
  g.save();
  g.beginPath();
  g.arc(cx, cy, d / 2, 0, Math.PI * 2);
  g.fillStyle = '#fbfbfb';
  g.fill();
  g.clip();

  const lado = d * patron, p = lado / N;
  const x0 = cx - lado / 2, y0 = cy - lado / 2;
  g.fillStyle = '#0b0b0b';
  for (let r = 0; r < N; r++) {
    const fila = QR_MATRIZ[r];
    for (let c = 0; c < N; c++) {
      if (fila.charCodeAt(c) === 49) {   // '1'
        // Se redondea a pixel entero y se cierra el borde, para que no queden
        // costuras claras entre módulos vecinos.
        const ax = Math.round(x0 + c * p), ay = Math.round(y0 + r * p);
        g.fillRect(ax, ay, Math.round(x0 + (c + 1) * p) - ax,
                           Math.round(y0 + (r + 1) * p) - ay);
      }
    }
  }
  g.restore();
}