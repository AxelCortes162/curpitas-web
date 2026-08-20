import React, { useEffect, useState, useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { PawPrint, Plus, Download, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Genera un folio nuevo con formato CURPITA + 8 dígitos aleatorios
const generarFolio = () => {
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `CURPITA${numero}`;
};

const FilaMascota = ({ pet }) => {
  const canvasRef = useRef(null);
  const url = `${window.location.origin}/mascota/${pet.curpita}`;

  const descargarQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${pet.curpita}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 flex items-center gap-4">
      <div ref={canvasRef}>
        <QRCodeCanvas value={url} size={64} bgColor="#ffffff" fgColor="#1C5253" />
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
        onClick={descargarQR}
        className="p-2.5 bg-[#F4F9F8] hover:bg-emerald-100 rounded-xl text-[#1C5253] shrink-0"
        title="Descargar QR"
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

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

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