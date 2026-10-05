import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, MessageCircle, ShieldCheck, Clock, Plus, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandHeader from '../components/BrandHeader';
import Placa3D from '../components/Placa3D';
import { COLORES, FORMAS, MAX_NOMBRE, colorPorId, formaPorId } from '../lib/placa';
import {
  obtenerPrecios, calcularTotal, cantidadValida, iniciarPago, textoCotizacion, pesos,
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

  // Un pedido puede llevar varias placas distintas (forma y color). El
  // formulario de arriba edita la placa activa; las demás quedan en la lista.
  const [piezas, setPiezas] = useState([{
    forma: formaInicial,
    color: colorInicial,
    nombreMascota: '',
    cantidad: cantidadValida(params.get('cantidad')),
  }]);
  const [activa, setActiva] = useState(0);
  const { forma, color, nombreMascota, cantidad } = piezas[activa];
  const cambiar = (cambios) => setPiezas((ps) => ps.map((p, i) => (i === activa ? { ...p, ...cambios } : p)));
  const setColor = (c) => cambiar({ color: c });
  const setNombreMascota = (n) => cambiar({ nombreMascota: n });
  const setCantidad = (c) => cambiar({ cantidad: c });
  const agregarPieza = () => {
    setPiezas((ps) => [...ps, { forma, color, nombreMascota: '', cantidad: 1 }]);
    setActiva(piezas.length);
  };
  const quitarPieza = (i) => {
    setPiezas((ps) => ps.filter((_, j) => j !== i));
    setActiva((a) => (a >= i && a > 0 ? a - 1 : a));
  };
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

  // Hay stock solo si alcanza para TODAS las placas del pedido.
  // ponytail: dos líneas iguales (misma forma y color) se revisan por separado.
  const firmaStock = piezas.map((p) => `${p.forma}-${p.color}-${p.cantidad}`).join('|');
  useEffect(() => {
    let vivo = true;
    Promise.all(piezas.map((p) => supabase.rpc('hay_stock', {
      p_forma: p.forma, p_color: p.color, p_cantidad: cantidadValida(p.cantidad),
    }))).then((rs) => {
      if (vivo) setHayStock(rs.some((r) => r.error) ? null : rs.every((r) => r.data === true));
    });
    return () => { vivo = false; };
    // Solo forma/color/cantidad importan: escribir el nombre no debe volver a consultar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaStock]);

  // Al cambiar a una forma que no lleva nombre grabado, el nombre se limpia en
  // el mismo clic. Si no, el cliente pagaría precio de personalizada por una
  // placa donde el nombre no va a aparecer.
  const elegirForma = (f) => {
    cambiar(f.grabaNombre ? { forma: f.id } : { forma: f.id, nombreMascota: '' });
  };

  const cuenta = useMemo(() => calcularTotal(precios, piezas), [precios, piezas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const sinNombre = piezas.findIndex((p) => formaPorId(p.forma).grabaNombre && !p.nombreMascota.trim());
    if (sinNombre >= 0) {
      setActiva(sinNombre);
      return setError('La placa de hueso lleva el nombre de tu mascota: escríbelo arriba.');
    }
    if (!nombreCliente.trim()) return setError('Escribe tu nombre.');
    if (telefono.length !== 10) return setError('El teléfono debe tener 10 dígitos.');
    if (!EMAIL_REGEX.test(email)) {
      return setError('Necesito tu correo para mandarte la confirmación del pedido.');
    }

    setEnviando(true);
    try {
      const { url } = await iniciarPago({
        piezas,
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
    textoCotizacion(piezas.map((p) => ({
      forma: formaPorId(p.forma).nombre,
      color: colorPorId(p.color).nombre,
      cantidad: cantidadValida(p.cantidad),
      nombreMascota: p.nombreMascota,
    }))),
  )}`;

  return (
    <div className="min-h-screen bg-[#F7F9F8] px-4 py-8">
      <title>Pide tu placa | CURPitas</title>
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
                Nombre de tu mascota
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
                Va grabado al frente, máximo {MAX_NOMBRE} letras. La de hueso siempre lleva nombre.
                {precios && (
                  <>
                    {' '}¿Sin nombre? Elige círculo, cuadrado o rectángulo, desde{' '}
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
            {precios && !cuenta?.esMayoreo && !formaActual.grabaNombre && (
              <p className="text-xs text-gray-400 mt-1">
                Desde {precios.mayoreo_desde} piezas sin nombre (puedes mezclar formas y colores)
                bajan a {pesos(precios.mayoreo)} cada una.
              </p>
            )}
            {/* La personalizada no baja de precio por cantidad: cada placa
                lleva su propio nombre grabado a mano. */}
            {precios && formaActual.grabaNombre && (
              <p className="text-xs text-gray-400 mt-1">
                El nombre grabado no entra en precio de mayoreo: cada placa se cobra a{' '}
                {pesos(precios.personalizada)}, sin importar cuántas pidas.
              </p>
            )}
          </div>

          {/* ---------------- Varias placas distintas ----------------
              El formulario de arriba edita la placa marcada; tocar otra de la
              lista la vuelve a cargar arriba (y en el modelo 3D). */}
          <div>
            {piezas.length > 1 && (
              <ul className="space-y-2 mb-3">
                {piezas.map((p, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiva(i)}
                      aria-pressed={i === activa}
                      className={`flex-1 min-w-0 flex items-center gap-2.5 rounded-xl border-2 bg-white px-3 py-2 text-left text-sm transition-colors ${
                        i === activa
                          ? 'border-[#1C5253] text-[#1C5253]'
                          : 'border-gray-200 text-gray-500 hover:border-emerald-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ background: colorPorId(p.color).hex }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-bold">
                        {cantidadValida(p.cantidad)} × {formaPorId(p.forma).nombre}{' '}
                        {colorPorId(p.color).nombre.toLowerCase()}
                        {p.nombreMascota && ` "${p.nombreMascota}"`}
                      </span>
                      {i === activa && (
                        <span className="ml-auto text-[11px] font-normal shrink-0">editando</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => quitarPieza(i)}
                      aria-label={`Quitar placa ${i + 1}`}
                      className="shrink-0 w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={agregarPieza}
              disabled={piezas.length >= 20}
              className="w-full rounded-xl border-2 border-dashed border-emerald-200 text-[#1C5253] text-sm font-bold py-2.5 flex items-center justify-center gap-1.5 hover:bg-emerald-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Agregar otra placa con otra forma o color
            </button>
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
                {cuenta.lineas.length > 1 && (
                  <ul className="text-xs text-gray-500 space-y-1 mb-2 pb-2 border-b border-gray-100">
                    {cuenta.lineas.map((l, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate">
                          {l.cantidad} × {formaPorId(l.forma).nombre}{' '}
                          {colorPorId(l.color).nombre.toLowerCase()} · {pesos(l.unitario)}
                        </span>
                        <span className="shrink-0">{pesos(l.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-500">
                    {cuenta.cantidad} {cuenta.cantidad === 1 ? 'placa' : 'placas'}
                    {cuenta.unitario !== null && ` × ${pesos(cuenta.unitario)}`}
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
                        {hayStock && cuenta.hayPersonalizada && 'La tenemos lista: grabamos el nombre y sale mañana.'}
                        {hayStock && !cuenta.hayPersonalizada && 'La tenemos lista: sale hoy o mañana.'}
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
          <p className="text-center text-xs text-gray-500">
            Al pagar aceptas los{' '}
            <Link to="/terminos-y-condiciones" target="_blank" className="font-bold text-[#1C5253] underline underline-offset-2">
              Términos y Condiciones
            </Link>
            , incluida la política de cambios y devoluciones.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Pedir;