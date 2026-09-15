import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { obtenerPrecios, pesos } from '../lib/pagos';

// ---------------------------------------------------------------------------
// PRECIOS — el bloque de la página de inicio.
//
// Los montos NO están escritos aquí: se leen del servidor, de la misma lista
// que usa la pasarela para cobrar. Es la única forma de que el precio de la
// página y el precio del cobro no se separen nunca. Ya nos pasó tener dos
// listas desfasadas y la diferencia era de $49 por placa.
//
// Mientras cargan no se muestra un cero ni un precio inventado: se muestra un
// hueco del mismo tamaño, para que la página no brinque.
//
// Cada opción tiene dos salidas: pedir en línea (paga con tarjeta y listo) y
// cotizar por WhatsApp. Mucha gente no le mete la tarjeta a un sitio que no
// conoce; que exista la segunda puerta es la diferencia entre esa venta y
// ninguna.
// ---------------------------------------------------------------------------

const WHATSAPP = 'https://wa.me/525661868461';

const Monto = ({ valor }) => (
  valor == null
    ? <span className="inline-block h-9 w-24 rounded bg-emerald-50 align-middle" />
    : <span className="text-4xl font-black text-[#1C5253]">{pesos(valor)}</span>
);

const Opcion = ({ titulo, monto, sufijo, puntos, destacada, linkPedir, textoWhats }) => (
  <div
    className={`relative rounded-3xl bg-white p-6 flex flex-col ${
      destacada ? 'border-2 border-[#1C5253] shadow-lg' : 'border border-emerald-100'
    }`}
  >
    {destacada && (
      <span className="absolute -top-3 left-6 rounded-full bg-[#1C5253] text-white text-[11px] font-bold px-3 py-1">
        La que más piden
      </span>
    )}

    <h3 className="text-base font-bold text-[#1C5253]">{titulo}</h3>

    <p className="mt-2 mb-1">
      <Monto valor={monto} />
      {sufijo && <span className="text-sm text-gray-400 ml-1">{sufijo}</span>}
    </p>

    <ul className="mt-4 space-y-2 flex-1">
      {puntos.map((p) => (
        <li key={p} className="flex gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-[#0B7345] shrink-0 mt-0.5" />
          <span>{p}</span>
        </li>
      ))}
    </ul>

    <Link
      to={linkPedir}
      className={`mt-5 rounded-xl font-bold py-3 text-center transition-colors ${
        destacada
          ? 'bg-[#1C5253] text-white hover:bg-[#16403f]'
          : 'border-2 border-[#1C5253] text-[#1C5253] hover:bg-emerald-50'
      }`}
    >
      Pedir en línea
    </Link>

    <a
      href={`${WHATSAPP}?text=${encodeURIComponent(textoWhats)}`}
      target="_blank"
      rel="noreferrer"
      className="mt-2 text-sm text-gray-400 hover:text-[#1C5253] flex items-center justify-center gap-1.5 py-1"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      o cotizar por WhatsApp
    </a>
  </div>
);

export const SeccionPrecios = () => {
  const [precios, setPrecios] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    obtenerPrecios()
      .then((p) => { if (vivo) setPrecios(p); })
      .catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; };
  }, []);

  return (
    <section id="precios" className="py-16 px-4 bg-[#F7F9F8]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-[#1C5253] tracking-tight text-center">
          Cuánto cuesta
        </h2>
        <p className="text-gray-500 text-center mt-2 mb-10 max-w-xl mx-auto">
          Una sola vez. La credencial digital y el QR no se pagan por mes.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 items-stretch">
          <Opcion
            titulo="Placa sencilla"
            monto={precios?.sencilla}
            puntos={[
              'Escudo de CURPitas al frente',
              'QR y NFC al reverso',
              'El color que elijas',
              'Credencial digital incluida',
            ]}
            linkPedir="/pedir?forma=circulo"
            textoWhats="Hola, quiero cotizar una CURPita sencilla."
          />

          <Opcion
            titulo="Con el nombre grabado"
            monto={precios?.personalizada}
            destacada
            puntos={[
              'El nombre de tu mascota al frente',
              'Forma de hueso',
              'QR y NFC al reverso',
              'El color que elijas',
              'Credencial digital incluida',
            ]}
            linkPedir="/pedir?forma=hueso"
            textoWhats="Hola, quiero cotizar una CURPita con el nombre grabado."
          />

          <Opcion
            titulo="Mayoreo"
            monto={precios?.mayoreo}
            sufijo="cada una"
            puntos={[
              precios
                ? `Desde ${precios.mayoreo_desde} piezas`
                : 'Desde varias piezas',
              'Para veterinarias y refugios',
              'Mismos materiales',
              'Se puede combinar formas y colores',
            ]}
            linkPedir={`/pedir?cantidad=${precios?.mayoreo_desde ?? 10}`}
            textoWhats="Hola, quiero cotizar CURPitas en mayoreo."
          />
        </div>

        {error && (
          <p className="text-sm text-gray-400 text-center mt-6">
            No pude cargar los precios ahora mismo.{' '}
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="underline">
              Pregúntame por WhatsApp
            </a>{' '}
            y te los paso.
          </p>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          Precios en pesos mexicanos. El envío se cotiza aparte según tu ciudad.
        </p>
      </div>
    </section>
  );
};

export default SeccionPrecios;