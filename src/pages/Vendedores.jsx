import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Loader2, UserPlus, Copy, CheckCircle2, Ban, Play,
} from 'lucide-react';
import { supabase, conReintentoDeSesion, esErrorDeSesionVencida, invocarFuncion } from '../supabaseClient';
import { formaPorId, colorPorId } from '../lib/placa';
import { pesos } from '../lib/pagos';

// ---------------------------------------------------------------------------
// VENDEDORES EXTERNOS — gente ajena a los 4 socios que ayuda a vender y
// cobra comisión por eso. Aquí Axel/Esmeralda dan de alta a alguien nuevo
// (le crea su login), ven el código y el % de cada quien, y cuánto se le
// debe.
//
// La comisión de un pedido se "libera" hasta que llega a 'entregado' — si se
// cancela en el camino, no hay nada que pagar. "Pagada" es aparte: se marca
// a mano cuando de verdad se le transfirió, con marcar_comision_pagada.
// ---------------------------------------------------------------------------

const CODIGO_OK = /^[A-Z0-9-]{3,20}$/;

const EtiquetaEstado = ({ estado }) => {
  const mapa = {
    pagado: 'Pagado', en_produccion: 'En producción', listo: 'Lista para enviar',
    enviado: 'Enviada', entregado: 'Entregada',
  };
  return <span>{mapa[estado] ?? estado}</span>;
};

export const Vendedores = () => {
  const [vendedores, setVendedores] = useState([]);
  const [resumen, setResumen] = useState({});
  const [pedidosPorVendedor, setPedidosPorVendedor] = useState({});
  const [cargando, setCargando] = useState(true);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [comisionPct, setComisionPct] = useState('10');
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [creado, setCreado] = useState(null); // { email, codigo, password_temporal }
  const [copiado, setCopiado] = useState(false);

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    const [{ data: vs, error: eV }, { data: res, error: eR }, { data: peds, error: eP }] = await Promise.all([
      conReintentoDeSesion(() => supabase.from('vendedores').select('*').order('creado_en', { ascending: false })),
      conReintentoDeSesion(() => supabase.rpc('resumen_vendedores')),
      conReintentoDeSesion(() => supabase.from('pedidos')
        .select('id, vendedor_id, forma, color, cantidad, total, estado, pagado_en, comision_pct_aplicado, comision_pagada')
        .not('vendedor_id', 'is', null)
        .order('pagado_en', { ascending: true })),
    ]);

    if (!eV) setVendedores(vs || []);
    if (!eR) {
      const mapa = {};
      (res || []).forEach((r) => { mapa[r.vendedor_id] = r; });
      setResumen(mapa);
    }
    if (!eP) {
      const mapa = {};
      (peds || []).forEach((p) => {
        (mapa[p.vendedor_id] ??= []).push(p);
      });
      setPedidosPorVendedor(mapa);
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  const crearVendedor = async (e) => {
    e.preventDefault();
    setErrorForm('');

    const cod = codigo.trim().toUpperCase();
    const pct = Number(comisionPct);
    if (!nombre.trim()) { setErrorForm('Falta el nombre.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorForm('El correo no es válido.'); return; }
    if (!CODIGO_OK.test(cod)) { setErrorForm('El código debe ser de 3 a 20 letras, números o guiones.'); return; }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) { setErrorForm('La comisión debe ser un % entre 0 y 100.'); return; }

    setCreando(true);
    const { data, error: err } = await conReintentoDeSesion(() => invocarFuncion('crear-vendedor', {
      nombre: nombre.trim(), email: email.trim(), codigo: cod, comision_pct: pct,
    }));
    setCreando(false);

    if (err) {
      setErrorForm(esErrorDeSesionVencida(err)
        ? 'Tu sesión expiró. Recarga la página e intenta de nuevo.'
        : (err.message || 'No se pudo crear el vendedor.'));
      return;
    }

    setCreado(data);
    setNombre(''); setEmail(''); setCodigo(''); setComisionPct('10');
    cargarTodo();
  };

  const copiarPassword = async () => {
    if (!creado) return;
    try {
      await navigator.clipboard.writeText(
        `Tu acceso a CURPitas:\nCorreo: ${creado.email}\nContraseña temporal: ${creado.password_temporal}\nEntra en https://curpitas.com/iniciar-sesion`,
      );
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el texto ya está visible para copiarlo a mano */ }
  };

  const alternarActivo = async (v) => {
    await conReintentoDeSesion(() => supabase.from('vendedores').update({ activo: !v.activo }).eq('id', v.id));
    cargarTodo();
  };

  const guardarComision = async (v, nuevoPct) => {
    const n = Math.max(0, Math.min(100, Number(nuevoPct) || 0));
    if (n === v.comision_pct) return;
    await conReintentoDeSesion(() => supabase.from('vendedores').update({ comision_pct: n }).eq('id', v.id));
    cargarTodo();
  };

  const alternarPagada = async (pedido) => {
    await conReintentoDeSesion(() => supabase.rpc('marcar_comision_pagada', {
      p_pedido_id: pedido.id, p_pagada: !pedido.comision_pagada,
    }));
    cargarTodo();
  };

  const totalGeneral = useMemo(() => {
    const acc = { liberada: 0, pendiente: 0, pagada: 0 };
    Object.values(resumen).forEach((r) => {
      acc.liberada += Number(r.comision_liberada) || 0;
      acc.pendiente += Number(r.comision_pendiente) || 0;
      acc.pagada += Number(r.comision_pagada) || 0;
    });
    return acc;
  }, [resumen]);

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
          <h1 className="text-xl font-black text-[#1C5253]">Vendedores</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Gente externa que ayuda a vender por su código. La comisión se
          libera cuando la placa queda entregada.
        </p>

        {/* Resumen general */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Liberada</p>
            <p className="text-sm font-black text-[#1C5253] leading-tight mt-0.5">{pesos(totalGeneral.liberada)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sin liberar</p>
            <p className="text-sm font-black text-[#1C5253] leading-tight mt-0.5">{pesos(totalGeneral.pendiente)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-emerald-100/80">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ya pagada</p>
            <p className="text-sm font-black text-[#0B7345] leading-tight mt-0.5">{pesos(totalGeneral.pagada)}</p>
          </div>
        </div>

        {/* Alta de vendedor */}
        {!mostrarForm && !creado && (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full mb-5 py-3 bg-[#1C5253] hover:bg-[#164343] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Nuevo vendedor
          </button>
        )}

        {mostrarForm && !creado && (
          <form onSubmit={crearVendedor} className="bg-white rounded-2xl border border-emerald-100/80 p-4 space-y-3 mb-5">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Correo (para su login)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Código</span>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 20))}
                  placeholder="ej. ALFONSO10"
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold uppercase outline-none focus:border-[#1C5253]"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Comisión %</span>
                <input
                  type="number" min="0" max="100" step="0.5"
                  value={comisionPct}
                  onChange={(e) => setComisionPct(e.target.value)}
                  className="mt-1 w-full py-2.5 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] font-bold outline-none focus:border-[#1C5253]"
                />
              </label>
            </div>

            {errorForm && <p className="text-xs text-red-500">{errorForm}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creando}
                className="flex-1 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {creando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Crear vendedor
              </button>
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setErrorForm(''); }}
                className="px-4 py-2.5 bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253] text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {creado && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center mb-5">
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#0B7345]" />
            <h2 className="text-base font-black text-[#1C5253] mt-2">Vendedor creado</h2>
            <p className="text-xs text-gray-500 mt-1">
              Cópiale esto y mándaselo por WhatsApp — es la única vez que se muestra la contraseña.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-[#F4F9F8] text-left text-xs text-[#1C5253] font-mono space-y-1">
              <p>Correo: {creado.email}</p>
              <p>Contraseña: <span className="font-bold">{creado.password_temporal}</span></p>
              <p>Código: {creado.codigo}</p>
            </div>
            <button
              onClick={copiarPassword}
              className="mt-3 w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> {copiado ? 'Copiado' : 'Copiar para WhatsApp'}
            </button>
            <button
              onClick={() => { setCreado(null); setMostrarForm(false); }}
              className="mt-2 w-full py-2 text-xs font-bold text-gray-400 hover:text-[#1C5253]"
            >
              Listo, ya se lo mandé
            </button>
          </div>
        )}

        {cargando && <p className="text-xs text-gray-400">Cargando...</p>}

        {!cargando && vendedores.length === 0 && !mostrarForm && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
            <p className="text-sm font-bold text-[#1C5253]">Todavía no hay vendedores</p>
            <p className="text-xs text-gray-400 mt-1">Da de alta al primero arriba.</p>
          </div>
        )}

        <div className="space-y-3">
          {vendedores.map((v) => {
            const r = resumen[v.id] ?? { ventas: 0, total_vendido: 0, comision_liberada: 0, comision_pendiente: 0, comision_pagada: 0 };
            const pedidosV = pedidosPorVendedor[v.id] ?? [];
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-emerald-100/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1C5253]">{v.nombre}</p>
                    <p className="font-mono text-[11px] text-gray-400">{v.codigo}</p>
                  </div>
                  <button
                    onClick={() => alternarActivo(v)}
                    className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                      v.activo ? 'bg-[#F4F9F8] text-[#1C5253]' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {v.activo ? <><Ban className="w-3 h-3" /> Desactivar</> : <><Play className="w-3 h-3" /> Reactivar</>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <label className="block">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Comisión</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="number" min="0" max="100" step="0.5"
                        defaultValue={v.comision_pct}
                        onBlur={(e) => guardarComision(v, e.target.value)}
                        className="w-full py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs font-bold text-[#1C5253] outline-none focus:border-[#1C5253]"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </label>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ventas</span>
                    <p className="text-xs font-bold text-[#1C5253] mt-0.5 py-1.5">
                      {r.ventas} · {pesos(r.total_vendido)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  <div className="py-1.5 rounded-lg bg-[#F4F9F8]">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Liberada</p>
                    <p className="text-[11px] font-bold text-[#1C5253]">{pesos(r.comision_liberada)}</p>
                  </div>
                  <div className="py-1.5 rounded-lg bg-[#F4F9F8]">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Sin liberar</p>
                    <p className="text-[11px] font-bold text-[#1C5253]">{pesos(r.comision_pendiente)}</p>
                  </div>
                  <div className="py-1.5 rounded-lg bg-[#F4F9F8]">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">Pagada</p>
                    <p className="text-[11px] font-bold text-[#0B7345]">{pesos(r.comision_pagada)}</p>
                  </div>
                </div>

                {pedidosV.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    {pedidosV.map((p) => {
                      const comision = Math.round((p.total * p.comision_pct_aplicado / 100) * 100) / 100;
                      const liberada = p.estado === 'entregado';
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-gray-500 truncate">
                            {formaPorId(p.forma).nombre} {colorPorId(p.color).nombre.toLowerCase()} ×{p.cantidad}
                            {' — '}<EtiquetaEstado estado={p.estado} />
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-[#1C5253]">{pesos(comision)}</span>
                            <button
                              onClick={() => alternarPagada(p)}
                              disabled={!liberada}
                              title={liberada ? '' : 'Se libera cuando la placa queda entregada'}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed ${
                                p.comision_pagada ? 'bg-[#0B7345]/10 text-[#0B7345]' : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {p.comision_pagada ? 'Pagada' : 'Pendiente'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Vendedores;
