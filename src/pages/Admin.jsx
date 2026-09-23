import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { PawPrint, Plus, Download, ShieldCheck, ShieldOff, Star, Check, X, Tag, Circle, FileSpreadsheet, Ban, RotateCcw, Search, Heart, HeartOff, Calculator, ChevronRight, Factory, ClipboardList, Users, Gift, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Genera un folio nuevo con formato CURPITA + 8 dígitos aleatorios
const generarFolio = () => {
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `CURPITA${numero}`;
};

const REGISTROS_POR_PAGINA = 20;

const FilaTestimonioPendiente = ({ testimonio, onResuelto }) => {
  const [procesando, setProcesando] = useState(false);

  const aprobar = async () => {
    setProcesando(true);
    await supabase.from('testimonials').update({ approved: true }).eq('id', testimonio.id);
    setProcesando(false);
    onResuelto();
  };

  const rechazar = async () => {
    setProcesando(true);
    await supabase.from('testimonials').delete().eq('id', testimonio.id);
    setProcesando(false);
    onResuelto();
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
      <div className="flex gap-0.5 mb-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i <= testimonio.rating ? 'fill-[#88D49E] text-[#88D49E]' : 'fill-gray-200 text-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-700 italic">"{testimonio.text}"</p>
      <p className="text-xs font-bold text-[#1C5253] mt-1.5">
        {testimonio.name}
        {testimonio.city && <span className="font-medium text-gray-400"> · {testimonio.city}</span>}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={aprobar}
          disabled={procesando}
          className="flex-1 py-2 text-xs font-bold text-white bg-[#1C5253] hover:bg-[#164343] rounded-lg flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" /> Aprobar
        </button>
        <button
          onClick={rechazar}
          disabled={procesando}
          className="flex-1 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1 disabled:opacity-60"
        >
          <X className="w-3.5 h-3.5" /> Rechazar
        </button>
      </div>
    </div>
  );
};

// Dibuja un rectángulo con esquinas redondeadas en un canvas 2D
const trazarRectRedondeado = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Dibuja el QR real dentro de un círculo con anillo punteado decorativo
// ("ventana troquelada"), sin recortar el QR — un QR necesita sus esquinas
// completas para poder escanearse.
const dibujarQRConAnillo = (ctx, qrCanvas, centerX, centerY, outerR, innerR, qrSize, colores) => {
  ctx.fillStyle = 'rgba(232, 243, 241, 0.6)';
  for (let angulo = 0; angulo < 360; angulo += 12) {
    const rad = (angulo * Math.PI) / 180;
    const px = centerX + outerR * Math.cos(rad);
    const py = centerY + outerR * Math.sin(rad);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colores.white;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(qrCanvas, centerX - qrSize / 2, centerY - qrSize / 2, qrSize, qrSize);
};

// Dibuja la cajita blanca con el folio
const dibujarFolio = (ctx, x, y, w, folio, colores, alto = 90) => {
  ctx.fillStyle = colores.white;
  trazarRectRedondeado(ctx, x, y, w, alto, 12);
  ctx.fill();
  ctx.fillStyle = '#999999';
  ctx.font = `bold ${Math.max(11, Math.round(alto * 0.16))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('FOLIO', x + w / 2, y + alto * 0.38);
  ctx.fillStyle = colores.teal;
  ctx.font = `bold ${Math.max(14, Math.round(alto * 0.28))}px monospace`;
  ctx.fillText(folio, x + w / 2, y + alto * 0.78);
};

const FilaMascota = ({ pet, onUpdated }) => {
  const canvasRef = useRef(null);
  const qrGrandeRef = useRef(null);
  const qrNegroRef = useRef(null);
  const url = `${window.location.origin}/mascota/${pet.curpita}`;

  const colores = {
    teal: '#1C5253',
    mint: '#88D49E',
    cream: '#E8F3F1',
    white: '#ffffff',
  };

  // Convierte milímetros a píxeles a 300dpi (estándar de impresión)
  const mmAPx = (mm) => Math.round((mm / 25.4) * 300);

  // Tamaño del blíster en vertical
  const BLISTER = { w: mmAPx(80), h: mmAPx(110) }; // 945 x 1300 px

  const descargarQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${pet.curpita}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Descarga el QR listo para cortar en vinil: negro sólido, sin el
  // anillo punteado (imposible de cortar y despegar a este tamaño), sobre
  // fondo transparente — así el archivo sirve tanto para "print then cut"
  // como para corte directo de vinil negro.
  const descargarQRCircular = () => {
    const qrNegro = qrNegroRef.current?.querySelector('canvas');
    if (!qrNegro) return;

    const size = 600;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // fondo transparente (no llenamos nada) — el color real lo pone el
    // material de tu placa, no el archivo

    const centro = size / 2;
    const radioCirculo = centro * 0.98;

    // Fondo menta (el tono medio de la paleta)
    ctx.fillStyle = colores.mint;
    ctx.beginPath();
    ctx.arc(centro, centro, radioCirculo, 0, Math.PI * 2);
    ctx.fill();

    // Círculo blanco interior (zona de silencio del QR)
    const radioBlanco = radioCirculo * 0.86;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centro, centro, radioBlanco, 0, Math.PI * 2);
    ctx.fill();

    // QR negro, tamaño calculado para que quepa completo sin recortar
    // ninguna esquina (necesarias para que el código sea legible)
    const qrSize = radioBlanco * 1.2;
    ctx.drawImage(qrNegro, centro - qrSize / 2, centro - qrSize / 2, qrSize, qrSize);

    const link = document.createElement('a');
    link.download = `${pet.curpita}-qr-vinil.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const crearCanvas = (w, h, bgColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
    return { canvas, ctx };
  };

  const descargarCanvas = (canvas, sufijo) => {
    const link = document.createElement('a');
    link.download = `${pet.curpita}-${sufijo}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ============================================
  // Diseño del frente del blíster. El espacio superior queda libre para
  // hacer la perforación sin tocar el título, el QR ni el folio.
  // ============================================
  const generarFrente = (w, h, sufijo, espacioSuperior = 0) => {
    const qrCanvas = qrGrandeRef.current?.querySelector('canvas');
    if (!qrCanvas) return;
    const { teal, mint, white } = colores;
    const { canvas, ctx } = crearCanvas(w, h, teal);

    const pad = w * 0.08;
    const base = Math.min(w, h);
    let cursorY = espacioSuperior + h * 0.035;

    ctx.fillStyle = white;
    ctx.textAlign = 'left';
    const tituloSize = base * 0.11;
    ctx.font = `bold ${Math.round(tituloSize)}px sans-serif`;
    cursorY += tituloSize * 0.8;
    ctx.fillText('CURPitas', pad, cursorY);
    cursorY += tituloSize * 0.55;

    ctx.fillStyle = mint;
    const subtituloSize = base * 0.036;
    ctx.font = `bold ${Math.round(subtituloSize)}px sans-serif`;
    cursorY += subtituloSize * 1.15;
    ctx.fillText('CREDENCIAL DE MASCOTAS', pad, cursorY);
    cursorY += subtituloSize * 0.6;

    // Centrado del bloque QR en el espacio restante entre el texto y el folio
    const qrR = base * 0.22;
    const folioAlto = base * 0.11;
    const espacioInferior = folioAlto + base * 0.16; // folio + margen + dominio
    const espacioDisponibleTop = cursorY + base * 0.03;
    const centroQRY = espacioDisponibleTop + (h - espacioInferior - espacioDisponibleTop) / 2;

    dibujarQRConAnillo(ctx, qrCanvas, w / 2, centroQRY, qrR * 1.3, qrR, qrR * 1.3, colores);

    const folioW = w - pad * 2;
    const folioY = h - espacioInferior;
    dibujarFolio(ctx, pad, folioY, folioW, pet.curpita, colores, folioAlto);

    ctx.fillStyle = mint;
    const dominioSize = base * 0.04;
    ctx.font = `${Math.round(dominioSize)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('curpitas.com', w / 2, h - base * 0.045);

    descargarCanvas(canvas, `${sufijo}-frente`);
  };

  const generarReverso = (w, h, sufijo, espacioSuperior = 0) => {
    const { teal, cream } = colores;
    const { canvas, ctx } = crearCanvas(w, h, cream);
    const pad = w * 0.08;
    const base = Math.min(w, h);
    let cursorY = espacioSuperior + h * 0.035;

    ctx.fillStyle = teal;
    ctx.textAlign = 'left';
    const tituloSize = base * 0.06;
    ctx.font = `bold ${Math.round(tituloSize)}px sans-serif`;
    cursorY += tituloSize * 0.8;
    ctx.fillText('Actívala en', pad, cursorY);
    cursorY += tituloSize * 1.15;
    ctx.fillText('3 pasos', pad, cursorY);
    cursorY += tituloSize * 1.6;

    const pasos = [
      'Crea tu cuenta en curpitas.com',
      'Escribe el folio de esta placa',
      'Completa el perfil de tu mascota',
    ];
    const r = base * 0.06;
    const numSize = base * 0.048;
    const textoSize = base * 0.04;

    pasos.forEach((paso, i) => {
      const circuloY = cursorY + r;

      ctx.fillStyle = teal;
      ctx.beginPath();
      ctx.arc(pad + r, circuloY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cream;
      ctx.font = `bold ${Math.round(numSize)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), pad + r, circuloY + numSize * 0.35);

      ctx.fillStyle = teal;
      ctx.font = `${Math.round(textoSize)}px sans-serif`;
      ctx.textAlign = 'left';

      const maxWidth = w - pad - (r * 2 + 16) - pad;
      const palabras = paso.split(' ');
      const lineas = [];
      let actual = '';
      palabras.forEach((palabra) => {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (ctx.measureText(prueba).width > maxWidth && actual) {
          lineas.push(actual);
          actual = palabra;
        } else {
          actual = prueba;
        }
      });
      lineas.push(actual);

      const lineHeight = textoSize * 1.25;
      const alturaBloque = lineHeight * lineas.length;
      const textoStartY = circuloY - alturaBloque / 2 + textoSize * 0.85;
      lineas.forEach((linea, li) => {
        ctx.fillText(linea, pad + r * 2 + 16, textoStartY + li * lineHeight);
      });

      cursorY = circuloY + r + Math.max(r, alturaBloque / 2) + base * 0.05;
    });

    ctx.fillStyle = teal;
    const dominioSize = base * 0.04;
    ctx.font = `${Math.round(dominioSize)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('curpitas.com', w / 2, h - base * 0.045);

    descargarCanvas(canvas, `${sufijo}-reverso`);
  };

  const handleBlister = () => {
    const espacioPerforacion = mmAPx(10);

    generarFrente(BLISTER.w, BLISTER.h, 'blister', espacioPerforacion);
    setTimeout(
      () => generarReverso(BLISTER.w, BLISTER.h, 'blister', espacioPerforacion),
      250
    );
  };

  const [confirmandoInvalidar, setConfirmandoInvalidar] = useState(false);
  const [procesandoInvalidar, setProcesandoInvalidar] = useState(false);

  const invalidarFolio = async () => {
    setProcesandoInvalidar(true);
    await supabase.from('pets').update({ invalidated: true }).eq('id', pet.id);
    setProcesandoInvalidar(false);
    setConfirmandoInvalidar(false);
    onUpdated?.();
  };

  const reactivarFolio = async () => {
    setProcesandoInvalidar(true);
    await supabase.from('pets').update({ invalidated: false }).eq('id', pet.id);
    setProcesandoInvalidar(false);
    onUpdated?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {/* QR más grande, oculto, solo para generar el blíster */}
      <div ref={qrGrandeRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={url} size={500} bgColor="#ffffff" fgColor="#1C5253" />
      </div>
      {/* QR negro oculto, para cortar en vinil */}
      <div ref={qrNegroRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={url} size={500} bgColor="#ffffff" fgColor="#000000" />
      </div>

      {/* Fila 1 (siempre): miniatura del QR + info */}
      <div className="flex items-center gap-3">
        <div ref={canvasRef} className="shrink-0">
          <QRCodeCanvas value={url} size={48} bgColor="#ffffff" fgColor="#1C5253" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold text-[#1C5253]">{pet.curpita}</p>
          <p className="text-xs text-gray-500 truncate">{pet.name || '— sin nombre aún —'}</p>
          {pet.invalidated ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1">
              <Ban className="w-3 h-3" /> Invalidada
            </span>
          ) : pet.owner_id ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1C5253] mt-1">
              <ShieldCheck className="w-3 h-3 text-[#88D49E]" /> Vinculada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1">
              <ShieldOff className="w-3 h-3" /> Sin reclamar
            </span>
          )}
        </div>
      </div>

      {/* Fila 2 en móvil / resto de la fila en pantallas grandes: botones */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:ml-auto">
        {confirmandoInvalidar ? (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2 py-1.5 shrink-0">
            <span className="text-[10px] text-red-700 font-semibold">¿Seguro?</span>
            <button
              onClick={invalidarFolio}
              disabled={procesandoInvalidar}
              className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-2 py-1"
            >
              Sí
            </button>
            <button
              onClick={() => setConfirmandoInvalidar(false)}
              className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1"
            >
              No
            </button>
          </div>
        ) : pet.invalidated ? (
          <button
            onClick={reactivarFolio}
            disabled={procesandoInvalidar}
            className="p-2.5 bg-[#F4F9F8] hover:bg-emerald-100 rounded-xl text-[#1C5253] shrink-0"
            title="Reactivar folio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setConfirmandoInvalidar(true)}
            className="p-2.5 bg-white border border-red-200 hover:bg-red-50 rounded-xl text-red-500 shrink-0"
            title="Invalidar folio (por mal uso)"
          >
            <Ban className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleBlister}
          className="p-2.5 bg-[#88D49E] hover:bg-[#78c98e] rounded-xl text-[#1C5253] shrink-0"
          title="Generar blíster (8x11 cm vertical, frente + reverso)"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={descargarQRCircular}
          className="p-2.5 bg-[#88D49E] hover:bg-[#78c98e] rounded-xl text-[#1C5253] shrink-0"
          title="Descargar QR negro para cortar en vinil (placas circulares)"
        >
          <Circle className="w-4 h-4" />
        </button>
        <button
          onClick={descargarQR}
          className="p-2.5 bg-[#F4F9F8] hover:bg-emerald-100 rounded-xl text-[#1C5253] shrink-0"
          title="Descargar solo el QR"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Admin = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [pendientes, setPendientes] = useState([]);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [busquedaMascota, setBusquedaMascota] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [totalesEstado, setTotalesEstado] = useState({
    todas: 0,
    vinculadas: 0,
    sinReclamar: 0,
    invalidadas: 0,
  });

  const [busquedaEmail, setBusquedaEmail] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    const desde = (paginaActual - 1) * REGISTROS_POR_PAGINA;
    const hasta = desde + REGISTROS_POR_PAGINA - 1;

    let consulta = supabase
      .from('pets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(desde, hasta);

    if (filtroEstado === 'vinculadas') {
      consulta = consulta.not('owner_id', 'is', null).eq('invalidated', false);
    } else if (filtroEstado === 'sinReclamar') {
      consulta = consulta.is('owner_id', null).eq('invalidated', false);
    } else if (filtroEstado === 'invalidadas') {
      consulta = consulta.eq('invalidated', true);
    }

    if (busquedaAplicada) {
      // Evita que los caracteres reservados rompan el filtro OR de PostgREST.
      const textoSeguro = busquedaAplicada.replace(/[,%()]/g, ' ').trim();
      if (textoSeguro) {
        consulta = consulta.or(`curpita.ilike.%${textoSeguro}%,name.ilike.%${textoSeguro}%`);
      }
    }

    const { data, error, count } = await consulta;

    if (!error) {
      setPets(data || []);
      setTotalResultados(count || 0);
    } else {
      setPets([]);
      setTotalResultados(0);
      setMensaje('Error al cargar las CURPitas: ' + error.message);
    }
    setLoading(false);
  }, [paginaActual, filtroEstado, busquedaAplicada]);

  const cargarTotales = useCallback(async () => {
    const [todas, vinculadas, sinReclamar, invalidadas] = await Promise.all([
      supabase.from('pets').select('id', { count: 'exact', head: true }),
      supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .not('owner_id', 'is', null)
        .eq('invalidated', false),
      supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .is('owner_id', null)
        .eq('invalidated', false),
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('invalidated', true),
    ]);

    setTotalesEstado({
      todas: todas.count || 0,
      vinculadas: vinculadas.count || 0,
      sinReclamar: sinReclamar.count || 0,
      invalidadas: invalidadas.count || 0,
    });
  }, []);

  const cargarPendientes = useCallback(async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: true });
    setPendientes(data || []);
  }, []);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  useEffect(() => {
    cargarTotales();
    cargarPendientes();
  }, [cargarTotales, cargarPendientes]);

  const refrescarPanel = useCallback(async () => {
    await Promise.all([cargarMascotas(), cargarTotales()]);
  }, [cargarMascotas, cargarTotales]);

  const buscarPorEmail = async () => {
    if (!busquedaEmail.trim()) return;
    setBuscando(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_rescuer')
      .ilike('email', `%${busquedaEmail.trim()}%`)
      .limit(10);
    setResultadosBusqueda(data || []);
    setBuscando(false);
  };

  const toggleRescatista = async (perfil) => {
    await supabase.from('profiles').update({ is_rescuer: !perfil.is_rescuer }).eq('id', perfil.id);
    setResultadosBusqueda((prev) =>
      prev.map((p) => (p.id === perfil.id ? { ...p, is_rescuer: !p.is_rescuer } : p))
    );
  };

  const handleCrearFolio = async () => {
    setCreando(true);
    setMensaje('');

    const folio = generarFolio();
    const { error } = await supabase.from('pets').insert({
      curpita: folio,
      owner_id: null,
    });

    setCreando(false);

    if (error) {
      setMensaje('Error: ' + error.message);
      return;
    }

    setMensaje(`Folio ${folio} creado ✓`);
    await refrescarPanel();
  };

  // Arma un CSV (se abre directo en Excel) con folio, URL completa,
  // nombre y estado de cada placa.
  const exportarCSV = async () => {
    setExportando(true);
    setMensaje('');

    const todosLosRegistros = [];
    const tamanoLote = 1000;
    let desde = 0;

    while (true) {
      const { data, error } = await supabase
        .from('pets')
        .select('curpita, name, owner_id, invalidated, created_at')
        .order('created_at', { ascending: false })
        .range(desde, desde + tamanoLote - 1);

      if (error) {
        setMensaje('Error al exportar: ' + error.message);
        setExportando(false);
        return;
      }

      const lote = data || [];
      todosLosRegistros.push(...lote);

      if (lote.length < tamanoLote) break;
      desde += tamanoLote;
    }

    const encabezados = ['Folio', 'URL', 'Nombre', 'Estado', 'Fecha de creación'];

    // Escapa comillas y comas para que Excel no rompa las columnas
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

    const filas = todosLosRegistros.map((pet) => [
      pet.curpita,
      `${window.location.origin}/mascota/${pet.curpita}`,
      pet.name || '',
      pet.invalidated ? 'Invalidada' : pet.owner_id ? 'Vinculada' : 'Sin reclamar',
      new Date(pet.created_at).toLocaleDateString('es-MX'),
    ]);

    const csv = [encabezados, ...filas].map((fila) => fila.map(escapar).join(',')).join('\n');

    // El BOM (\ufeff) evita que Excel muestre acentos/ñ como símbolos raros
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const urlArchivo = URL.createObjectURL(blob);
    link.href = urlArchivo;
    link.download = `curpitas-folios-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(urlArchivo), 0);
    setExportando(false);
  };

  const aplicarBusquedaMascotas = () => {
    setPaginaActual(1);
    setBusquedaAplicada(busquedaMascota.trim());
  };

  const limpiarBusquedaMascotas = () => {
    setBusquedaMascota('');
    setBusquedaAplicada('');
    setPaginaActual(1);
  };

  const cambiarFiltroEstado = (nuevoFiltro) => {
    setFiltroEstado(nuevoFiltro);
    setPaginaActual(1);
  };

  const totalPaginas = Math.max(1, Math.ceil(totalResultados / REGISTROS_POR_PAGINA));
  const primerRegistro = totalResultados === 0
    ? 0
    : (paginaActual - 1) * REGISTROS_POR_PAGINA + 1;
  const ultimoRegistro = Math.min(paginaActual * REGISTROS_POR_PAGINA, totalResultados);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="CURPitas" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-[#1C5253]">Panel de administrador</h1>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {totalesEstado.todas} folios totales · {totalesEstado.sinReclamar} sin reclamar
        </p>

        <Link
          to="/admin/calculadora"
          className="flex items-center justify-between gap-2 mb-2 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Calculator className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Números de CURPitas
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Costos, precios y reparto — los mismos para los cuatro
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <Link
          to="/admin/produccion"
          className="flex items-center justify-between gap-2 mb-2 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Factory className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Producción
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Pedidos pagados, en qué van, e inventario suelto
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <Link
          to="/admin/pedido-manual"
          className="flex items-center justify-between gap-2 mb-2 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <ClipboardList className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Pedido manual
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Registrar una venta cerrada por WhatsApp o en persona
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <Link
          to="/admin/vendedores"
          className="flex items-center justify-between gap-2 mb-5 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Users className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Vendedores
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Códigos, comisiones y a quién ya se le pagó
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <Link
          to="/admin/prospectos"
          className="flex items-center justify-between gap-2 mb-5 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Store className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Prospectos
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Veterinarias y tiendas visitadas, negadas o afiliadas
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <Link
          to="/admin/referidos"
          className="flex items-center justify-between gap-2 mb-5 px-4 py-3 bg-white rounded-2xl border border-emerald-100 hover:border-[#1C5253] group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Gift className="w-4 h-4 text-[#1C5253] shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#1C5253] leading-tight">
                Referidos
              </span>
              <span className="block text-[11px] text-gray-400 leading-tight">
                Canjes de puntos que piden los tutores
              </span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1C5253] shrink-0" />
        </Link>

        <button
          onClick={handleCrearFolio}
          disabled={creando}
          className="w-full py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-60 mb-2"
        >
          <Plus className="w-4 h-4" />
          {creando ? 'Creando...' : 'Crear folio nuevo'}
        </button>
        {mensaje && <p className="text-center text-xs text-[#1C5253] mb-4">{mensaje}</p>}

        {/* Gestión de rescatistas */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          Rescatistas
        </p>
        <div className="bg-white rounded-2xl border border-emerald-100/80 p-3 mb-6">
          <div className="flex gap-2">
            <input
              value={busquedaEmail}
              onChange={(e) => setBusquedaEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPorEmail()}
              placeholder="Buscar por correo..."
              className="flex-1 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
            />
            <button
              onClick={buscarPorEmail}
              disabled={buscando}
              className="px-3 py-2 bg-[#1C5253] hover:bg-[#164343] text-white rounded-lg shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {resultadosBusqueda.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {resultadosBusqueda.map((perfil) => (
                <div
                  key={perfil.id}
                  className="flex items-center justify-between bg-[#F4F9F8] rounded-lg px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C5253] truncate">{perfil.full_name || 'Sin nombre'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{perfil.email}</p>
                  </div>
                  <button
                    onClick={() => toggleRescatista(perfil)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg shrink-0 ${
                      perfil.is_rescuer
                        ? 'bg-red-50 text-red-500'
                        : 'bg-[#88D49E] text-[#1C5253]'
                    }`}
                  >
                    {perfil.is_rescuer ? (
                      <>
                        <HeartOff className="w-3 h-3" /> Quitar
                      </>
                    ) : (
                      <>
                        <Heart className="w-3 h-3" /> Activar
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testimonios pendientes de aprobar */}
        {pendientes.length > 0 && (
          <>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 mt-6">
              Testimonios pendientes ({pendientes.length})
            </p>
            <div className="space-y-2 mb-6">
              {pendientes.map((t) => (
                <FilaTestimonioPendiente key={t.id} testimonio={t} onResuelto={cargarPendientes} />
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between mb-2 mt-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            CURPitas
          </p>
          <button
            onClick={exportarCSV}
            disabled={totalesEstado.todas === 0 || exportando}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C5253] hover:underline disabled:opacity-40"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {exportando ? 'Exportando...' : 'Exportar todo a Excel'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100/80 p-3 mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                value={busquedaMascota}
                onChange={(e) => setBusquedaMascota(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicarBusquedaMascotas()}
                placeholder="Buscar folio o mascota..."
                className="w-full py-2.5 pl-3 pr-9 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253] outline-none focus:border-[#1C5253]"
              />
              {(busquedaMascota || busquedaAplicada) && (
                <button
                  onClick={limpiarBusquedaMascotas}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#1C5253]"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={aplicarBusquedaMascotas}
              className="px-3 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white rounded-xl shrink-0"
              title="Buscar CURPita"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {[
              { id: 'todas', texto: 'Todas', total: totalesEstado.todas },
              { id: 'vinculadas', texto: 'Vinculadas', total: totalesEstado.vinculadas },
              { id: 'sinReclamar', texto: 'Sin reclamar', total: totalesEstado.sinReclamar },
              { id: 'invalidadas', texto: 'Invalidadas', total: totalesEstado.invalidadas },
            ].map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => cambiarFiltroEstado(filtro.id)}
                className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  filtroEstado === filtro.id
                    ? 'bg-[#1C5253] text-white'
                    : 'bg-[#F4F9F8] text-[#1C5253] hover:bg-emerald-100'
                }`}
              >
                {filtro.texto} ({filtro.total})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[11px] text-gray-500">
            Mostrando {primerRegistro}–{ultimoRegistro} de {totalResultados}
          </p>
          {busquedaAplicada && (
            <p className="text-[10px] text-[#1C5253] truncate ml-3">
              Búsqueda: <span className="font-bold">{busquedaAplicada}</span>
            </p>
          )}
        </div>

        {loading && <p className="text-xs text-gray-400">Cargando...</p>}

        {!loading && pets.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
            <p className="text-sm font-bold text-[#1C5253]">No se encontraron CURPitas</p>
            <p className="text-xs text-gray-400 mt-1">Prueba otra búsqueda o cambia el filtro.</p>
          </div>
        )}

        <div className="space-y-2">
          {pets.map((pet) => (
            <FilaMascota key={pet.id} pet={pet} onUpdated={refrescarPanel} />
          ))}
        </div>

        {totalResultados > 0 && (
          <div className="flex items-center justify-between gap-3 mt-4 mb-6">
            <button
              onClick={() => setPaginaActual((pagina) => Math.max(1, pagina - 1))}
              disabled={paginaActual === 1 || loading}
              className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-[#1C5253] disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-xs font-bold text-[#1C5253] text-center">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual((pagina) => Math.min(totalPaginas, pagina + 1))}
              disabled={paginaActual === totalPaginas || loading}
              className="px-3 py-2 bg-white border border-emerald-100 rounded-xl text-xs font-bold text-[#1C5253] disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
