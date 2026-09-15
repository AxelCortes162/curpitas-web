import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Factory, CheckCircle2, Truck, PartyPopper, ChevronLeft, Loader2, Phone, Mail,
} from 'lucide-react';
import { supabase, conReintentoDeSesion, esErrorDeSesionVencida } from '../supabaseClient';
import { FORMAS, COLORES, formaPorId, colorPorId } from '../lib/placa';

// ---------------------------------------------------------------------------
// PRODUCCIÓN — el panel de Esmeralda: en qué va cada pedido pagado, y cuánto
// hay de inventario suelto.
//
// "Cuántas placas hay en cada etapa" NO se anota a mano: se suma la cantidad
// de los pedidos que están en esa etapa, siempre al día — nunca se puede
// desincronizar porque no hay nada que copiar dos veces. Lo único que
// Esmeralda anota ella misma es el inventario suelto (placas ya hechas, sin
// pedido asignado todavía): eso sí necesita que alguien lo diga, porque no
// sale de ningún pedido.
//
// Avanzar de etapa pasa por la función avanzar_pedido_estado (RPC, solo
// admins), que actualiza pedidos.estado y deja el evento en pedido_eventos
// en la misma transacción — de ahí sale la línea de tiempo que ve el
// cliente en /pedido/:id.
// ---------------------------------------------------------------------------

const ETAPAS = [
  { id: 'pagado', nombre: 'Pagado', siguiente: 'en_produccion', accion: 'Iniciar producción', icono: Package },
  { id: 'en_produccion', nombre: 'En producción', siguiente: 'listo', accion: 'Marcar lista', icono: Factory },
  { id: 'listo', nombre: 'Lista para enviar', siguiente: 'enviado', accion: 'Marcar enviada', icono: CheckCircle2 },
  { id: 'enviado', nombre: 'Enviada', siguiente: 'entregado', accion: 'Marcar entregada', icono: Truck },
  { id: 'entregado', nombre: 'Entregada', siguiente: null, accion: null, icono: PartyPopper },
];

const etapaPorId = (id) => ETAPAS.find((e) => e.id === id) ?? ETAPAS[0];

const FilaPedido = ({ pedido, onCambio }) => {
  const [nota, setNota] = useState('');
  const [mostrarNota, setMostrarNota] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const etapa = etapaPorId(pedido.estado);
  const forma = formaPorId(pedido.forma);
  const color = colorPorId(pedido.color);
  const folio = pedido.id.slice(0, 8).toUpperCase();

  const avanzar = async () => {
    if (!etapa.siguiente) return;
    setProcesando(true);
    setError('');
    const { error: err } = await conReintentoDeSesion(() => supabase.rpc('avanzar_pedido_estado', {
      p_pedido_id: pedido.id,
      p_estado: etapa.siguiente,
      p_nota: nota.trim() || null,
    }));
    setProcesando(false);
    if (err) {
      setError(esErrorDeSesionVencida(err)
        ? 'Tu sesión expiró (por dejar la pestaña abierta mucho tiempo). Recarga la página e intenta de nuevo.'
        : err.message);
      return;
    }
    setNota('');
    setMostrarNota(false);
    onCambio();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-gray-400">{folio}</p>
          <p className="text-sm font-bold text-[#1C5253] mt-0.5">
            {forma.nombre} {color.nombre.toLowerCase()}
            {pedido.nombre_mascota ? ` — "${pedido.nombre_mascota}"` : ''}
            {pedido.cantidad > 1 ? ` × ${pedido.cantidad}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{pedido.nombre_cliente}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
            <a
              href={`https://wa.me/52${pedido.telefono}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#1C5253]"
            >
              <Phone className="w-3 h-3" /> {pedido.telefono}
            </a>
            {pedido.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{pedido.email}</span>
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-[#F4F9F8] text-[#1C5253] whitespace-nowrap">
          {etapa.nombre}
        </span>
      </div>

      {etapa.siguiente && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {mostrarNota && (
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Nota opcional (ej. se atrasó por material)"
              className="w-full mb-2 py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253] outline-none focus:border-[#1C5253]"
            />
          )}
          {error && <p className="text-[11px] text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={avanzar}
              disabled={procesando}
              className="flex-1 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {procesando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {etapa.accion}
            </button>
            {!mostrarNota && (
              <button
                onClick={() => setMostrarNota(true)}
                className="px-3 py-2.5 bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253] text-xs font-bold rounded-xl shrink-0"
              >
                + Nota
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Una celda editable del inventario suelto. Guarda al perder el foco (o con
// Enter), no en cada tecla — así no hay una llamada a la base por cada dígito.
const CeldaInventario = ({ forma, color, cantidad, onGuardar }) => {
  const [valor, setValor] = useState(String(cantidad));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setValor(String(cantidad)), [cantidad]);

  const guardar = async () => {
    const n = Math.max(0, parseInt(valor, 10) || 0);
    if (n === cantidad) return;
    setGuardando(true);
    await onGuardar(forma, color, n);
    setGuardando(false);
  };

  return (
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      disabled={guardando}
      className="w-full text-center py-1.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs font-bold text-[#1C5253] outline-none focus:border-[#1C5253] disabled:opacity-50"
    />
  );
};

export const Produccion = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [inventario, setInventario] = useState({});

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    const { data, error } = await conReintentoDeSesion(() => supabase
      .from('pedidos')
      .select('id, forma, color, nombre_mascota, cantidad, nombre_cliente, telefono, email, estado, pagado_en, creado_en')
      .in('estado', ['pagado', 'en_produccion', 'listo', 'enviado', 'entregado'])
      .order('pagado_en', { ascending: true }));
    if (!error) setPedidos(data || []);
    setCargando(false);
  }, []);

  const cargarInventario = useCallback(async () => {
    const { data } = await conReintentoDeSesion(() => supabase.from('inventario_placas').select('forma, color, cantidad'));
    const mapa = {};
    (data || []).forEach((r) => { mapa[`${r.forma}-${r.color}`] = r.cantidad; });
    setInventario(mapa);
  }, []);

  useEffect(() => {
    cargarPedidos();
    cargarInventario();
  }, [cargarPedidos, cargarInventario]);

  const guardarInventario = async (forma, color, cantidad) => {
    const { error } = await conReintentoDeSesion(() => supabase.from('inventario_placas').upsert(
      { forma, color, cantidad, actualizado_en: new Date().toISOString() },
      { onConflict: 'forma,color' },
    ));
    if (error) {
      // Si de plano no se pudo (p.ej. la sesión ya ni se pudo renovar), no
      // dejamos el número editado en pantalla como si sí se hubiera guardado.
      cargarInventario();
      return;
    }
    setInventario((prev) => ({ ...prev, [`${forma}-${color}`]: cantidad }));
  };

  // Conteo automático: pedidos y placas (suma de cantidad) por etapa. Nunca
  // hay que anotarlo — sale de los mismos pedidos que ya se están viendo.
  const resumen = useMemo(() => {
    const porEtapa = {};
    ETAPAS.forEach((e) => { porEtapa[e.id] = { pedidos: 0, placas: 0 }; });
    pedidos.forEach((p) => {
      if (!porEtapa[p.estado]) return;
      porEtapa[p.estado].pedidos += 1;
      porEtapa[p.estado].placas += p.cantidad;
    });
    return porEtapa;
  }, [pedidos]);

  const totalInventario = useMemo(
    () => Object.values(inventario).reduce((acc, n) => acc + n, 0),
    [inventario],
  );

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtro);

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
          <h1 className="text-xl font-black text-[#1C5253]">Producción</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Pedidos pagados, en qué etapa van, y cuántas placas hay listas.
        </p>

        {/* Resumen por etapa — doble como filtro: tócalo para ver solo esas */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {ETAPAS.map((e) => (
            <button
              key={e.id}
              onClick={() => setFiltro((f) => (f === e.id ? 'todos' : e.id))}
              className={`text-left p-3 rounded-2xl border transition-colors ${
                filtro === e.id ? 'bg-[#1C5253] border-[#1C5253]' : 'bg-white border-emerald-100/80'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wide ${filtro === e.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                {e.nombre}
              </p>
              <p className={`text-lg font-black leading-tight ${filtro === e.id ? 'text-white' : 'text-[#1C5253]'}`}>
                {resumen[e.id]?.placas ?? 0} <span className="text-xs font-bold">placas</span>
              </p>
              <p className={`text-[10px] ${filtro === e.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                {resumen[e.id]?.pedidos ?? 0} pedido{resumen[e.id]?.pedidos === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>

        {cargando && <p className="text-xs text-gray-400">Cargando...</p>}

        {!cargando && pedidosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center mb-6">
            <p className="text-sm font-bold text-[#1C5253]">No hay pedidos aquí</p>
            <p className="text-xs text-gray-400 mt-1">
              {filtro === 'todos' ? 'Nada pagado todavía.' : 'Prueba otra etapa.'}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-8">
          {pedidosFiltrados.map((p) => (
            <FilaPedido key={p.id} pedido={p} onCambio={cargarPedidos} />
          ))}
        </div>

        {/* Inventario suelto */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Inventario suelto
          </p>
          <p className="text-[11px] font-bold text-[#1C5253]">{totalInventario} placas</p>
        </div>
        <p className="text-[11px] text-gray-400 mb-2">
          Placas ya hechas, sin pedido asignado todavía. Esto sí lo anotas tú.
        </p>
        <div className="bg-white rounded-2xl border border-emerald-100/80 p-3 mb-6 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] text-gray-400 font-bold pb-2 pr-2">Forma</th>
                {COLORES.map((c) => (
                  <th key={c.id} className="text-center text-[10px] text-gray-400 font-bold pb-2 px-1 whitespace-nowrap">
                    {c.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORMAS.map((f) => (
                <tr key={f.id}>
                  <td className="text-[11px] font-bold text-[#1C5253] pr-2 py-1 whitespace-nowrap">{f.nombre}</td>
                  {COLORES.map((c) => (
                    <td key={c.id} className="px-1 py-1 w-14">
                      <CeldaInventario
                        forma={f.id}
                        color={c.id}
                        cantidad={inventario[`${f.id}-${c.id}`] ?? 0}
                        onGuardar={guardarInventario}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Produccion;
