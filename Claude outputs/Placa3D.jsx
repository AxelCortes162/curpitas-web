import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';
import { COLORES, construirForma, dibujarQR, formaPorId } from '../lib/placa';

// ---------------------------------------------------------------------------
// PLACA 3D — la vista previa del pedido.
//
// Muestra la placa que el cliente está armando: su forma, su color y su
// nombre, girable con el dedo. No es un adorno: es lo único que le dice qué
// va a recibir antes de pagar.
//
// Tres decisiones que importan:
//
// 1. three.js se carga con import dinámico. Son ~600 KB, y quien nunca abre
//    /pedir no tiene por qué descargarlos. La página funciona antes de que
//    llegue, y si no llega, funciona igual con las fotos.
//
// 2. Si no hay WebGL —celulares viejos, navegadores con el 3D apagado— NO se
//    muestra un hueco ni un error: se muestran las fotos reales del producto.
//    Nadie se queda sin poder comprar por no poder ver el 3D.
//
// 3. Cambiar de color no reconstruye nada: solo se le cambia el color al
//    material. Cambiar el nombre solo redibuja la cara de enfrente. Solo
//    cambiar de forma reconstruye la geometría. Si todo se reconstruyera a
//    cada tecla, escribir el nombre se sentiría pegajoso.
// ---------------------------------------------------------------------------

const FOTOS_RESPALDO = {
  hueso: '/placas/hueso-verde.webp',
  circulo: '/placas/circulo-menta.webp',
};

/* =========================================================================
   LA ESCENA
   Vive fuera del componente: recibe el canvas y THREE, y devuelve un puñado
   de funciones para manejarla. Así el componente de React no se mezcla con
   500 líneas de 3D.
   ========================================================================= */
function crearEscena(THREE, lienzo, inicial) {
  const estado = { ...inicial };

  const renderer = new THREE.WebGLRenderer({
    canvas: lienzo, antialias: true, alpha: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camara.position.set(0, 0, 6.2);

  escena.add(new THREE.AmbientLight(0xffffff, 0.35));
  const luz1 = new THREE.DirectionalLight(0xffffff, 1.5); luz1.position.set(3, 4, 5);
  const luz2 = new THREE.DirectionalLight(0xcfe6ff, 0.8); luz2.position.set(-4, -1, 3);
  const luz3 = new THREE.DirectionalLight(0xffffff, 0.6); luz3.position.set(0, -3, -4);
  escena.add(luz1, luz2, luz3);

  /* ---- glitter ----
     Un solo recorrido genera las dos texturas: la de rugosidad (destellos =
     espejo) y la de normales (facetas al azar). Que coincidan es lo que hace
     que los brillos se muevan como glitter de verdad al girar la placa. */
  const glitter = (() => {
    const N = 1024;
    const cRug = document.createElement('canvas'); cRug.width = cRug.height = N;
    const cNor = document.createElement('canvas'); cNor.width = cNor.height = N;
    const gr = cRug.getContext('2d'), gn = cNor.getContext('2d');

    gr.fillStyle = '#e8e8e8'; gr.fillRect(0, 0, N, N);           // base: mate
    gn.fillStyle = 'rgb(128,128,255)'; gn.fillRect(0, 0, N, N);  // base: plana

    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * N, y = Math.random() * N;
      const rad = 1.1 + Math.random() * 2.6;

      gr.fillStyle = `rgba(6,6,6,${0.55 + Math.random() * 0.45})`;
      gr.beginPath(); gr.arc(x, y, rad, 0, Math.PI * 2); gr.fill();

      const ang = Math.random() * Math.PI * 2, fuerza = 0.45 + Math.random() * 0.55;
      gn.fillStyle = 'rgb('
        + Math.round(128 + Math.cos(ang) * 110 * fuerza) + ','
        + Math.round(128 + Math.sin(ang) * 110 * fuerza) + ',235)';
      gn.beginPath(); gn.arc(x, y, rad, 0, Math.PI * 2); gn.fill();
    }

    const mk = (c) => {
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.6, 2.6);
      t.anisotropy = 4;
      return t;
    };
    return { rugosidad: mk(cRug), normales: mk(cNor) };
  })();

  /* ---- entorno ----
     Sin reflejos el barniz no se ve. Se arma un "estudio" equirectangular en
     un canvas: cielo claro, dos softboxes y piso oscuro. Si falla, la placa se
     ve más mate pero se ve: no vale tumbar la página por los reflejos. */
  let envMap = null;
  try {
    const W = 1024, H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.42, '#dfeeea');
    grad.addColorStop(0.55, '#9fb5b2');
    grad.addColorStop(1, '#2e3a3a');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);

    g.fillStyle = '#ffffff';
    [[0.16, 0.14, 0.20, 0.16], [0.62, 0.08, 0.26, 0.13], [0.40, 0.30, 0.12, 0.07]]
      .forEach(([x, y, w, h]) => {
        g.beginPath();
        g.ellipse(W * (x + w / 2), H * (y + h / 2), W * w / 2, H * h / 2, 0, 0, Math.PI * 2);
        g.fill();
      });

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    envMap = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose(); tex.dispose();
    escena.environment = envMap;
  } catch (e) {
    if (window.console) console.warn('Sin mapa de entorno:', e);
  }

  const pivote = new THREE.Group();
  escena.add(pivote);

  // El conjunto (placa + calcomanías + argolla) se recentra dentro del pivote
  // para que gire alrededor de su propio centro y no del centro de la placa
  // sola: la argolla sobresale y desbalancea.
  const conjunto = new THREE.Group();
  pivote.add(conjunto);

  const matResina = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(estado.hex),
    roughness: 0.62, metalness: 0.0,
    roughnessMap: glitter.rugosidad,
    normalMap: glitter.normales,
    normalScale: new THREE.Vector2(0.42, 0.42),
    clearcoat: 1.0, clearcoatRoughness: 0.055,
    transmission: 0.12, ior: 1.52, thickness: 0.5,
    envMapIntensity: 1.25,
  });

  const matMetal = new THREE.MeshStandardMaterial({
    color: 0xdfe4e6, metalness: 1.0, roughness: 0.18, envMapIntensity: 1.3,
  });

  /* ---- calcomanías ----
     El nombre y el escudo al frente, el QR atrás. Se dibujan en un canvas y se
     aplican como textura transparente sobre la cara. Las posiciones vienen
     medidas en unidades de la forma, no en porcentajes del canvas, así caen en
     el mismo lugar aunque la placa cambie de proporción. */
  function logoNegro(g, cx, cy, tam) {
    if (!estado.logo) return;
    const off = document.createElement('canvas');
    off.width = off.height = Math.max(8, Math.round(tam));
    const og = off.getContext('2d');
    og.drawImage(estado.logo, 0, 0, off.width, off.height);
    og.globalCompositeOperation = 'source-in';
    og.fillStyle = '#0b0b0b';
    og.fillRect(0, 0, off.width, off.height);
    g.drawImage(off, cx - tam / 2, cy - tam / 2, tam, tam);
  }

  function texturaCara(atras, info) {
    const bb = info.bbox;
    const anchoBB = bb.x1 - bb.x0, altoBB = bb.y1 - bb.y0;
    const PX = 1024;
    const c = document.createElement('canvas');
    c.width = PX;
    c.height = Math.max(2, Math.round(PX * altoBB / anchoBB));
    const g = c.getContext('2d');
    const W = c.width, H = c.height;

    const aX = (sx) => (sx - bb.x0) / anchoBB * W;   // forma → canvas
    const aY = (sy) => (bb.y1 - sy) / altoBB * H;
    const aL = (L) => L / anchoBB * W;               // longitudes
    const d = info.decal;

    if (atras) {
      if (d.qr) dibujarQR(g, aX(d.qr.x), aY(d.qr.y), aL(d.qr.d), d.qr.patron);
    } else {
      if (d.nombre) {
        const txt = (estado.nombre || '').trim();
        if (txt) {
          g.fillStyle = '#0b0b0b';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          const fuente = (p) => `800 ${p}px "Baloo 2", "Plus Jakarta Sans", system-ui, sans-serif`;
          let px = Math.round(aL(d.nombre.em));
          g.font = fuente(px);
          const maxW = aL(d.nombre.maxW);
          // El nombre se encoge hasta caber. Un nombre largo que se sale de la
          // placa se vería como un error del producto, no del cliente.
          while (g.measureText(txt).width > maxW && px > 24) {
            px -= 2;
            g.font = fuente(px);
          }
          g.fillText(txt, aX(d.nombre.x), aY(d.nombre.y));
        }
      }
      if (d.logo) logoNegro(g, aX(d.logo.x), aY(d.logo.y), aL(d.logo.tam));
    }

    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  let cuerpo = null, caraF = null, caraB = null, anillo = null, infoActual = null;

  function limpiarPiezas() {
    [cuerpo, caraF, caraB, anillo].forEach((m) => {
      if (!m) return;
      conjunto.remove(m);
      m.geometry.dispose();
    });
    // matResina y matMetal se reutilizan entre formas; solo se desechan los
    // materiales de las calcomanías, que sí son nuevos cada vez. (Desechar el
    // material compartido por error dejaba la placa negra al cambiar de forma.)
    [caraF, caraB].forEach((m) => {
      if (!m) return;
      if (m.material.map) m.material.map.dispose();
      m.material.dispose();
    });
    cuerpo = caraF = caraB = anillo = null;
  }

  function reconstruir() {
    limpiarPiezas();

    const info = construirForma(THREE, estado.forma);
    infoActual = info;
    const [hx, hy, hr] = info.hoyo;

    const hoyo = new THREE.Path();
    hoyo.absarc(hx, hy, hr, 0, Math.PI * 2, true);
    info.shape.holes.push(hoyo);

    const geo = new THREE.ExtrudeGeometry(info.shape, {
      depth: 0.19, bevelEnabled: true,
      bevelThickness: 0.055, bevelSize: 0.05, bevelOffset: 0, bevelSegments: 5,
      curveSegments: 48,
    });
    // Se centra solo en x y z: en y conviene conservar el origen de la forma,
    // porque el barreno está definido en esas coordenadas.
    geo.computeBoundingBox();
    const bb0 = geo.boundingBox;
    geo.translate(-(bb0.max.x + bb0.min.x) / 2, 0, -(bb0.max.z + bb0.min.z) / 2);

    cuerpo = new THREE.Mesh(geo, matResina);
    conjunto.add(cuerpo);

    const bb = info.bbox;
    const anchoBB = bb.x1 - bb.x0, altoBB = bb.y1 - bb.y0;
    const medioY = (bb.y0 + bb.y1) / 2;   // el hueso no es simétrico: la pestaña sube
    const z = (bb0.max.z - bb0.min.z) / 2 + 0.004;

    const plano = (atras) => new THREE.Mesh(
      new THREE.PlaneGeometry(anchoBB, altoBB),
      new THREE.MeshBasicMaterial({
        map: texturaCara(atras, info), transparent: true, depthWrite: false, toneMapped: false,
      }),
    );

    caraF = plano(false);
    caraF.position.set(0, medioY, z);
    caraB = plano(true);
    caraB.position.set(0, medioY, -z);
    caraB.rotation.y = Math.PI;
    conjunto.add(caraF, caraB);

    // Argolla: pasa por el barreno y su cara interior descansa sobre el canto
    // de arriba del hoyo, como cuelga de verdad.
    if (info.anillo) {
      const ar = info.anillo;
      anillo = new THREE.Mesh(
        new THREE.TorusGeometry(ar.radio, ar.tubo, 20, 96), matMetal);
      anillo.position.set(hx, hy + hr + (ar.radio - ar.tubo), 0);
      conjunto.add(anillo);
    }

    // Encuadre: se mide todo el conjunto y se recentra, para que la argolla no
    // empuje la placa hacia abajo del visor.
    conjunto.position.set(0, 0, 0);
    conjunto.scale.setScalar(1);
    const caja = new THREE.Box3().setFromObject(conjunto);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    conjunto.position.set(-centro.x, -centro.y, -centro.z);
    pivote.scale.setScalar(2.45 / Math.max(tam.x, tam.y));
  }

  // Solo la cara de enfrente: es lo único que depende del nombre.
  function repintarFrente() {
    if (!caraF || !infoActual) return;
    const vieja = caraF.material.map;
    caraF.material.map = texturaCara(false, infoActual);
    caraF.material.needsUpdate = true;
    if (vieja) vieja.dispose();
  }

  /* ---- giro ---- */
  let rotX = -0.12, rotY = -0.45, objX = rotX, objY = rotY;
  let arrastrando = false, ultX = 0, ultY = 0, ultMov = Date.now();

  const alBajar = (e) => {
    arrastrando = true;
    ultX = e.clientX; ultY = e.clientY;
    try { lienzo.setPointerCapture(e.pointerId); } catch { /* da igual */ }
  };
  const alMover = (e) => {
    if (!arrastrando) return;
    objY += (e.clientX - ultX) * 0.009;
    objX += (e.clientY - ultY) * 0.007;
    objX = Math.max(-1.15, Math.min(1.15, objX));
    ultX = e.clientX; ultY = e.clientY; ultMov = Date.now();
  };
  const alSoltar = () => { arrastrando = false; };

  lienzo.addEventListener('pointerdown', alBajar);
  lienzo.addEventListener('pointermove', alMover);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    lienzo.addEventListener(ev, alSoltar));

  function medir() {
    const r = lienzo.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
    camara.aspect = r.width / Math.max(1, r.height);
    camara.updateProjectionMatrix();
  }

  // Quien pidió menos movimiento no recibe el giro automático; la placa sigue
  // girando cuando la arrastra.
  const quietud = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let anim = 0;
  let visible = true;
  function bucle() {
    anim = requestAnimationFrame(bucle);
    // Fuera de pantalla no se dibuja: no tiene sentido gastarle la batería a
    // alguien por una placa que no está viendo.
    if (!visible) return;
    if (!quietud && !arrastrando && Date.now() - ultMov > 2600) objY += 0.0022;
    rotX += (objX - rotX) * 0.1;
    rotY += (objY - rotY) * 0.1;
    pivote.rotation.x = rotX;
    pivote.rotation.y = rotY;
    renderer.render(escena, camara);
  }

  reconstruir();
  medir();
  bucle();

  return {
    medir,
    setVisible(v) { visible = v; if (v) ultMov = Date.now(); },
    setForma(id) {
      if (id === estado.forma) return;
      estado.forma = id;
      reconstruir();
      ultMov = Date.now();
    },
    setColor(hex) {
      if (hex === estado.hex) return;
      estado.hex = hex;
      matResina.color.set(hex);
    },
    setNombre(txt) {
      if (txt === estado.nombre) return;
      estado.nombre = txt;
      repintarFrente();
    },
    setLogo(img) {
      estado.logo = img;
      repintarFrente();
    },
    voltear() { objY += Math.PI; ultMov = Date.now(); },
    destruir() {
      cancelAnimationFrame(anim);
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
        lienzo.removeEventListener(ev, alSoltar));
      limpiarPiezas();
      matResina.dispose();
      matMetal.dispose();
      glitter.rugosidad.dispose();
      glitter.normales.dispose();
      if (envMap) envMap.dispose();
      renderer.dispose();
    },
  };
}

/* =========================================================================
   EL COMPONENTE
   ========================================================================= */
// `alto` va como número de píxeles y no como clase de Tailwind porque el
// canvas necesita una altura resuelta para medirse: con `h-full` dentro de un
// contenedor de altura automática se queda en cero y no se dibuja nada.
export const Placa3D = ({ forma, color, nombre, className = '', alto = 300 }) => {
  const lienzoRef = useRef(null);
  const cajaRef = useRef(null);
  const apiRef = useRef(null);
  const [fase, setFase] = useState('cargando');   // cargando | listo | sinSoporte

  // Arranque: una sola vez. El efecto se vuelve a ejecutar en desarrollo por
  // el modo estricto de React, así que la bandera 'cancelado' y el destruir()
  // del cleanup tienen que dejar todo como estaba.
  useEffect(() => {
    let cancelado = false;
    let api = null;

    (async () => {
      try {
        const THREE = await import('three');
        if (cancelado || !lienzoRef.current) return;

        // La fuente del nombre tiene que estar lista ANTES de dibujar la cara:
        // si no, el nombre se dibuja con la tipografía de reserva y se queda
        // así hasta el siguiente cambio.
        try {
          if (document.fonts?.load) {
            await document.fonts.load('800 64px "Baloo 2"');
          }
          await document.fonts?.ready;
        } catch { /* sin webfont se usa la de reserva; no es motivo de fallo */ }
        if (cancelado || !lienzoRef.current) return;

        api = crearEscena(THREE, lienzoRef.current, {
          forma, hex: (COLORES.find((c) => c.id === color) ?? COLORES[0]).hex,
          nombre: nombre ?? '', logo: null,
        });
        apiRef.current = api;
        setFase('listo');

        // El escudo llega cuando llega. Si el PNG no carga, la placa se ve sin
        // él en vez de quedarse esperando.
        const img = new Image();
        img.onload = () => { if (!cancelado) apiRef.current?.setLogo(img); };
        img.src = '/logo.png';
      } catch (e) {
        if (window.console) console.warn('El 3D no pudo arrancar:', e);
        if (!cancelado) setFase('sinSoporte');
      }
    })();

    return () => {
      cancelado = true;
      apiRef.current?.destruir();
      apiRef.current = null;
      api = null;
    };
    // Las props se aplican en los efectos de abajo, no reinician la escena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { apiRef.current?.setForma(forma); }, [forma]);
  useEffect(() => {
    apiRef.current?.setColor((COLORES.find((c) => c.id === color) ?? COLORES[0]).hex);
  }, [color]);
  useEffect(() => { apiRef.current?.setNombre(nombre ?? ''); }, [nombre]);

  // El visor cambia de tamaño al rotar el teléfono o al abrirse el teclado.
  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => apiRef.current?.medir());
    ro.observe(caja);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([e]) => apiRef.current?.setVisible(e.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(caja);
    return () => io.disconnect();
  }, []);

  const formaInfo = formaPorId(forma);

  // Sin 3D: las fotos reales. Vale más una foto del producto que un hueco.
  if (fase === 'sinSoporte') {
    const foto = FOTOS_RESPALDO[forma];
    return (
      <div className={className}>
        <div className="grid place-items-center" style={{ height: alto }}>
          {foto ? (
            <img
              src={foto}
              alt={`Placa de ${formaInfo.nombre.toLowerCase()}`}
              className="max-h-full max-w-full object-contain"
              style={{ filter: 'drop-shadow(0 14px 18px rgba(16,41,42,.20))' }}
            />
          ) : (
            <svg viewBox="0 0 24 24" className="w-28 h-28 text-emerald-200" fill="currentColor">
              <path d={formaInfo.icono} />
            </svg>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Tu navegador no puede mostrar el modelo en 3D. Esta es una foto del producto.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={cajaRef} className="relative w-full" style={{ height: alto }}>
        <canvas
          ref={lienzoRef}
          className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Modelo en 3D de una placa de ${formaInfo.nombre.toLowerCase()}`
            + ` color ${(COLORES.find((c) => c.id === color) ?? COLORES[0]).nombre.toLowerCase()}`
            + (nombre ? ` con el nombre ${nombre}` : '')}
          role="img"
        />

        {fase === 'cargando' && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <Loader2 className="w-6 h-6 mx-auto text-[#1C5253] animate-spin" />
              <p className="text-xs text-gray-400 mt-2">Preparando la resina…</p>
            </div>
          </div>
        )}

        {fase === 'listo' && (
          <button
            type="button"
            onClick={() => apiRef.current?.voltear()}
            className="absolute bottom-2 right-2 rounded-full bg-white/90 border border-emerald-100 shadow-sm px-3 py-1.5 text-xs font-bold text-[#1C5253] flex items-center gap-1.5 hover:bg-white"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Voltear
          </button>
        )}
      </div>

      {/* Esto no es letra chica escondida: la placa real es de resina hecha a
          mano, y el modelo no reproduce el brillo ni las burbujas ni el tono
          exacto. Decirlo de frente evita un reclamo después. */}
      <p className="text-xs text-gray-400 text-center mt-2 px-2">
        Es un modelo de referencia, no una foto. Arrástralo para girarlo.
        {formaInfo.medida === 'contorno' && ' En esta forma la argolla es aproximada.'}
        {' '}Cada placa se hace a mano, así que el tono y el glitter varían un poco.
      </p>
    </div>
  );
};

export default Placa3D;
