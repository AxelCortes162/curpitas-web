import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Loader2, CheckCircle2, Copy, ClipboardList, Mail, MessageCircle,
} from 'lucide-react';
import { conReintentoDeSesion, esErrorDeSesionVencida, invocarFuncion } from '../supabaseClient';
import { obtenerPrecios, calcularTotal, pesos } from '../lib/pagos';
import { FORMAS, COLORES, MAX_NOMBRE } from '../lib/placa';

// ---------------------------------------------------------------------------
// PEDIDO MANUAL — para cuando alguien compra por WhatsApp o en persona, no en
// línea. Lo llena Esmeralda o Axel. El pedido entra directo como "pagado"
// (ya se cobró aparte, en efectivo o transferencia) y de ahí en adelante es
// un pedido normal: aparece en /admin/producción, y el cliente puede seguirlo
// en /pedido/:id igual que si hubiera pagado con Mercado Pago.
//
// El total se sugiere solo (misma lista de precios que la venta en línea),
// pero es editable — puede haber un trato especial, descuento o cortesía que
// se negoció por WhatsApp, y este formulario no debe pelearse con eso.
//
// El correo es opcional: una venta en persona no siempre trae uno. Si no hay
// correo, el pedido se crea igual y aquí se le muestra a quien lo capturó el
// link de seguimiento para que lo comparta ella misma por WhatsApp.
// ---------------------------------------------------------------------------

const CANALES = [
  { id: 'whatsapp', nombre: 'WhatsApp', nota: 'Pedido por WhatsApp' },
  { id: 'persona', nombre: 'En persona', nota: 'Pedido en persona' },
];

export const PedidoManual = () => {
  const [precios, setPrecios] = useState(null);

  const [forma, setForma] = useState('hueso');
  const [color, setColor] = useState('verde');
  const [cantidad, setCantidad] = useState(1);
  const [nombreMascota, setNombreMascota] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [canal, setCanal] = useState('whatsapp');
  const [notaExtra, setNotaExtra] = useState('');
  const [codigoVendedor, setCodigoVendedor] = useState('');

  const [total, setTotal] = useState('');
  const [totalTocado, setTotalTocado] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null); // { pedido_id, total, correo_enviado, seguimiento }
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    obtenerPrecios().then(setPrecios).catch(() => setPrecios(null));
  }, []);

  const sugerido = useMemo(
    () => calcularTotal(precios, { forma, cantidad, nombreMascota }),
    [precios, forma, cantidad, nombreMascota],
  );

  // Mientras nadie haya tocado el campo de Total a mano, se sigue el precio
  // sugerido en automático conforme cambian forma/cantidad/nombre. En cuanto
  // Esmeralda lo edita una vez, se respeta lo que ella puso — no se le borra
  // solo por cambiar la cantidad después.
  useEffect(() => {
    if (!totalTocado && sugerido) setTotal(String(sugerido.total));
  }, [sugerido, totalTocado]);

  const formaElegida = FORMAS.find((f) => f.id === forma) ?? FORMAS[0];

  const limpiarFormulario = () => {
    setForma('hueso');
    setColor('verde');
    setCantidad(1);
    setNombreMascota('');
    setNombreCliente('');
    setTelefono('');
    setEmail('');
    setCanal('whatsapp');
    setNotaExtra('');
    setCodigoVendedor('');
    setTotal('');
    setTotalTocado(false);
    setResultado(null);
    setError('');
  };

  const validar = () => {
    if (!nombreCliente.trim()) return 'Falta el nombre del cliente.';
    if (telefono.replace(/\D/g, '').length < 10) return 'El teléfono debe traer 10 dígitos.';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'El correo no es válido.';
    const n = Number(total);
    if (!Number.isFinite(n) || n <= 0) return 'El total tiene que ser un número mayor a 0.';
    return '';
  };

  const registrar = async (e) => {
    e.preventDefault();
    const problema = validar();
    if (problema) { setError(problema); return; }

    setEnviando(true);
    setError('');

    const canalElegido = CANALES.find((c) => c.id === canal) ?? CANALES[0];
    const notas = notaExtra.trim() ? `${canalElegido.nota} — ${notaExtra.trim()}` : canalElegido.nota;

    const { data, error: err } = await conReintentoDeSesion(() => invocarFuncion('pedido-manual', {
      forma,
      color,
      cantidad,
      nombre_mascota: nombreMascota.trim(),
      nombre_cliente: nombreCliente.trim(),
      telefono: telefono.replace(/\D/g, ''),
      email: email.trim(),
      total: Number(total),
      notas,
      codigo_vendedor: codigoVendedor.trim(),
    }));

    setEnviando(false);

    if (err) {
      setError(esErrorDeSesionVencida(err)
        ? 'Tu sesión expiró. Recarga la página e intenta de nuevo.'
        : (err.message || 'No se pudo registrar el pedido.'));
      return;
    }

    setResultado(data);
  };

  const copiarLink = async () => {
    if (!resultado?.seguimiento) return;
    try {
      await navigator.clipboard.writeText(resultado.seguimiento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles — el link ya está visible en pantalla
      // para copiarlo a mano, no es un error que valga la pena mostrar.
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#1C5253] mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Admin
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="CURPitas" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-[#1C5253]">Pedido manual</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Para un pedido que se cerró por WhatsApp o en persona — se registra
          igual que uno pagado en línea, y al cliente le llega su link de
          seguimiento.
        </p>

        {resultado ? (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-[#0B7345]" />
            <h2 className="text-lg font-black text-[#1C5253] mt-3">Pedido registrado</h2>
            <p className="text-sm text-gray-500 mt-1">
              {pesos(resultado.total)} · pedido {String(resultado.pedido_id).slice(0, 8).toUpperCase()}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 text-left">
              {resultado.correo_enviado ? (
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#0B7345]">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> Ya se le mandó el correo de confirmación.
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  No se mandó correo (no se capturó uno). Comparte este link con el cliente:
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={resultado.seguimiento}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253] outline-none"
                />
                <button
                  onClick={copiarLink}
                  className="shrink-0 p-2.5 rounded-lg bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253]"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiado && <p className="text-[11px] text-[#0B7345] mt-1">Copiado.</p>}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={limpiarFormulario}
                className="flex-1 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl"
              >
                Registrar otro pedido
              </button>
              <Link
                to="/admin/produccion"
                className="flex-1 py-2.5 bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Ver producción
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={registrar} className="bg-white rounded-2xl border border-emerald-100/80 p-4 space-y-4">
            {/* Canal */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cómo se cerró</p>
              <div className="grid grid-cols-2 gap-2">
                {CANALES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCanal(c.id)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      canal === c.id ? 'bg-[#1C5253] border-[#1C5253] text-white' : 'bg-[#F4F9F8] border-emerald-100 text-[#1C5253]'
                    }`}
                  >
                    {c.id === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5" />}
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Forma y color */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Forma</span>
                <select
                  value={forma}
                  onChange={(e) => setForma(e.target.value)}
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold outline-none focus:border-[#1C5253]"
                >
                  {FORMAS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Color</span>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold outline-none focus:border-[#1C5253]"
                >
                  {COLORES.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </label>
            </div>

            {/* Cantidad y nombre de mascota */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cantidad</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold outline-none focus:border-[#1C5253]"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Nombre mascota {!formaElegida.grabaNombre && '(opcional)'}
                </span>
                <input
                  value={nombreMascota}
                  onChange={(e) => setNombreMascota(e.target.value.slice(0, MAX_NOMBRE))}
                  placeholder={formaElegida.grabaNombre ? 'Se graba en la placa' : 'Sin grabado'}
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
                />
              </label>
            </div>

            {/* Cliente */}
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nombre del cliente</span>
              <input
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Teléfono</span>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  inputMode="numeric"
                  placeholder="10 dígitos"
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Correo (opcional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="si no hay, se deja vacío"
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
                />
              </label>
            </div>

            {/* Total */}
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Total {sugerido && !totalTocado && '(sugerido)'}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={total}
                onChange={(e) => { setTotal(e.target.value); setTotalTocado(true); }}
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold outline-none focus:border-[#1C5253]"
              />
              {sugerido && (
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Precio de lista: {pesos(sugerido.total)}
                  {totalTocado && Number(total) !== sugerido.total && ' — editado a mano'}
                </span>
              )}
            </label>

            {/* Nota extra */}
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nota (opcional)</span>
              <input
                value={notaExtra}
                onChange={(e) => setNotaExtra(e.target.value.slice(0, 200))}
                placeholder="algo que quieras recordar de este pedido"
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
              />
            </label>

            {/* Código de vendedor o de referido — el mismo campo sirve para los
                dos: primero se busca entre vendedores externos, y si no
                coincide, entre los códigos de referido de los tutores. */}
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Código de vendedor o de referido (opcional)
              </span>
              <input
                value={codigoVendedor}
                onChange={(e) => setCodigoVendedor(e.target.value.toUpperCase().slice(0, 20))}
                placeholder="si un vendedor la cerró, o un tutor la recomendó"
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold uppercase outline-none focus:border-[#1C5253]"
              />
            </label>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 bg-[#1C5253] hover:bg-[#164343] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar pedido pagado
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PedidoManual;
