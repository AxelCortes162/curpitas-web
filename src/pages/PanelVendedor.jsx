import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, LogOut, Loader2 } from 'lucide-react';
import BrandHeader from '../components/BrandHeader';
import { supabase, conReintentoDeSesion } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { describirPedido } from '../lib/placa';
import { obtenerPrecios, pesos } from '../lib/pagos';

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

// Respuestas a lo que más pregunta la gente. Sale de /terminos-y-condiciones y
// de la sección de precios — si cambian allá, cambiar aquí.
const RESPUESTAS = [
  ['¿Se paga cada mes?', 'No. Se paga una sola vez; la credencial digital y el QR no tienen mensualidad.'],
  ['¿Hay que instalar una app?', 'No. Quien encuentre a la mascota escanea el QR con la cámara de su celular, o acerca el celular al chip NFC.'],
  ['¿Funciona en cualquier celular?', 'El QR sí, en todos. El NFC solo en celulares que lo tengan activado.'],
  ['¿Cuánto tarda?', 'Si la tenemos hecha, sale el mismo día o al siguiente (con nombre grabado, al día siguiente). Si hay que hacerla, unos 4 días.'],
  ['¿Cómo llega?', 'CDMX y zona metropolitana: entrega en persona, de 1 a 5 días hábiles. Resto de México: paquetería, el costo se cotiza aparte.'],
  ['¿Y si sale mal?', 'Si llega dañada, con un error nuestro o el QR/NFC no funcionan, se repone sin costo dentro de 90 días.'],
  ['No quiere pagar con tarjeta en línea', 'Que pida por nuestro WhatsApp y diga tu código — también cuenta como venta tuya.'],
  ['Es una veterinaria, estética o tienda', 'El precio para negocios se cotiza aparte: pásales nuestro WhatsApp y diles que vienen de tu parte (tu código).'],
];

export const PanelVendedor = () => {
  const { user, signOut } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(null); // qué se copió: 'codigo', 'link', 'msg0'…
  const [precios, setPrecios] = useState(null);

  useEffect(() => { obtenerPrecios().then(setPrecios).catch(() => {}); }, []);

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

  const copiar = async (texto, clave) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setTimeout(() => setCopiado(null), 2000);
    } catch { /* el texto ya está visible en pantalla */ }
  };

  // /pedir?v=CODIGO ya llena solo el campo "Código de quien te recomendó".
  const link = perfil ? `${window.location.origin}/pedir?v=${perfil.codigo}` : '';
  const mensajes = perfil ? [
    `¡Hola! Te comparto CURPitas: una placa para tu mascota con QR y chip NFC. Si se pierde, quien la encuentre la escanea con su celular y ve tu teléfono y sus datos médicos. Se paga una sola vez, sin mensualidad. Pídela aquí: ${link}`,
    `¡Hola! ¿Pudiste ver lo de la placa CURPitas? Si tienes dudas te ayudo. Puedes pedirla aquí: ${link} — o si prefieres no pagar en línea, escríbeles por WhatsApp al 56 6186 8461 con mi código ${perfil.codigo}.`,
  ] : [];

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
                onClick={() => copiar(perfil.codigo, 'codigo')}
                className="shrink-0 p-2.5 rounded-lg bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253]"
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copiado === 'codigo' && <p className="text-[11px] text-[#0B7345] -mt-3 mb-3 text-right">Copiado.</p>}

            {/* Ayudas para vender */}
            <details className="bg-white rounded-2xl border border-emerald-100/80 p-4 mb-4">
              <summary className="text-sm font-black text-[#1C5253] cursor-pointer select-none">
                Cómo vender — tu link, mensajes y respuestas
              </summary>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-4">Tu link</p>
              <p className="text-[11px] text-gray-400">Quien compre desde aquí ya lleva tu código puesto.</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-mono text-[#1C5253] break-all flex-1">{link}</p>
                <button
                  onClick={() => copiar(link, 'link')}
                  className="shrink-0 p-2 rounded-lg bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253]"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiado === 'link' && <p className="text-[11px] text-[#0B7345] text-right">Copiado.</p>}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-5">Mensajes listos</p>
              {mensajes.map((m, i) => (
                <div key={m} className="mt-2 p-3 rounded-xl bg-[#F4F9F8]">
                  <p className="text-xs text-gray-600 leading-relaxed">{m}</p>
                  <div className="flex gap-3 mt-2 text-[11px] font-bold text-[#1C5253]">
                    <button onClick={() => copiar(m, `msg${i}`)}>
                      {copiado === `msg${i}` ? 'Copiado' : 'Copiar'}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(m)}`} target="_blank" rel="noreferrer">
                      Mandar por WhatsApp
                    </a>
                  </div>
                </div>
              ))}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-5">Precios</p>
              {precios ? (
                <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                  <li>Sencilla (círculo, cuadrado o rectángulo): <b>{pesos(precios.sencilla)}</b></li>
                  <li>Hueso con el nombre grabado: <b>{pesos(precios.personalizada)}</b></li>
                  <li>Desde {precios.mayoreo_desde} sencillas: <b>{pesos(precios.mayoreo)}</b> c/u</li>
                  <li>Envío aparte fuera de CDMX.</li>
                </ul>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Los ves en curpitas.com/#precios.</p>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-5">Lo que te van a preguntar</p>
              <dl className="mt-1 space-y-2">
                {RESPUESTAS.map(([p, r]) => (
                  <div key={p}>
                    <dt className="text-xs font-bold text-[#1C5253]">{p}</dt>
                    <dd className="text-xs text-gray-600">{r}</dd>
                  </div>
                ))}
              </dl>
            </details>

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
                          {describirPedido(v)}
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
