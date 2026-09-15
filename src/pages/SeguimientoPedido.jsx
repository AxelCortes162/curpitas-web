import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2, Circle, Loader2, MessageCircle, XCircle, Clock,
} from 'lucide-react';
import BrandHeader from '../components/BrandHeader';
import { consultarPedido } from '../lib/pagos';
import { formaPorId, colorPorId } from '../lib/placa';

// ---------------------------------------------------------------------------
// SEGUIMIENTO DEL PEDIDO — la línea de tiempo pública que ve el cliente.
//
// A diferencia de /gracias (que solo pregunta "¿ya se confirmó el pago?" y
// deja de preguntar), esta página es para volver: se manda en el correo de
// confirmación y se puede visitar cuantas veces se quiera. Por eso no hace
// polling — solo carga una vez al entrar.
//
// Mismo cuidado de seguridad que /gracias: solo responde si se acierta el
// UUID del pedido (no se puede adivinar), y nunca se manda ni se muestra el
// teléfono o el correo del cliente. La función estado-pedido tampoco manda
// la nota que deja Esmeralda al avanzar un pedido — esa es para uso interno.
// ---------------------------------------------------------------------------

const WHATSAPP = 'https://wa.me/525661868461';

const ETAPAS = [
  { id: 'pagado', titulo: 'Pago confirmado', campo: 'pagado_en' },
  { id: 'en_produccion', titulo: 'En producción', campo: null },
  { id: 'listo', titulo: 'Lista para enviar', campo: null },
  { id: 'enviado', titulo: 'Enviada', campo: null },
  { id: 'entregado', titulo: 'Entregada', campo: null },
];

const nombreForma = (id) => formaPorId(id).nombre;
const nombreColor = (id) => colorPorId(id).nombre;

const formatoFecha = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
};

export const SeguimientoPedido = () => {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError('');
    consultarPedido(id)
      .then((p) => { if (vivo) setPedido(p); })
      .catch((e) => { if (vivo) setError(e.message || 'No pude encontrar ese pedido.'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [id]);

  const estado = pedido?.estado;
  const noPagado = estado === 'pendiente';
  const malo = ['rechazado', 'cancelado', 'reembolsado'].includes(estado ?? '');
  const enFlujo = pedido && !noPagado && !malo;

  // A qué fecha llegó cada etapa. 'pagado' sale de pagado_en; el resto, del
  // evento más reciente de pedido_eventos con ese estado (por si Esmeralda
  // corrigió algo y volvió a avanzarlo).
  const fechaDeEtapa = (etapaId) => {
    if (etapaId === 'pagado') return pedido?.pagado_en ?? null;
    const enEsta = (pedido?.eventos ?? []).filter((ev) => ev.estado === etapaId);
    return enEsta.length ? enEsta[enEsta.length - 1].creado_en : null;
  };

  const indiceActual = enFlujo ? ETAPAS.findIndex((e) => e.id === estado) : -1;

  return (
    <div className="min-h-screen bg-[#F7F9F8] px-4 py-10">
      <div className="max-w-md mx-auto">
        <BrandHeader />

        <div className="rounded-3xl bg-white border border-emerald-100 p-6">
          {cargando && (
            <div className="text-center py-4">
              <Loader2 className="w-10 h-10 mx-auto text-[#1C5253] animate-spin" />
              <p className="text-sm text-gray-500 mt-3">Buscando tu pedido…</p>
            </div>
          )}

          {!cargando && error && (
            <div className="text-center py-4">
              <XCircle className="w-10 h-10 mx-auto text-amber-500" />
              <h1 className="text-lg font-black text-[#1C5253] mt-4">No encontré ese pedido</h1>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
          )}

          {!cargando && !error && noPagado && (
            <div className="text-center py-4">
              <Clock className="w-10 h-10 mx-auto text-amber-500" />
              <h1 className="text-lg font-black text-[#1C5253] mt-4">Tu pago aún no se confirma</h1>
              <p className="text-sm text-gray-500 mt-1">
                En cuanto se confirme, esta página va a mostrar en qué va tu placa.
              </p>
            </div>
          )}

          {!cargando && !error && malo && (
            <div className="text-center py-4">
              <XCircle className="w-10 h-10 mx-auto text-red-500" />
              <h1 className="text-lg font-black text-[#1C5253] mt-4">
                {estado === 'reembolsado' ? 'Este pedido fue reembolsado' : 'Este pedido no se completó'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Si crees que esto es un error, escríbeme y lo reviso.
              </p>
            </div>
          )}

          {!cargando && !error && enFlujo && (
            <>
              <h1 className="text-lg font-black text-[#1C5253] mb-1">Tu CURPita va así</h1>
              <p className="text-xs text-gray-400 mb-6">
                {nombreForma(pedido.forma)} {nombreColor(pedido.color).toLowerCase()}
                {pedido.nombre_mascota ? ` — "${pedido.nombre_mascota}"` : ''}
                {pedido.cantidad > 1 ? ` × ${pedido.cantidad}` : ''}
              </p>

              <ol>
                {ETAPAS.map((etapa, i) => {
                  const hecha = i <= indiceActual;
                  const actual = i === indiceActual;
                  const fecha = fechaDeEtapa(etapa.id);
                  const ultima = i === ETAPAS.length - 1;

                  return (
                    <li key={etapa.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {hecha ? (
                          <CheckCircle2
                            className={`w-6 h-6 shrink-0 ${actual ? 'text-[#1C5253]' : 'text-[#0B7345]'}`}
                          />
                        ) : (
                          <Circle className="w-6 h-6 shrink-0 text-gray-200" />
                        )}
                        {!ultima && (
                          <div className={`w-0.5 flex-1 my-0.5 ${hecha ? 'bg-[#0B7345]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className={`pb-6 ${ultima ? 'pb-0' : ''} min-w-0`}>
                        <p className={`text-sm font-bold ${hecha ? 'text-[#1C5253]' : 'text-gray-300'}`}>
                          {etapa.titulo}
                          {actual && (
                            <span className="ml-2 text-[10px] font-bold text-white bg-[#1C5253] px-1.5 py-0.5 rounded-full align-middle">
                              aquí vas
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fecha ? formatoFecha(fecha) : hecha ? '' : 'Todavía no'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>

        <div className="mt-5 space-y-2.5">
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent(
              id ? `Hola, quiero saber cómo va mi pedido. Mi pedido es ${id}` : 'Hola, tengo una duda de mi pedido',
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl border-2 border-[#1C5253] text-[#1C5253] font-bold py-3 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Escribirme por WhatsApp
          </a>
          <Link
            to="/"
            className="block w-full text-center text-sm text-gray-400 hover:text-[#1C5253] py-2"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoPedido;
