import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { PawPrint, Plus, Download, ShieldCheck, ShieldOff, Star, Check, X, CreditCard } from 'lucide-react';
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

const FilaMascota = ({ pet }) => {
  const canvasRef = useRef(null);
  const qrGrandeRef = useRef(null);
  const url = `${window.location.origin}/mascota/${pet.curpita}`;

  const descargarQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${pet.curpita}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Arma la tarjeta completa (frente + reverso) con el QR real de esta
  // mascota, dibujando todo en un canvas oculto, y descarga el PNG final.
  const generarTarjeta = () => {
    const qrCanvas = qrGrandeRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    const teal = '#1C5253';
    const mint = '#88D49E';
    const cream = '#E8F3F1';
    const white = '#ffffff';

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const panelW = 460;
    const panelH = 640;
    const gap = 80;
    const startX = (canvas.width - (panelW * 2 + gap)) / 2;
    const y0 = 30;

    // ===== FRENTE =====
    ctx.fillStyle = teal;
    trazarRectRedondeado(ctx, startX, y0, panelW, panelH, 28);
    ctx.fill();

    ctx.fillStyle = white;
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CURPitas', startX + 36, y0 + 70);

    ctx.fillStyle = mint;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CREDENCIAL OFICIAL DE MASCOTA', startX + 36, y0 + 100);

    const qrCenterX = startX + panelW / 2;
    const qrCenterY = y0 + 300;
    const outerR = 130;
    const innerR = 100;
    const qrSize = 130;

    // Anillo punteado decorativo ("ventana troquelada")
    ctx.fillStyle = 'rgba(232, 243, 241, 0.5)';
    for (let angulo = 0; angulo < 360; angulo += 12) {
      const rad = (angulo * Math.PI) / 180;
      const px = qrCenterX + outerR * Math.cos(rad);
      const py = qrCenterY + outerR * Math.sin(rad);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Círculo blanco de fondo (más grande que el QR, para no recortarlo:
    // un QR necesita quedar completo, incluyendo sus esquinas, para
    // poder escanearse).
    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(qrCenterX, qrCenterY, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(qrCanvas, qrCenterX - qrSize / 2, qrCenterY - qrSize / 2, qrSize, qrSize);

    const folioY = qrCenterY + innerR + 55;
    ctx.fillStyle = white;
    trazarRectRedondeado(ctx, startX + 36, folioY, panelW - 72, 90, 12);
    ctx.fill();
    ctx.fillStyle = '#999999';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOLIO', startX + panelW / 2, folioY + 32);
    ctx.fillStyle = teal;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(pet.curpita, startX + panelW / 2, folioY + 66);

    ctx.fillStyle = mint;
    ctx.font = '18px sans-serif';
    ctx.fillText('curpitas.com', startX + panelW / 2, y0 + panelH - 28);

    // ===== REVERSO =====
    const bx0 = startX + panelW + gap;
    ctx.fillStyle = cream;
    trazarRectRedondeado(ctx, bx0, y0, panelW, panelH, 28);
    ctx.fill();

    ctx.fillStyle = teal;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Actívala en 3 pasos', bx0 + 36, y0 + 70);

    const pasos = [
      'Crea tu cuenta en curpitas.com',
      'Escribe el folio de esta placa',
      'Completa el perfil de tu mascota',
    ];
    let sy = y0 + 130;
    pasos.forEach((paso, i) => {
      ctx.fillStyle = teal;
      ctx.beginPath();
      ctx.arc(bx0 + 56, sy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cream;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), bx0 + 56, sy + 6);

      ctx.fillStyle = teal;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(paso, bx0 + 92, sy + 6);
      sy += 80;
    });

    ctx.fillStyle = teal;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('curpitas.com', bx0 + panelW / 2, y0 + panelH - 28);

    const link = document.createElement('a');
    link.download = `${pet.curpita}-tarjeta.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 flex items-center gap-4">
      <div ref={canvasRef}>
        <QRCodeCanvas value={url} size={64} bgColor="#ffffff" fgColor="#1C5253" />
      </div>
      {/* QR más grande, oculto, solo para usarlo al generar la tarjeta */}
      <div ref={qrGrandeRef} style={{ display: 'none' }}>
        <QRCodeCanvas value={url} size={400} bgColor="#ffffff" fgColor="#1C5253" />
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
        onClick={generarTarjeta}
        className="p-2.5 bg-[#1C5253] hover:bg-[#164343] rounded-xl text-white shrink-0"
        title="Generar tarjeta completa"
      >
        <CreditCard className="w-4 h-4" />
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