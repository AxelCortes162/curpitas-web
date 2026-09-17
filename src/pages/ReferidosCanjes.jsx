import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Loader2, CheckCircle2, Gift, Phone,
} from 'lucide-react';
import { supabase, conReintentoDeSesion } from '../supabaseClient';

// ---------------------------------------------------------------------------
// REFERIDOS — canjes pendientes de puntos que piden los tutores desde
// /mi-cuenta. El tutor ya pidió el canje y ya se le descontaron los puntos
// (solicitar_canje lo hizo en la misma transacción) — lo único que queda
// aquí es surtirlo a mano (llamarle, mandarle el premio) y marcarlo.
//
// A diferencia de vendedores externos, aquí no hay dinero ni comisión que
// calcular: es solo la cola de "qué le debo a quién en premios". Ver
// claude/sistema-referidos.md para el diseño completo.
// ---------------------------------------------------------------------------

const NOMBRES_PREMIO = {
  bolsas_popo: 'Bolsitas para popó',
  plato: 'Plato CURPitas',
  totebag: 'Totebag',
  segunda_placa: 'Segunda placa',
  sudadera: 'Sudadera CURPitas',
};

export const ReferidosCanjes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verEntregadas, setVerEntregadas] = useState(false);
  const [procesando, setProcesando] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await conReintentoDeSesion(() => supabase
      .from('solicitudes_canje')
      .select('*, tutor:profiles(full_name, phone, email, codigo_referido)')
      .order('creado_en', { ascending: false })
      .limit(100));
    if (!error) setSolicitudes(data || []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcarEntregado = async (solicitud) => {
    setProcesando(solicitud.id);
    await conReintentoDeSesion(() => supabase.rpc('marcar_canje_entregado', {
      p_solicitud_id: solicitud.id,
    }));
    setProcesando('');
    cargar();
  };

  const visibles = solicitudes.filter((s) => (verEntregadas ? true : s.estado === 'pendiente'));
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#1C5253] mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Admin
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="CURPitas" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-[#1C5253]">Referidos</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Canjes de puntos que piden los tutores — {pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'}.
        </p>

        <button
          onClick={() => setVerEntregadas((v) => !v)}
          className={`mb-4 text-[11px] font-bold px-3 py-1.5 rounded-full ${
            verEntregadas ? 'bg-[#1C5253] text-white' : 'bg-white border border-emerald-100 text-[#1C5253]'
          }`}
        >
          {verEntregadas ? 'Viendo todas' : 'Ver también entregadas'}
        </button>

        {cargando && <p className="text-xs text-gray-400">Cargando...</p>}

        {!cargando && visibles.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
            <Gift className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-[#1C5253] mt-2">No hay canjes pendientes</p>
            <p className="text-xs text-gray-400 mt-1">
              Aquí aparecen en cuanto un tutor pida canjear sus puntos.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {visibles.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-emerald-100/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1C5253]">
                    {NOMBRES_PREMIO[s.premio] ?? s.premio}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.tutor?.full_name || 'Sin nombre'} · {s.puntos_usados} pts
                  </p>
                  {s.tutor?.phone && (
                    <a
                      href={`https://wa.me/52${s.tutor.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#1C5253] mt-1"
                    >
                      <Phone className="w-3 h-3" /> {s.tutor.phone}
                    </a>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                    s.estado === 'entregado' ? 'bg-[#0B7345]/10 text-[#0B7345]' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {s.estado === 'entregado' ? 'Entregado' : 'Pendiente'}
                </span>
              </div>

              {s.estado === 'pendiente' && (
                <button
                  onClick={() => marcarEntregado(s)}
                  disabled={procesando === s.id}
                  className="mt-3 w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {procesando === s.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Marcar entregado
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferidosCanjes;
