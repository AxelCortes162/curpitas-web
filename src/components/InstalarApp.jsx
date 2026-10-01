import React, { useEffect, useState } from 'react';
import { Smartphone, Share, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// INSTALAR LA APP — tarjeta en Mi cuenta para agregar CURPitas a la pantalla
// de inicio (abre directo en Mi cuenta, sin barra del navegador).
//
// Android/Chrome avisa con "beforeinstallprompt" y el botón abre su cuadro de
// instalación. Ese evento puede llegar antes de que esta página cargue, por
// eso main.jsx lo guarda en window.__instalarApp. iPhone no tiene ese evento:
// ahí solo se puede explicar los pasos de Safari.
// ---------------------------------------------------------------------------

const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const esIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const leerOculto = () => {
  try { return localStorage.getItem('ocultarInstalarApp') === '1'; } catch { return false; }
};

export default function InstalarApp() {
  const [aviso, setAviso] = useState(() => window.__instalarApp ?? null);
  const [oculto, setOculto] = useState(leerOculto);

  useEffect(() => {
    const alAvisar = (e) => { e.preventDefault(); window.__instalarApp = e; setAviso(e); };
    const alInstalar = () => { window.__instalarApp = null; setAviso(null); setOculto(true); };
    window.addEventListener('beforeinstallprompt', alAvisar);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alAvisar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  if (oculto || yaInstalada() || (!aviso && !esIphone())) return null;

  const ocultar = () => {
    setOculto(true);
    try { localStorage.setItem('ocultarInstalarApp', '1'); } catch { /* sin almacenamiento, solo por ahora */ }
  };

  const instalar = async () => {
    aviso.prompt();
    const { outcome } = await aviso.userChoice;
    window.__instalarApp = null;
    setAviso(null);
    if (outcome === 'accepted') setOculto(true);
  };

  return (
    <div className="relative bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5">
      <button
        type="button"
        onClick={ocultar}
        aria-label="Ocultar"
        className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#1C5253]"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm font-bold text-[#1C5253] flex items-center gap-1.5 pr-8">
        <Smartphone className="w-4 h-4" /> Ten CURPitas como app
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Agrégala a tu pantalla de inicio para marcar a tu mascota como perdida en segundos.
      </p>
      {aviso ? (
        <button
          type="button"
          onClick={instalar}
          className="w-full mt-3 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white font-bold rounded-xl text-sm"
        >
          Instalar app
        </button>
      ) : (
        <p className="text-xs text-[#1C5253] mt-3 bg-[#F4F9F8] rounded-xl p-3 leading-relaxed">
          En Safari toca <Share className="inline w-3.5 h-3.5 -mt-0.5" aria-label="Compartir" />{' '}
          <strong>Compartir</strong> y luego <strong>“Agregar a inicio”</strong>.
        </p>
      )}
    </div>
  );
}
