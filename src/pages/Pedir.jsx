import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, MessageCircle, ShieldCheck, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandHeader from '../components/BrandHeader';
import Placa3D from '../components/Placa3D';
import { COLORES, FORMAS, MAX_NOMBRE, colorPorId, formaPorId } from '../lib/placa';
import {
  obtenerPrecios, calcularTotal, iniciarPago, textoCotizacion, pesos,
} from '../lib/pagos';

// ---------------------------------------------------------------------------
// PEDIR — armar la placa y pagarla, en una sola página.
//
// El modelo en 3D y el formulario viven juntos a propósito. La alternativa era
// un configurador aparte que al final "manda" la configuración a otra página,
// y eso agrega un punto donde se puede perder lo que el cliente ya eligió,
// sin darle nada a cambio. Aquí lo que ve girando es exactamente lo que va a
// pagar, y el total está siempre a la vista.
//
// El orden de los campos es el orden en que la gente decide: primero qué placa
// quiere, y hasta el final sus datos. Pedir el teléfono antes de haber elegido
// nada es la forma más rápida de perder al cliente.
// ---------------------------------------------------------------------------

const WHATSAPP = 'https://wa.me/525661868461';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Pedir = () => {
  // Se aceptan valores por la URL para poder mandar links ya armados desde la
  // página de inicio (por ejemplo, el botón de mayoreo con cantidad=10).
  const [params] = useSearchParams();
  const formaInicial = FORMAS.some((f) => f.id === params.get('forma'))
    ? params.get('forma') : 'hueso';
  const colorInicial = COLORES.some((c) => c.id === params.get('color'))
    ? params.get('color') : 'verde';

  const [forma, setForma] = useState(formaInicial);
  const [color, setColor] = useState(colorInicial);
  const [nombreMascota, setNombreMascota] = useState('');
  const [cantidad, setCantidad] = useState(
    Math.max(1, Math.min(100, parseInt(params.get('cantidad'), 10) || 1)),
  );
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [codigoVendedor, setCodigoVendedor] = useState(params.get('v') ?? '');

  const [precios, setPrecios] = useState(null);
  const [errorPrecios, setErrorPrecios] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hayStock, setHayStock] = useState(null);

  const formaActual = formaPorId(forma);

  useEffect(() => {
    let vivo = true;
    obtenerPrecios()
      .then((p) => { if (vivo) setPrecios(p); })
      .catch(() => {
        if (vivo) setErrorPrecios('No pude cargar los precios. Recarga la página.');
      });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    let vivo = true;
    const piezas = parseInt(cantidad, 10) || 1;
    supabase
      .rpc('hay_stock', { p_forma: forma, p_color: color, p_cantidad: piezas })
      .then(({ data, error: err }) => {
        if (vivo) setHayStock(err ? null : data === true);
      });
    return () => { vivo = false; };
  }, [forma, color, cantidad]);

  // Al cambiar a una forma que no lleva nombre grabado, el nombre se limpia en
  // el mismo clic. Si no, el cliente pagaría precio de personalizada por una
  // placa donde el nombre no va a aparecer.
  const elegirForma = (f) => {
    setForma(f.id);
    if (!f.grabaNombre) setNombreMascota('');
  };

  const cuenta = useMemo(
    () => calcularTotal(precios, { forma, cantidad, nombreMascota }),
    [precios, forma, cantidad, nombreMascota],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombreCliente.trim()) return setError('Escribe tu nombre.');
    if (telefono.length !== 10) return setError('El teléfono debe tener 10 dígitos.');
    if (!EMAIL_REGEX.test(email)) {
      return setError('Necesito tu correo para mandarte la confirmación del pedido.');
    }

    setEnviando(true);
    try {
      const { url } = await iniciarPago({
        forma, color, cantidad, nombreMascota,
        nombreCliente: nombreCliente.trim(), telefono, email: email.trim(),
        codigoVendedor: codigoVendedor.trim(),
      });
      // A partir de aquí manda Mercado Pago. No se apaga "enviando": la página
      // se está yendo, y si se apagara, el botón se vería activo un instante y
      // se podría pagar dos veces.
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'No pude iniciar el pago. Intenta de nuevo.');
      setEnviando(false);
    }
  };

  const linkCotizar = `${WHATSAPP}?text=${encodeURIComponent(
    textoCotizacion({
      forma: formaActual.nombre,
      color: colorPorId(color).nombre,
      cantidad,
      nombreMascota,
    }),
  )}`;

  return (
    <div className="min-h-screen bg-[#F7F9F8] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <BrandHeader />

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#1C5253] hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-2xl font-black text-[#1C5253] tracking-tight">
          Arma tu CURPita
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Elige forma, color y nombre. La placa de arriba se va armando contigo.
        </p>

        {/* ---------------- El modelo ----------------
            Pegajoso arriba en pantallas grandes: al bajar a llenar los datos,
            la placa sigue a la vista. En celular no, porque se comería media
            pantalla mientras se escribe. */}
        <div className="sm:sticky sm:top-4 z-10 bg-[#F7F9F8] pb-3 mb-2">
          <div className="rounded-3xl bg-white border border-emerald-100 p-3">
            <Placa3D
              forma={forma}
              color={color}
              nombre={nombreMascota}
              alto={280}
              className="w-full"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ---------------- Forma ---------------- */}
          <fieldset>
            <legend className="text-sm font-bold text-[#1C5253] mb-2">Forma</legend>
            <div className="grid grid-cols-4 gap-2">
              {FORMAS.map((f) => {
                const activa = f.id === forma;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => elegirForma(f)}
                    aria-pressed={activa}
                    className={`rounded-2xl border-2 bg-white px-1 py-2.5 transition-colors ${
                      activa
                        ? 'border-[#1C5253] text-[#1C5253]'
                        : 'border-gray-200 text-gray-400 hover:border-emerald-200'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 mx-auto"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d={f.icono} />
                    </svg>
                    <span className="block text-[11px] font-bold mt-1 leading-tight">
                      {f.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* ---------------- Color ---------------- */}
          <fieldset>
            <legend className="text-sm font-bold text-[#1C5253] mb-2">Color</legend>
            <div className="flex flex-wrap gap-2.5">
              {COLORES.map((c) => {
                const activo = c.id === color;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    aria-pressed={activo}
                    aria-label={c.nombre}
                    title={c.nombre}
                    className={`w-11 h-11 rounded-full border-2 transition-transform ${
                      activo ? 'border-[#1C5253] scale-110' : 'border-white hover:scale-105'
                    }`}
                    style={{
                      background: `radial-gradient(circle at 32% 28%, #ffffffcc, transparent 42%), ${c.hex}`,
                      boxShadow: '0 1px 4px rgba(16,41,42,.25)',
                    }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {colorPorId(color).nombre}. El glitter va incluido en todos.
            </p>
          </fieldset>

          {/* ---------------- Nombre grabado ---------------- */}
          {formaActual.grabaNombre && (
            <div>
              <label htmlFor="nombre-mascota" className="block text-sm font-bold text-[#1C5253] mb-1">
                Nombre de tu mascota <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="nombre-mascota"
                type="text"
                value={nombreMascota}
                onChange={(e) => setNombreMascota(e.target.value.slice(0, MAX_NOMBRE))}
                placeholder="Bebo"
                maxLength={MAX_NOMBRE}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] focus:outline-none focus:border-[#1C5253]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Va grabado al frente, máximo {MAX_NOMBRE} letras.
                {precios && (
                  <>
                    {' '}Con nombre cuesta {pesos(precios.personalizada)}; sin nombre,{' '}
                    {pesos(precios.sencilla)}.
                  </>
                )}
              </p>
            </div>
          )}

          {/* ---------------- Cantidad ---------------- */}
          <div>
            <label htmlFor="cantidad" className="block text-sm font-bold text-[#1C5253] mb-1">
              ¿Cuántas?
            </label>
            <input
              id="cantidad"
              type="number"
              min={1}
              max={100}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onBlur={(e) => setCantidad(
                Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)),
              )}
              className="w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] focus:outline-none focus:border-[#1C5253]"
            />
            {precios && !cuenta?.esMayoreo && !cuenta?.esPersonalizada && (
              <p className="text-xs text-gray-400 mt-1">
                Desde {precios.mayoreo_desde} piezas bajan a {pesos(precios.mayoreo)} cada una.
              </p>
            )}
            {/* La personalizada no baja de precio por cantidad: cada placa
                lleva su propio nombre grabado a mano. */}
            {precios && cuenta?.esPersonalizada && (
              <p className="text-xs text-gray-400 mt-1">
                El nombre grabado no entra en precio de mayoreo: cada placa se cobra a{' '}
                {pesos(precios.personalizada)}, sin importar cuántas pidas.
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* ---------------- Contacto ---------------- */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre-cliente" className="block text-sm font-bold text-[#1C5253] mb-1">
                Tu nombre
              </label>
              <input
                id="nombre-cliente"
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value.slice(0, 80))}
                autoComplete="name"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] focus:outline-none focus:border-[#1C5253]"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-bold text-[#1C5253] mb-1">
                WhatsApp
              </label>
              <input
                id="telefono"
                type="tel"
                inputMode="numeric"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 dígitos"
                autoComplete="tel-national"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] focus:outline-none focus:border-[#1C5253]"
              />
              <p className="text-xs text-gray-400 mt-1">Por aquí te aviso cuando esté lista.</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[#1C5253] mb-1">
                Correo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] focus:outline-none focus:border-[#1C5253]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Aquí te llega la confirmación de tu pedido en cuanto se aprueba el pago.
              </p>
            </div>

            <div>
              {/* Un solo campo para dos cosas: el código de un vendedor
                  externo, o el código de referido de un tutor amigo. El
                  servidor prueba primero contra vendedores y luego contra
                  tutores — aquí no hace falta distinguirlos. */}
              <label htmlFor="codigo-vendedor" className="block text-sm font-bold text-[#1C5253] mb-1">
                Código de quien te recomendó <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="codigo-vendedor"
                type="text"
                value={codigoVendedor}
                onChange={(e) => setCodigoVendedor(e.target.value.toUpperCase().slice(0, 20))}
                placeholder="si alguien te lo dio"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[#1C5253] uppercase focus:outline-none focus:border-[#1C5253]"
              />
            </div>
          </div>

          {/* ---------------- Total y pago ---------------- */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-4">
            {errorPrecios ? (
              <p className="text-sm text-red-600">{errorPrecios}</p>
            ) : !cuenta ? (
              <p className="text-sm text-gray-400">Calculando…</p>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-500">
                    {cuenta.cantidad} {cuenta.cantidad === 1 ? 'placa' : 'placas'} ×{' '}
                    {pesos(cuenta.unitario)}
                  </span>
                  <span className="text-2xl font-black text-[#1C5253]">
                    {pesos(cuenta.total)}
                  </span>
                </div>
                {cuenta.esMayoreo && (
                  <p className="text-xs text-[#0B7345] font-bold mt-1">
                    Precio de mayoreo aplicado.
                  </p>
                )}
                {hayStock !== null && (
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Clock className="w-4 h-4 text-[#1C5253] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className={`font-bold ${hayStock ? 'text-[#0B7345]' : 'text-[#1C5253]'}`}>
                        {hayStock && cuenta.esPersonalizada && 'La tenemos lista: grabamos el nombre y sale mañana.'}
                        {hayStock && !cuenta.esPersonalizada && 'La tenemos lista: sale hoy o mañana.'}
                        {!hayStock && 'Se hace a mano para ti: queda lista en unos 4 días.'}
                      </p>
                      <p className="text-gray-400 mt-0.5">Más el tiempo de envío a tu ciudad.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || !cuenta || !!errorPrecios}
            className="w-full rounded-xl bg-[#1C5253] text-white font-bold py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#16403f] transition-colors"
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Llevándote a Mercado Pago…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pagar {cuenta ? pesos(cuenta.total) : ''}
              </>
            )}
          </button>

          {/* La otra puerta. Hay gente que no va a meter su tarjeta en un sitio
              que no conoce, y preferimos esa venta por WhatsApp que perderla. */}
          <a
            href={linkCotizar}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl border-2 border-[#1C5253] text-[#1C5253] font-bold py-3 flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Prefiero cotizar por WhatsApp
          </a>

          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            El pago lo procesa Mercado Pago. No guardamos datos de tu tarjeta.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Pedir;