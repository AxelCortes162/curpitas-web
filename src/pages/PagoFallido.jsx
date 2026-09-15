import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, RotateCcw, XCircle } from 'lucide-react';
import BrandHeader from '../components/BrandHeader';

// ---------------------------------------------------------------------------
// PAGO FALLIDO — a donde Mercado Pago regresa cuando el pago no se pudo hacer.
//
// Lo único que importa aquí es que el cliente sepa dos cosas y no se quede
// dudando: que no se le cobró nada, y por dónde volver a intentar. Nada de
// explicar códigos de error que no puede arreglar.
//
// No consulta el estado del pedido: el pedido sigue en "pendiente" y no hay
// nada que confirmar. Si el cliente en realidad sí pagó y Mercado Pago lo
// manda aquí por error, el webhook lo va a corregir solo.
// ---------------------------------------------------------------------------

export const PagoFallido = () => {
  const [params] = useSearchParams();
  const pedidoId = params.get('pedido') ?? '';

  return (
    <div className="min-h-screen bg-[#F7F9F8] px-4 py-10">
      <div className="max-w-md mx-auto">
        <BrandHeader />

        <div className="rounded-3xl bg-white border border-emerald-100 p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500" />
          <h1 className="text-2xl font-black text-[#1C5253] mt-4">
            El pago no se completó
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            <strong className="text-[#1C5253]">No se te cobró nada.</strong> Puede haber
            sido la tarjeta, el banco o que se cerró la ventana antes de terminar.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Tu pedido quedó guardado, así que puedes intentar otra vez sin volver a
            llenar todo.
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          <Link
            to="/pedir"
            className="w-full rounded-xl bg-[#1C5253] text-white font-bold py-3 flex items-center justify-center gap-2 hover:bg-[#16403f] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Intentar de nuevo
          </Link>
          <a
            href={`https://wa.me/525661868461?text=${encodeURIComponent(
              pedidoId
                ? `Hola, no me pasó el pago de mi CURPita. Mi pedido es ${pedidoId}`
                : 'Hola, no me pasó el pago de mi CURPita',
            )}`}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl border-2 border-[#1C5253] text-[#1C5253] font-bold py-3 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Pagar por WhatsApp
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

export default PagoFallido;