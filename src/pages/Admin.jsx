import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { PawPrint, Plus, Download, ShieldCheck, ShieldOff, Star, Check, X, CreditCard, Tag } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Genera un folio nuevo con formato CURPITA + 8 dígitos aleatorios
const generarFolio = () => {
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `CURPITA${numero}`;
};

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

const FilaMascota = ({ pet }) => {
  const canvasRef = useRef(null);
  const qrGrandeRef = useRef(null);
  const url = `${window.location.origin}/mascota/${pet.curpita}`;

  const colores = {
    teal: '#1C5253',
    mint: '#88D49E',
    cream: '#E8F3F1',
    white: '#ffffff',
  };

  // Convierte milímetros a píxeles a 300dpi (estándar de impresión)
  const mmAPx = (mm) => Math.round((mm / 25.4) * 300);

  // Tamaños en VERTICAL (se invierten ancho/alto respecto a la medida "acostada")
  const CR80 = { w: mmAPx(54), h: mmAPx(85.6) }; // 638 x 1011 px
  const BLISTER = { w: mmAPx(80), h: mmAPx(110) }; // 945 x 1300 px

  const descargarQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${pet.curpita}.png`;
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
  // Distribución original — la misma para presentación y blíster,
  // solo cambia el tamaño final. El espaciado entre elementos se calcula
  // dinámicamente según el tamaño real de cada texto (no porcentajes fijos),
  // para que nunca se amontone sin importar la proporción de la tarjeta.
  // ============================================
  const generarFrente = (w, h, sufijo) => {
    const qrCanvas = qrGrandeRef.current?.querySelector('canvas');
    if (!qrCanvas) return;
    const { teal, mint, white } = colores;
    const { canvas, ctx } = crearCanvas(w, h, teal);

    const pad = w * 0.08;
    const base = Math.min(w, h); // referencia única para escalar todo el texto
    let cursorY = h * 0.075;

    ctx.fillStyle = white;
    ctx.textAlign = 'left';
    const tituloSize = base * 0.11;
    ctx.font = `bold ${Math.round(tituloSize)}px sans-serif`;
    cursorY += tituloSize * 0.8;
    ctx.fillText('CURPitas', pad, cursorY);
    cursorY += tituloSize * 0.35;

    ctx.fillStyle = mint;
    const subSize = base * 0.036;
    ctx.font = `bold ${Math.round(subSize)}px sans-serif`;
    cursorY += subSize * 1.15;
    ctx.fillText('CREDENCIAL OFICIAL', pad, cursorY);
    cursorY += subSize * 1.3;
    ctx.fillText('DE MASCOTA', pad, cursorY);

    // Centrado del bloque QR en el espacio restante entre el texto y el folio
    const qrR = base * 0.22;
    const folioAlto = base * 0.11;
    const espacioInferior = folioAlto + base * 0.16; // folio + margen + dominio
    const espacioDisponibleTop = cursorY + subSize;
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

  const generarReverso = (w, h, sufijo) => {
    const { teal, cream } = colores;
    const { canvas, ctx } = crearCanvas(w, h, cream);
    const pad = w * 0.08;
    const base = Math.min(w, h);
    let cursorY = h * 0.075;

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

  const handlePresentacion = () => {
    generarFrente(CR80.w, CR80.h, 'presentacion');
    setTimeout(() => generarReverso(CR80.w, CR80.h, 'presentacion'), 250);
  };

  const handleBlister = () => {
    generarFrente(BLISTER.w, BLISTER.h, 'blister');
    setTimeout(() => generarReverso(BLISTER.w, BLISTER.h, 'blister'), 250);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 flex items-center gap-4">
      <div ref={canvasRef}>
        <QRCodeCanvas value={url} size={64} bgColor="#ffffff" fgColor="#1C5253" />
      </div>
      {/* QR más grande, oculto, solo para usarlo al generar las tarjetas */}
      <div ref={qrGrandeRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={url} size={500} bgColor="#ffffff" fgColor="#1C5253" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs font-bold text-[#1C5253]">{pet.curpita}</p>
        <p className="text-xs text-gray-500 truncate">{pet.name || '— sin nombre aún —'}</p>
        {pet.owner_id ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1C5253] mt-1">
            <ShieldCheck className="w-3 h-3 text-[#88D49E]" /> Vinculada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1">
            <ShieldOff className="w-3 h-3" /> Sin reclamar
          </span>
        )}
      </div>

      <button
        onClick={handlePresentacion}
        className="p-2.5 bg-[#1C5253] hover:bg-[#164343] rounded-xl text-white shrink-0"
        title="Generar tarjeta de presentación (CR80 vertical, frente + reverso)"
      >
        <CreditCard className="w-4 h-4" />
      </button>
      <button
        onClick={handleBlister}
        className="p-2.5 bg-[#88D49E] hover:bg-[#78c98e] rounded-xl text-[#1C5253] shrink-0"
        title="Generar tarjeta blíster (8x11cm vertical, frente + reverso)"
      >
        <Tag className="w-4 h-4" />
      </button>
      <button
        onClick={descargarQR}
        className="p-2.5 bg-[#F4F9F8] hover:bg-emerald-100 rounded-xl text-[#1C5253] shrink-0"
        title="Descargar solo el QR"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};

export const Admin = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [pendientes, setPendientes] = useState([]);

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPets(data);
    setLoading(false);
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
    cargarPendientes();
  }, [cargarMascotas, cargarPendientes]);

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
    cargarMascotas();
  };

  const sinReclamar = pets.filter((p) => !p.owner_id).length;

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="CURPitas" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-[#1C5253]">Panel de administrador</h1>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          {pets.length} folios totales · {sinReclamar} sin reclamar
        </p>

        <button
          onClick={handleCrearFolio}
          disabled={creando}
          className="w-full py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-60 mb-2"
        >
          <Plus className="w-4 h-4" />
          {creando ? 'Creando...' : 'Crear folio nuevo'}
        </button>
        {mensaje && <p className="text-center text-xs text-[#1C5253] mb-4">{mensaje}</p>}

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

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          Todas las placas
        </p>

        {loading && <p className="text-xs text-gray-400">Cargando...</p>}

        <div className="space-y-2">
          {pets.map((pet) => (
            <FilaMascota key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;