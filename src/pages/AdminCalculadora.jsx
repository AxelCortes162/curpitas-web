import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/* ------------------------------------------------------------------ *
 * Calculadora de unidad económica y reparto.
 *
 * A diferencia de la versión de escritorio, la configuración vive en
 * Supabase (app_config, clave "calculadora"), así que los cuatro ven los
 * mismos números. El guardado es explícito a propósito: si fuera automático,
 * lo que uno teclea sobrescribiría lo que otro está leyendo.
 * ------------------------------------------------------------------ */

const CLAVE = 'calculadora';

const MATERIALES = [
  ['m_resina', 'Resina'],
  ['m_vinil', 'Vinil'],
  ['m_impresion', 'Impresión'],
  ['m_argolla', 'Argolla'],
  ['m_blister', 'Blíster / empaque'],
  ['m_credencial', 'Credencial impresa'],
  ['m_nfc', 'Chip NFC'],
  ['m_otros', 'Otros insumos'],
];

const FIJOS = [
  ['f_publicidad', 'Publicidad'],
  ['f_hosting', 'Hosting y dominio'],
  ['f_herramientas', 'Herramientas y software'],
  ['f_otros', 'Otros fijos'],
];

const COLORES_LINEA = ['#1C5253', '#6BB98A', '#C08A3E'];

const POR_DEFECTO = {
  tiers: [
    { nombre: 'Personalizada', desc: 'Con nombre y diseño', precio: 200, piezas: 40, tarjetaPct: 70 },
    { nombre: 'Sencilla', desc: 'Menudeo, venta directa', precio: 150, piezas: 70, tarjetaPct: 50 },
    { nombre: 'Sencilla mayoreo', desc: 'Veterinarias y tiendas', precio: 90, piezas: 150, tarjetaPct: 20 },
  ],
  m_resina: 1, m_vinil: 1, m_impresion: 0.5, m_argolla: 10.5,
  m_blister: 12, m_credencial: 0, m_nfc: 1.15, m_otros: 0,
  comisionPct: 4,
  f_publicidad: 200, f_hosting: 17, f_herramientas: 100, f_otros: 0,
  donativos: 0,
  reinvPct: 30, empresaPct: 10, fiscalPct: 15,
  socios: [
    { nombre: 'Axel Cortés', rol: 'Producto y sistema', pct: 50, sueldo: 0, comPct: 0, comPiezas: 0, comTier: 1, enReparto: true },
    { nombre: 'Esmeralda González', rol: 'Producción', pct: 30, sueldo: 0, comPct: 0, comPiezas: 0, comTier: 1, enReparto: true },
    { nombre: 'Ramsés Cuayahui', rol: 'Comunicación', pct: 20, sueldo: 0, comPct: 0, comPiezas: 0, comTier: 1, enReparto: true },
    { nombre: 'Alfonso Rodea', rol: 'Ventas y alianzas', pct: 0, sueldo: 0, comPct: 20, comPiezas: 150, comTier: 2, enReparto: false },
  ],
};

/* ---------- formato ---------- */
const mx = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const mx2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n) => mx.format(Math.round(n || 0));
const money2 = (n) => mx2.format(n || 0);
const pctTxt = (n) => `${(Math.round((n || 0) * 10) / 10).toLocaleString('es-MX')} %`;

/* ---------- el cálculo ---------- */
function calcular(S) {
  const base = MATERIALES.reduce((a, [k]) => a + (Number(S[k]) || 0), 0);

  const lineas = S.tiers.map((t) => {
    // Solo la parte que se cobra con tarjeta paga comisión de pasarela. El
    // método de pago varía venta por venta, no por producto.
    const com = t.precio * (S.comisionPct / 100) * ((Number(t.tarjetaPct) || 0) / 100);
    const costo = base + com;
    const deja = t.precio - costo;
    return {
      t, costo, deja,
      margen: t.precio > 0 ? (deja / t.precio) * 100 : 0,
      ingreso: t.precio * t.piezas,
      utilidad: deja * t.piezas,
      piezas: Number(t.piezas) || 0,
    };
  });

  const ingresos = lineas.reduce((a, l) => a + l.ingreso, 0);
  const bruta = lineas.reduce((a, l) => a + l.utilidad, 0);
  const piezas = lineas.reduce((a, l) => a + l.piezas, 0);
  const cogs = ingresos - bruta;
  const fijos = FIJOS.reduce((a, [k]) => a + (Number(S[k]) || 0), 0);

  const pagos = S.socios.map((s) => {
    const li = Math.min(Math.max(0, Number(s.comTier) || 0), S.tiers.length - 1);
    const dejaLinea = Math.max(0, lineas[li].deja);
    const comision = (Number(s.comPiezas) || 0) * dejaLinea * ((Number(s.comPct) || 0) / 100);
    const sueldo = Number(s.sueldo) || 0;
    return { sueldo, comision, cobra: sueldo + comision, dejaLinea, li };
  });

  const sueldos = pagos.reduce((a, p) => a + p.sueldo, 0);
  const comisiones = pagos.reduce((a, p) => a + p.comision, 0);
  const operativa = bruta - fijos - sueldos - comisiones;

  const pos = Math.max(0, operativa);
  const reinv = pos * (S.reinvPct / 100);
  const empresa = pos * (S.empresaPct / 100);
  const fiscal = pos * (S.fiscalPct / 100);
  const repartible = operativa - reinv - empresa - fiscal;

  const dejaProm = piezas > 0 ? bruta / piezas : 0;
  const comProm = piezas > 0 ? comisiones / piezas : 0;
  const contrib = dejaProm - comProm;

  return {
    base, lineas, pagos, ingresos, bruta, cogs, piezas, fijos, sueldos, comisiones,
    operativa, reinv, empresa, fiscal, repartible,
    dejaProm, precioProm: piezas > 0 ? ingresos / piezas : 0,
    margenProm: ingresos > 0 ? (bruta / ingresos) * 100 : 0,
    equilibrio: contrib > 0 ? Math.ceil((fijos + sueldos) / contrib) : Infinity,
    fondoProduccion: reinv + (Number(S.donativos) || 0),
  };
}

/* ---------- piezas de UI ---------- */
const Num = ({ value, onChange, prefijo = '$', ancho = 'w-24', paso = 0.5, min }) => (
  <div className="relative inline-block">
    {prefijo && (
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 pointer-events-none font-mono">
        {prefijo}
      </span>
    )}
    <input
      type="number"
      step={paso}
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      className={`${ancho} ${prefijo ? 'pl-5' : 'pl-2'} pr-2 py-1.5 text-right font-mono text-[13px] tabular-nums rounded-lg border border-emerald-100 bg-[#F4F9F8] text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]`}
    />
  </div>
);

const Pct = ({ value, onChange, ancho = 'w-20' }) => (
  <div className="relative inline-block">
    <input
      type="number"
      step={1}
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
      className={`${ancho} pl-2 pr-5 py-1.5 text-right font-mono text-[13px] tabular-nums rounded-lg border border-emerald-100 bg-[#F4F9F8] text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]`}
    />
    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 pointer-events-none font-mono">%</span>
  </div>
);

const Panel = ({ titulo, nota, children, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-emerald-100/70 shadow-sm ${className}`}>
    <div className="px-4 pt-4">
      <h2 className="font-black text-[#1C5253] text-[15px]">{titulo}</h2>
      {nota && <p className="text-[11.5px] text-gray-400 mt-0.5 leading-snug">{nota}</p>}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

/* ================================================================== */
export const AdminCalculadora = () => {
  const { user } = useAuth();
  const [S, setS] = useState(POR_DEFECTO);
  const [original, setOriginal] = useState(POR_DEFECTO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [activadas, setActivadas] = useState(null);

  const sucio = useMemo(() => JSON.stringify(S) !== JSON.stringify(original), [S, original]);
  const r = useMemo(() => calcular(S), [S]);

  /* ---------- carga ---------- */
  useEffect(() => {
    let vivo = true;

    (async () => {
      const { data, error: errCfg } = await supabase
        .from('app_config')
        .select('datos, updated_at, updated_by')
        .eq('clave', CLAVE)
        .maybeSingle();

      if (!vivo) return;

      if (errCfg) {
        setError('No se pudo leer la configuración: ' + errCfg.message);
      } else if (data?.datos && Object.keys(data.datos).length > 0) {
        // Mezclamos con los valores por defecto para que los campos nuevos
        // que se agreguen después no queden vacíos.
        const mezclado = { ...POR_DEFECTO, ...data.datos };
        setS(mezclado);
        setOriginal(mezclado);
        setMeta({ updated_at: data.updated_at, updated_by: data.updated_by });
      }

      setCargando(false);
    })();

    // Referencia útil: cuántas placas hay realmente activadas hoy.
    supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .not('owner_id', 'is', null)
      .then(({ count }) => { if (vivo && typeof count === 'number') setActivadas(count); });

    return () => { vivo = false; };
  }, []);

  /* ---------- guardar ---------- */
  const guardar = async () => {
    setGuardando(true);
    setError('');
    setMensaje('');

    const { error: errGuardar } = await supabase.from('app_config').upsert(
      { clave: CLAVE, datos: S, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'clave' },
    );

    setGuardando(false);

    if (errGuardar) {
      setError('No se pudo guardar: ' + errGuardar.message);
      return;
    }

    setOriginal(S);
    setMeta({ updated_at: new Date().toISOString(), updated_by: user.id });
    setMensaje('Configuración guardada. Los cuatro van a ver estos números.');
    setTimeout(() => setMensaje(''), 4000);
  };

  /* ---------- helpers de edición ---------- */
  const set = useCallback((k, v) => setS((p) => ({ ...p, [k]: v })), []);

  const setTier = useCallback((i, campo, v) => {
    setS((p) => {
      const tiers = p.tiers.map((t, j) => (j === i ? { ...t, [campo]: v } : t));
      return { ...p, tiers };
    });
  }, []);

  const setSocio = useCallback((i, campo, v) => {
    setS((p) => {
      const socios = p.socios.map((s, j) => (j === i ? { ...s, [campo]: v } : s));
      return { ...p, socios };
    });
  }, []);

  const sumaPct = S.socios.reduce((a, s) => a + (s.enReparto ? Number(s.pct) || 0 : 0), 0);
  const parteDe = (s) =>
    s.enReparto && r.repartible > 0 && sumaPct > 0 ? r.repartible * ((Number(s.pct) || 0) / sumaPct) : 0;

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center">
        <p className="text-sm text-gray-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando la configuración...
        </p>
      </div>
    );
  }

  const brutaPositiva = r.lineas.reduce((a, l) => a + Math.max(0, l.utilidad), 0);

  /* ---------- cascada ---------- */
  const cascada = [
    { n: 'Venta del mes', v: r.ingresos, tipo: 'sub', s: '' },
    { n: 'Material, empaque y comisiones de pasarela', v: -r.cogs, tipo: 'out', s: '−' },
    { n: 'Utilidad bruta', v: r.bruta, tipo: 'sub', s: '=' },
    { n: 'Costos fijos', v: -r.fijos, tipo: 'out', s: '−' },
    ...(r.sueldos > 0 ? [{ n: 'Sueldos fijos', v: -r.sueldos, tipo: 'out', s: '−' }] : []),
    { n: 'Comisiones por venta', v: -r.comisiones, tipo: 'out', s: '−' },
    { n: 'Utilidad operativa', v: r.operativa, tipo: 'sub', s: '=' },
    { n: `Reinversión en material (${pctTxt(S.reinvPct)})`, v: -r.reinv, tipo: 'out', s: '−' },
    { n: `Fondo de la empresa (${pctTxt(S.empresaPct)})`, v: -r.empresa, tipo: 'out', s: '−' },
    { n: `Apartado fiscal (${pctTxt(S.fiscalPct)})`, v: -r.fiscal, tipo: 'out', s: '−' },
  ];
  const escala = Math.max(r.ingresos, 1);

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 pb-24 font-sans antialiased">
      <div className="max-w-5xl mx-auto">

        {/* encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[#1C5253] mb-1"
            >
              <ArrowLeft className="w-3 h-3" /> Volver al panel
            </Link>
            <h1 className="text-2xl font-black text-[#1C5253] tracking-tight">Números de CURPitas</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Estos números los ven los cuatro. Lo que guardes aquí es la versión oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sucio && (
              <button
                onClick={() => setS(original)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-100 bg-white text-[12px] font-bold text-gray-500 hover:text-[#1C5253]"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Descartar
              </button>
            )}
            <button
              onClick={guardar}
              disabled={guardando || !sucio}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black text-[13px] disabled:opacity-50"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {guardando ? 'Guardando...' : sucio ? 'Guardar cambios' : 'Guardado'}
            </button>
          </div>
        </div>

        {sucio && (
          <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800">
              Tienes cambios sin guardar. Los demás siguen viendo los números anteriores hasta que
              le des a guardar.
            </p>
          </div>
        )}
        {mensaje && (
          <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[12px] text-emerald-800">{mensaje}</p>
          </div>
        )}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}

        {/* resumen */}
        <div className="bg-[#1C5253] rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 shadow-lg">
          {[
            ['Venta del mes', money(r.ingresos), `${r.piezas.toLocaleString('es-MX')} piezas · margen ${pctTxt(r.margenProm)}`],
            ['Utilidad repartible', money(r.repartible), r.repartible > 0 ? 'después de fondos y fiscal' : 'no alcanza para repartir', true],
            ['Pago por trabajo', money(r.sueldos + r.comisiones), `${money(r.sueldos)} fijo · ${money(r.comisiones)} variable`],
            ['Fondos apartados', money(r.fondoProduccion + r.empresa), 'producción + empresa'],
          ].map(([k, v, n, hero]) => (
            <div key={k} className="min-w-0">
              <p className="text-[9.5px] font-mono uppercase tracking-widest text-[#9FC9BF]">{k}</p>
              <p className={`font-black text-xl tracking-tight tabular-nums ${hero ? 'text-[#88D49E]' : 'text-[#EAF6F1]'}`}>{v}</p>
              <p className="text-[10.5px] text-[#8FBBB2] mt-0.5">{n}</p>
            </div>
          ))}
        </div>

        {/* líneas de producto */}
        <Panel
          titulo="Las tres líneas"
          nota="La placa es la misma en las tres líneas y cuesta lo mismo producirla; lo que cambia es el precio. El % con tarjeta es qué tanto de esa línea se cobra con tarjeta en vez de efectivo o transferencia — solo esa parte paga comisión."
          className="mb-4"
        >
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400">
                  <th className="text-left pb-2 font-medium">Línea</th>
                  <th className="text-right pb-2 font-medium">Precio</th>
                  <th className="text-right pb-2 font-medium">Piezas</th>
                  <th className="text-right pb-2 font-medium">% con tarjeta</th>
                  <th className="text-right pb-2 font-medium">Costo</th>
                  <th className="text-right pb-2 font-medium">Deja</th>
                  <th className="text-right pb-2 font-medium">Margen</th>
                  <th className="text-right pb-2 font-medium">Del mes</th>
                </tr>
              </thead>
              <tbody>
                {r.lineas.map((l, i) => (
                  <tr key={i} className="border-t border-emerald-100/80">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-6 rounded-sm shrink-0" style={{ background: COLORES_LINEA[i] }} />
                        <div className="min-w-0">
                          <input
                            value={l.t.nombre}
                            onChange={(e) => setTier(i, 'nombre', e.target.value.slice(0, 30))}
                            className="w-40 px-1.5 py-1 text-[13px] font-bold text-[#1C5253] rounded-md border border-transparent hover:border-emerald-100 focus:border-[#88D49E] focus:outline-none bg-transparent"
                          />
                          <p className="text-[10.5px] text-gray-400 px-1.5">{l.t.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right"><Num value={l.t.precio} onChange={(v) => setTier(i, 'precio', v)} paso={5} min={0} /></td>
                    <td className="py-2 text-right pl-2"><Num value={l.t.piezas} onChange={(v) => setTier(i, 'piezas', v)} prefijo="" ancho="w-20" paso={1} min={0} /></td>
                    <td className="py-2 text-right pl-2">
                      <Pct value={l.t.tarjetaPct} onChange={(v) => setTier(i, 'tarjetaPct', v)} />
                    </td>
                    <td className="py-2 text-right pl-3 font-mono tabular-nums text-gray-400">{money2(l.costo)}</td>
                    <td className={`py-2 text-right pl-3 font-mono tabular-nums font-semibold ${l.deja >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{money2(l.deja)}</td>
                    <td className={`py-2 text-right pl-3 font-mono tabular-nums ${l.margen >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pctTxt(l.margen)}</td>
                    <td className="py-2 text-right pl-3 font-mono tabular-nums text-[#1C5253] font-semibold">{money(l.utilidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mezcla */}
          <div className="mt-4 space-y-3">
            {[
              ['Reparto de las piezas', r.lineas.map((l) => l.piezas), r.piezas, `${r.piezas.toLocaleString('es-MX')} piezas`],
              ['Reparto de la utilidad', r.lineas.map((l) => l.utilidad), brutaPositiva, money(r.bruta)],
            ].map(([titulo, vals, total, derecha]) => (
              <div key={titulo}>
                <div className="flex justify-between text-[9.5px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  <span>{titulo}</span><span>{derecha}</span>
                </div>
                <div className="flex h-3.5 rounded-md overflow-hidden bg-emerald-50 gap-px">
                  {vals.map((v, i) => (
                    <span
                      key={i}
                      className="transition-all"
                      style={{ width: `${total > 0 ? (Math.max(0, v) / total) * 100 : 0}%`, background: COLORES_LINEA[i] }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11.5px] text-gray-400 mt-3 leading-snug">
            Punto de equilibrio:{' '}
            {Number.isFinite(r.equilibrio) ? (
              <>
                <strong className="text-[#1C5253]">{r.equilibrio.toLocaleString('es-MX')} piezas al mes</strong> para
                cubrir costos fijos y pago fijo.
              </>
            ) : (
              'cada pieza se vende por debajo de su costo.'
            )}
            {activadas !== null && (
              <> Hoy hay <strong className="text-[#1C5253]">{activadas}</strong> placas activadas en total.</>
            )}
          </p>
        </Panel>

        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">

          {/* ---------- costos ---------- */}
          <div className="space-y-4">
            <Panel titulo="Material por pieza" nota={`${money2(r.base)} por pieza`}>
              <div className="space-y-2">
                {MATERIALES.map(([k, etiqueta]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-gray-600">{etiqueta}</span>
                    <Num value={S[k]} onChange={(v) => set(k, v)} />
                  </div>
                ))}
                <div className="pt-1 border-t border-emerald-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-gray-600">Comisión de pasarela</span>
                    <Pct value={S.comisionPct} onChange={(v) => set('comisionPct', v)} />
                  </div>
                  <p className="text-[10.5px] text-gray-400 leading-snug mt-1">
                    Lo que cobra la pasarela por cada pago con tarjeta. Cuánto se paga así lo
                    defines línea por línea arriba.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel titulo="Costos fijos al mes" nota={`${money(r.fijos)} al mes`}>
              <div className="space-y-2">
                {FIJOS.map(([k, etiqueta]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-gray-600">{etiqueta}</span>
                    <Num value={S[k]} onChange={(v) => set(k, v)} paso={10} min={0} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3 leading-snug">
                Los sueldos no van aquí: viven en la tabla de pago por trabajo.
              </p>
            </Panel>

            <Panel titulo="Donativos" nota="No se reparten: van completos al fondo de producción.">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-gray-600">Recibidos al mes</span>
                <Num value={S.donativos} onChange={(v) => set('donativos', v)} paso={100} min={0} />
              </div>
            </Panel>

            <Panel titulo="Antes de repartir">
              <div className="space-y-3">
                {[
                  ['reinvPct', 'Reinversión en material', 'Repone el material que ya se vendió.'],
                  ['empresaPct', 'Fondo de la empresa', 'Capital para crecer: herramientas, ferias, contador, colchón.'],
                  ['fiscalPct', 'Apartado fiscal', 'Lo que se reserva para impuestos.'],
                ].map(([k, etiqueta, nota]) => (
                  <div key={k}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-gray-600">{etiqueta}</span>
                      <Pct value={S[k]} onChange={(v) => set(k, v)} />
                    </div>
                    <input
                      type="range" min={0} max={60} step={1} value={S[k]}
                      onChange={(e) => set(k, parseFloat(e.target.value))}
                      className="w-full mt-1 accent-[#1C5253]"
                    />
                    <p className="text-[10.5px] text-gray-400 leading-snug">{nota}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* ---------- resultados ---------- */}
          <div className="space-y-4">

            <Panel titulo="La cascada del mes" nota="El dinero baja en orden. Lo que se reparte es el último escalón.">
              <div>
                {cascada.map((row, i) => {
                  const w = Math.min(100, (Math.abs(row.v) / escala) * 100);
                  const esSub = row.tipo === 'sub';
                  return (
                    <div
                      key={i}
                      className={`py-2 ${esSub ? 'bg-[#F4F9F8] -mx-4 px-4 border-y border-emerald-100' : 'border-b border-dashed border-emerald-100/80'}`}
                    >
                      <div className="flex justify-between items-baseline gap-3">
                        <span className={`text-[13px] flex items-center gap-2 min-w-0 ${esSub ? 'font-bold text-[#1C5253]' : 'text-gray-500'}`}>
                          <span className="font-mono text-[11px] w-2.5 shrink-0 text-gray-300">{row.s}</span>
                          {row.n}
                        </span>
                        <span className={`font-mono text-[13.5px] tabular-nums whitespace-nowrap ${row.tipo === 'out' ? 'text-[#A9543D]' : 'text-[#1C5253] font-semibold'}`}>
                          {row.v < 0 ? '−' : ''}{money(Math.abs(row.v))}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-emerald-50 mt-1.5 overflow-hidden">
                        <span
                          className="block h-full rounded-full transition-all"
                          style={{ width: `${w}%`, background: row.tipo === 'out' ? '#A9543D' : '#1C5253' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="-mx-4 -mb-4 mt-3 px-4 py-4 bg-[#1C5253] rounded-b-2xl">
                <p className="text-[9.5px] font-mono uppercase tracking-widest text-[#A6D0C6]">Utilidad repartible</p>
                <p className="font-black text-3xl text-[#88D49E] tracking-tight tabular-nums">{money(r.repartible)}</p>
              </div>
            </Panel>

            <div className="grid sm:grid-cols-2 gap-4">
              <Panel titulo="Fondo de producción">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-gray-500">Reinversión</span><span className="font-mono tabular-nums">{money(r.reinv)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Donativos</span><span className="font-mono tabular-nums">{money(Number(S.donativos) || 0)}</span></div>
                  <div className="flex justify-between pt-1.5 border-t border-emerald-100 font-bold text-[#1C5253]">
                    <span>Para material</span><span className="font-mono tabular-nums">{money(r.fondoProduccion)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-snug">
                  {r.base > 0
                    ? `Alcanza para material de unas ${Math.floor(r.fondoProduccion / r.base).toLocaleString('es-MX')} placas.`
                    : 'Falta capturar el costo de material.'}
                </p>
              </Panel>

              <Panel titulo="Fondo de la empresa">
                <p className="font-black text-2xl text-[#4F7EA8] tracking-tight tabular-nums">{money(r.empresa)}</p>
                <p className="text-[11px] text-gray-400 mt-2 leading-snug">
                  No es para reponer material. Acuerden en qué se puede gastar y quién decide, o va a
                  parecer dinero de alguien.
                </p>
              </Panel>
            </div>

            <Panel
              titulo="Pago por trabajo"
              nota="Quien cobra por comisión va aquí. Se calcula sobre lo que deja cada pieza que esa persona cierra, y sale antes del reparto."
            >
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full min-w-[600px] text-[13px]">
                  <thead>
                    <tr className="text-[9.5px] font-mono uppercase tracking-wider text-gray-400">
                      <th className="text-left pb-2 font-medium">Persona</th>
                      <th className="text-right pb-2 font-medium">Sueldo</th>
                      <th className="text-right pb-2 font-medium">Comisión</th>
                      <th className="text-right pb-2 font-medium">Piezas</th>
                      <th className="text-left pb-2 pl-3 font-medium">Línea</th>
                      <th className="text-right pb-2 font-medium">Cobra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {S.socios.map((s, i) => (
                      <tr key={i} className="border-t border-emerald-100/80">
                        <td className="py-2 pr-3">
                          <p className="font-bold text-[#1C5253] text-[13px]">{s.nombre}</p>
                          <p className="text-[10.5px] text-gray-400">{s.rol}</p>
                        </td>
                        <td className="py-2 text-right"><Num value={s.sueldo} onChange={(v) => setSocio(i, 'sueldo', v)} paso={250} min={0} /></td>
                        <td className="py-2 text-right pl-2"><Pct value={s.comPct} onChange={(v) => setSocio(i, 'comPct', v)} /></td>
                        <td className="py-2 text-right pl-2"><Num value={s.comPiezas} onChange={(v) => setSocio(i, 'comPiezas', v)} prefijo="" ancho="w-20" paso={1} min={0} /></td>
                        <td className="py-2 pl-3">
                          <select
                            value={s.comTier}
                            onChange={(e) => setSocio(i, 'comTier', parseInt(e.target.value, 10))}
                            className="text-[12px] py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-[#1C5253] max-w-[140px]"
                          >
                            {S.tiers.map((t, j) => <option key={j} value={j}>{t.nombre}</option>)}
                          </select>
                        </td>
                        <td className="py-2 text-right pl-3 font-black text-[#1C5253] tabular-nums">{money(r.pagos[i].cobra)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              titulo="Lo que se lleva cada quien"
              nota="Desmarca a quien cobre solo por comisión: su porcentaje se va a cero y el reparto se divide entre los que quedan."
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {S.socios.map((s, i) => {
                  const rep = parteDe(s);
                  const total = r.pagos[i].sueldo + r.pagos[i].comision + rep;
                  const maxTotal = Math.max(
                    ...S.socios.map((o, j) => r.pagos[j].sueldo + r.pagos[j].comision + parteDe(o)), 1,
                  );
                  const tramos = [
                    [r.pagos[i].sueldo, '#8AA6A1', 'Sueldo'],
                    [r.pagos[i].comision, '#C08A3E', 'Comisión'],
                    [rep, '#1C5253', 'Reparto'],
                  ];
                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-3 border ${s.enReparto ? 'border-emerald-100 bg-[#F4F9F8]' : 'border-dashed border-[#C08A3E]/60 bg-white'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={s.nombre}
                          onChange={(e) => setSocio(i, 'nombre', e.target.value.slice(0, 30))}
                          className="flex-1 min-w-0 px-1.5 py-1 text-[13px] font-bold text-[#1C5253] rounded-md border border-transparent hover:border-emerald-100 focus:border-[#88D49E] focus:outline-none bg-transparent"
                        />
                        <Pct
                          value={s.pct}
                          onChange={(v) => setSocio(i, 'pct', v)}
                          ancho="w-16"
                        />
                      </div>

                      <label className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={s.enReparto}
                          onChange={(e) => {
                            const marcado = e.target.checked;
                            setSocio(i, 'enReparto', marcado);
                            if (!marcado) setSocio(i, 'pct', 0);
                          }}
                          className="w-3.5 h-3.5 accent-[#1C5253]"
                        />
                        Entra al reparto de utilidad
                      </label>

                      <p className="font-black text-xl text-[#1C5253] tracking-tight tabular-nums mt-2">
                        {money(total)} <span className="text-[11px] font-normal text-gray-400">/ mes</span>
                      </p>
                      <p className="text-[10.5px] font-mono text-gray-400">
                        {s.enReparto ? `${money(total * 12)} al año` : 'solo comisión · no es dueño'}
                      </p>

                      <div className="flex h-2 rounded-full overflow-hidden bg-emerald-50 gap-px mt-2">
                        {tramos.map(([v, color], j) => (
                          <span key={j} style={{ width: `${(Math.max(0, v) / maxTotal) * 100}%`, background: color }} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10.5px] text-gray-500 tabular-nums">
                        {tramos.filter(([v]) => v > 0).map(([v, color, etiqueta]) => (
                          <span key={etiqueta} className="flex items-center gap-1">
                            <i className="w-2 h-2 rounded-sm" style={{ background: color }} />
                            {etiqueta} {money(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Math.abs(sumaPct - 100) > 0.01 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-[12px] text-amber-800">
                    Los porcentajes de quienes entran al reparto suman {pctTxt(sumaPct)}, no 100 %.
                    Mientras tanto se calcula proporcional a lo que escribiste.
                  </p>
                </div>
              )}
            </Panel>

            {meta?.updated_at && (
              <p className="text-[11px] text-gray-400 text-center">
                Última vez guardado el{' '}
                {new Date(meta.updated_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCalculadora;
