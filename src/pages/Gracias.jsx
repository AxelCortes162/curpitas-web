import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Loader2, MessageCircle, XCircle } from 'lucide-react';
import BrandHeader from '../components/BrandHeader';
import { consultarPedido, pesos } from '../lib/pagos';
import { formaPorId, colorPorId } from '../lib/placa';

// ---------------------------------------------------------------------------
// GRACIAS — a donde Mercado Pago regresa al cliente después de pagar.
//
// El detalle que importa: Mercado Pago lo regresa aquí en cuanto aprueba el
// pago, pero el aviso a nuestro servidor puede tardar unos segundos. Si la
// página dijera "pendiente" y se quedara así, el cliente creería que su pago
// no entró y volvería a pagar.
//
// Así que pregunta por el estado cada 2 segundos durante medio minuto. Si en
// ese rato no cambia, no dice que algo salió mal —el pago probablemente está
// bien— sino que la confirmación va en camino, y deja el WhatsApp a la mano.
// ---------------------------------------------------------------------------

const WHATSAPP = 'https://wa.me/525661868461';
const CADA_MS = 2000;
const HASTA_MS = 30000;

const nombreForma = (id) => formaPorId(id).nombre;
const nombreColor = (id) => colorPorId(id).nombre;

export const Gracias = () => {
  const [params] = useSearchParams();
  const pedidoId = params.get('pedido') ?? '';

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seRindio, setSeRindio] = useState(false);
  const [error, setError] = useState('');
  const timers = useRef([]);

  useEffect(() => {
    if (!pedidoId) {
      setCargando(false);
      setError('No sé de qué pedido se trata: el link no traía el número.');
      return undefined;
    }

    let vivo = true;
    const inicio = Date.now();

    const revisar = async () => {
      try {
        const p = await consultarPedido(pedidoId);
        if (!vivo) return;
        setPedido(p);
        setCargando(false);

        if (p.estado !== 'pendiente') return;          // ya resolvió, se deja de preguntar
        if (Date.now() - inicio >= HASTA_MS) {
          setSeRindio(true);
          return;
        }
        timers.current.push(setTimeout(revisar, CADA_MS));
      } catch (e) {
        if (!vivo) return;
        setCargando(false);
        setError(e.message || 'No pude consultar tu pedido.');
      }
    };

    revisar();

    return () => {
      vivo = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [pedidoId]);

  const estado = pedido?.estado;
  const pagado = estado === 'pagado';
  const malo = ['rechazado', 'cancelado'].includes(estado);

  return (
    <div className="min-h-screen bg-[#F7F9F8] px-4 py-10">
      <div className="max-w-md mx-auto">
        <BrandHeader />

        <div className="rounded-3xl bg-white border border-emerald-100 p-6 text-center">
          {cargando && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-[#1C5253] animate-spin" />
              <h1 className="text-xl font-black text-[#1C5253] mt-4">Un momento…</h1>
              <p className="text-sm text-gray-500 mt-1">Estoy buscando tu pedido.</p>
            </>
          )}

          {!cargando && error && (
            <>
              <XCircle className="w-10 h-10 mx-auto text-amber-500" />
              <h1 className="text-xl font-black text-[#1C5253] mt-4">
                No pude confirmarlo aquí
              </h1>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <p className="text-sm text-gray-500 mt-3">
                Si ya te cobraron, tu pago está registrado. Escríbeme y lo reviso.
              </p>
            </>
          )}

          {!cargando && !error && pagado && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#0B7345]" />
              <h1 className="text-2xl font-black text-[#1C5253] mt-4">¡Pago recibido!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ya estoy con tu placa. Te aviso por WhatsApp cuando esté lista.
              </p>
            </>
          )}

          {!cargando && !error && !pagado && !malo && (
            <>
              <Clock className="w-10 h-10 mx-auto text-amber-500" />
              <h1 className="text-xl font-black text-[#1C5253] mt-4">
                {seRindio ? 'Tu pago va en camino' : 'Confirmando tu pago…'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {seRindio
                  ? 'Mercado Pago aún no me ha confirmado. Si ya te cobraron, no vuelvas a pagar: en cuanto entre el aviso te escribo.'
                  : 'Esto tarda unos segundos. No cierres la página.'}
              </p>
              {!seRindio && (
                <Loader2 className="w-4 h-4 mx-auto mt-3 text-gray-300 animate-spin" />
              )}
            </>
          )}

          {!cargando && !error && malo && (
            <>
              <XCircle className="w-10 h-10 mx-auto text-red-500" />
              <h1 className="text-xl font-black text-[#1C5253] mt-4">
                El pago no se completó
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                No se te cobró nada. Puedes intentarlo otra vez.
              </p>
            </>
          )}

          {/* Resumen de lo pedido. Se muestra en cualquier estado en que el
              pedido exista: le da al cliente algo concreto que reconocer. */}
          {pedido && (
            <dl className="text-left text-sm mt-6 pt-5 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Placa</dt>
                <dd className="text-[#1C5253] font-bold text-right">
                  {nombreForma(pedido.forma)} {nombreColor(pedido.color).toLowerCase()}
                  {pedido.nombre_mascota ? ` — “${pedido.nombre_mascota}”` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Cantidad</dt>
                <dd className="text-[#1C5253] font-bold">{pedido.cantidad}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Total</dt>
                <dd className="text-[#1C5253] font-bold">{pesos(pedido.total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400">Pedido</dt>
                <dd className="text-gray-400 font-mono text-xs break-all text-right">
                  {pedido.id}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="mt-5 space-y-2.5">
          {malo && (
            <Link
              to="/pedir"
              className="block w-full text-center rounded-xl bg-[#1C5253] text-white font-bold py-3 hover:bg-[#16403f] transition-colors"
            >
              Intentar de nuevo
            </Link>
          )}
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent(
              pedidoId ? `Hola, pedí una CURPita. Mi pedido es ${pedidoId}` : 'Hola, tengo una duda de mi pedido',
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

export default Gracias;