import React, { useEffect, useState } from 'react';
import { ScanLine, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const formatearFecha = (iso) => {
  const d = new Date(iso);
  const ahora = new Date();
  const minutos = Math.floor((ahora - d) / 60000);

  if (minutos < 1) return 'hace unos segundos';
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;

  return d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Historial de escaneos de una placa. Solo lo ve el tutor: la política RLS
 * de pet_scans filtra por owner_id, así que aunque alguien más consulte la
 * tabla no obtiene nada.
 */
export const HistorialEscaneos = ({ petId }) => {
  const [escaneos, setEscaneos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!abierto || cargado) return;

    supabase
      .from('pet_scans')
      .select('id, scanned_at, lat, lng, was_lost')
      .eq('pet_id', petId)
      .order('scanned_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setEscaneos(data || []);
        setCargado(true);
      });
  }, [abierto, cargado, petId]);

  return (
    <div className="border-t border-emerald-100 pt-2">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-[#1C5253]"
      >
        <span className="flex items-center gap-1.5">
          <ScanLine className="w-3 h-3" />
          Quién ha escaneado esta placa
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="mt-2 space-y-1.5">
          {!cargado && <p className="text-[11px] text-gray-400">Cargando...</p>}

          {cargado && escaneos.length === 0 && (
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Nadie ha escaneado esta placa todavía. Aquí van a aparecer la hora y,
              si la comparten, el lugar desde donde lo hicieron.
            </p>
          )}

          {escaneos.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 bg-[#F4F9F8] rounded-lg px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#1C5253] leading-tight">
                  {formatearFecha(s.scanned_at)}
                </p>
                {s.was_lost && (
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-wide">
                    Estaba marcada como perdida
                  </p>
                )}
              </div>

              {s.lat != null && s.lng != null ? (
                <a
                  href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-[#1C5253] hover:underline shrink-0"
                >
                  <MapPin className="w-3 h-3" /> Ver lugar
                </a>
              ) : (
                <span className="text-[10px] text-gray-400 shrink-0">Sin ubicación</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialEscaneos;
