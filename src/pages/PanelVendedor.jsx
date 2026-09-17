import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, LogOut, Loader2 } from 'lucide-react';
import BrandHeader from '../components/BrandHeader';
import { supabase, conReintentoDeSesion } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { formaPorId, colorPorId } from '../lib/placa';
import { pesos } from '../lib/pagos';

// ---------------------------------------------------------------------------
// PANEL DEL VENDEDOR — lo único que ve un vendedor externo al entrar: su
// código, sus ventas y su comisión. Nada de costos, precios de fábrica ni
// números del negocio, y nada de los demás vendedores — eso vive en
// /admin/vendedores, que este panel ni siquiera puede alcanzar.
//
// Los datos salen de la vista `mis_ventas_vendedor`, que ya viene filtrada a
// "solo lo mío" desde la base (ver la migración) y sin ningún dato de
// contacto del cliente — no hace falta (ni se debe) volver a filtrar nada
// aquí en el frontend.
// ---------------------------------------------------------------------------

const EtiquetaEstado = ({ estado }) => {
  const mapa = {
    pagado: 'Pagado', en_produccion: 'En producción', listo: 'Lista para enviar',
    enviado: 'Enviada', entregado: 'Entregada',
  };
  return <span>{mapa[estado] ?? estado}</span>;
};

export const PanelVendedor = () => {
  const { user, signOut } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [{ data: p }, { data: v }] = await Promise.all([
      conReintentoDeSesion(() => supabase.from('vendedores').select('nombre, codigo, comision_pct').eq('id', user.id).single()),
      conReintentoDeSesion(() => supabase.from('mis_ventas_vendedor').select('*').order('creado_en', { ascending: false })),
    ]);
    setPerfil(p ?? null);
    setVentas(v ?? []);
    setCargando(false);
  }, [user.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const resumen = useMemo(() => {
    const acc = { ventas: 0, liberada: 0, pendiente: 0, pagada: 0 };
    ventas.forEach((v) => {
      acc.ventas += 1;
      if (v.comision_pagada) acc.pagada += Number(v.comision) || 0;
      else if (v.comision_liberada) acc.liberada += Number(v.comision) || 0;
      else acc.pendiente += Number(v.comision) || 0;
    });
    return acc;
  }, [ventas]);

  const copiarCodigo = async () => {
    if (!perfil?.codigo) return;
    try {
      await navigator.clipboard.writeText(perfil.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el código ya está visible en pantalla */ }
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <BrandHeader />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-[#1C5253]">
              {perfil ? `Hola, ${perfil.nombre.split(' ')[0]}` : 'Tu panel'}
            </h1>
            <p className="text-xs text-gray-400">Tus ventas y tu comisión</p>
          </div>
          <button
            onClick={signOut}
            className="text-[11px] font-bold text-gray-400 hover:text-[#1C5253] flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

        {cargando && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...
          </p>
        )}

        {!cargando && perfil && (
          <>
            {/* Tu código */}
            <div className="bg-white rounded-2xl border border-emerald-100/80 p-4 mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tu código</p>
                <p className="text-lg font-black text-[#1C5253] font-mono">{perfil.codigo}</p>
                <p className="text-[11px] text-gray-400">Ganas {perfil.comision_pct}% de cada venta que cierres</p>
              </div>
              <button
                onClick={copiarCodigo}
                className="shrink-0 p-2.5 rounded-lg bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253]"
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copiado && <p className="text-[11px] text-[#0B7345] -mt-3 mb-3 text-right">Copiado.</p>}

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Liberada</p>
                <p className="text-sm font-black text-[#1C5253] leading-tight mt-0.5">{pesos(resumen.liberada)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sin liberar</p>
                <p className="text-sm font-black text-[#1C5253] leading-tight mt-0.5">{pesos(resumen.pendiente)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pagada</p>
                <p className="text-sm font-black text-[#0B7345] leading-tight mt-0.5">{pesos(resumen.pagada)}</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 -mt-3 mb-4">
              "Sin liberar" son ventas que ya se pagaron pero cuya placa todavía no se entrega — la comisión se libera
              hasta que se entrega.
            </p>

            {/* Lista de ventas */}
            {ventas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
                <p className="text-sm font-bold text-[#1C5253]">Todavía no tienes ventas</p>
                <p className="text-xs text-gray-400 mt-1">
                  Comparte tu código — en cuanto alguien lo use al comprar, aparece aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ventas.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl border border-emerald-100/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1C5253]">
                          {formaPorId(v.forma).nombre} {colorPorId(v.color).nombre.toLowerCase()}
                          {v.nombre_mascota ? ` — "${v.nombre_mascota}"` : ''}
                          {v.cantidad > 1 ? ` × ${v.cantidad}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{pesos(v.total)} · <EtiquetaEstado estado={v.estado} /></p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-[#1C5253]">{pesos(v.comision)}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          v.comision_pagada ? 'bg-[#0B7345]/10 text-[#0B7345]'
                            : v.comision_liberada ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
                        }`}
                        >
                          {v.comision_pagada ? 'Pagada' : v.comision_liberada ? 'Liberada' : 'Sin liberar'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PanelVendedor;
