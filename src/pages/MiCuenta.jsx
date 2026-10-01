import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, Link2, Heart, Gift, Copy, Loader2, Phone,
} from 'lucide-react';
import { supabase, conReintentoDeSesion } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import PetEditorCard from '../components/PetEditorCard';
import TestimonioForm from '../components/TestimonioForm';
import CarruselMascotas from '../components/CarruselMascotas';
import InstalarApp from '../components/InstalarApp';

// ---------------------------------------------------------------------------
// REFIERE Y GANA — la mitad del programa de puntos para dueños de mascotas
// (la otra mitad, vendedores externos, vive aparte y paga comisión en
// dinero real). Aquí no hay dinero: un tutor comparte su código, y cuando
// alguien que lo usó paga su pedido, gana 100 puntos. Ver
// claude/sistema-referidos.md en el proyecto de Claude para el diseño
// completo.
//
// El código se genera solo, la primera vez que este bloque se monta —
// generar_codigo_referido() regresa el mismo de siempre si el tutor ya
// tenía uno. El saldo sale de saldo_puntos() (ya descuenta lo vencido), y
// el canje lo pide el propio tutor: solicitar_canje() valida que le
// alcance y descuenta los puntos en la misma transacción — aquí solo se
// muestra el resultado.
// ---------------------------------------------------------------------------

const PREMIOS = [
  { id: 'bolsas_popo', nombre: 'Bolsitas para popó', costo: 350 },
  { id: 'plato', nombre: 'Plato CURPitas', costo: 750 },
  { id: 'totebag', nombre: 'Totebag', costo: 1050 },
  { id: 'segunda_placa', nombre: 'Segunda placa', costo: 1200 },
  { id: 'sudadera', nombre: 'Sudadera CURPitas', costo: 3500 },
];

const ReferidosYPuntos = ({ userId }) => {
  const [codigo, setCodigo] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [canjeando, setCanjeando] = useState('');
  const [errorCanje, setErrorCanje] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const [{ data: cod }, { data: s }, { data: movs }, { data: sols }] = await Promise.all([
      conReintentoDeSesion(() => supabase.rpc('generar_codigo_referido')),
      conReintentoDeSesion(() => supabase.rpc('saldo_puntos', { p_tutor_id: userId })),
      conReintentoDeSesion(() => supabase.from('puntos_movimientos')
        .select('*').eq('tutor_id', userId).order('creado_en', { ascending: false }).limit(20)),
      conReintentoDeSesion(() => supabase.from('solicitudes_canje')
        .select('*').eq('tutor_id', userId).order('creado_en', { ascending: false }).limit(10)),
    ]);
    setCodigo(cod || '');
    setSaldo(s ?? 0);
    setMovimientos(movs || []);
    setSolicitudes(sols || []);
    setCargando(false);
  }, [userId]);

  useEffect(() => { cargar(); }, [cargar]);

  const linkReferido = useMemo(
    () => (codigo ? `${window.location.origin}/pedir?v=${codigo}` : ''),
    [codigo],
  );

  const copiarLink = async () => {
    if (!linkReferido) return;
    try {
      await navigator.clipboard.writeText(linkReferido);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* el link ya está visible en pantalla */ }
  };

  const pedirCanje = async (premio) => {
    setErrorCanje('');
    setCanjeando(premio.id);
    const { error } = await conReintentoDeSesion(() => supabase.rpc('solicitar_canje', {
      p_premio: premio.id,
    }));
    setCanjeando('');
    if (error) {
      setErrorCanje(error.message || 'No se pudo pedir el canje.');
      return;
    }
    cargar();
  };

  const solicitudPendiente = solicitudes.find((s) => s.estado === 'pendiente');

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5">
      <p className="text-sm font-bold text-[#1C5253] flex items-center gap-1.5 mb-1">
        <Gift className="w-4 h-4" /> Refiere y gana
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Comparte tu link. Cuando un amigo compre su CURPita con él, ganas 100 puntos.
        También ganas 50 por registrarte, 150 por cada placa que tú compres y 150 por tu
        primer testimonio publicado.
      </p>

      {cargando ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 bg-[#F4F9F8] rounded-xl p-3 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tu código</p>
              <p className="text-sm font-black text-[#1C5253] font-mono truncate">{codigo}</p>
            </div>
            <button
              onClick={copiarLink}
              className="shrink-0 p-2.5 rounded-lg bg-white border border-emerald-100 hover:bg-emerald-50 text-[#1C5253]"
              title="Copiar link para compartir"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {copiado && <p className="text-[11px] text-[#0B7345] -mt-2 mb-3 text-right">Copiado.</p>}

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-500">Tus puntos</span>
            <span className="text-lg font-black text-[#1C5253]">{saldo}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {PREMIOS.map((p) => {
              const alcanza = saldo >= p.costo;
              return (
                <button
                  key={p.id}
                  onClick={() => pedirCanje(p)}
                  disabled={!alcanza || canjeando === p.id || !!solicitudPendiente}
                  title={solicitudPendiente ? 'Ya tienes un canje pendiente' : ''}
                  className={`p-2.5 rounded-xl text-center border disabled:cursor-not-allowed ${
                    alcanza ? 'bg-[#88D49E]/20 border-[#88D49E] hover:bg-[#88D49E]/40' : 'bg-[#F4F9F8] border-transparent'
                  }`}
                >
                  {canjeando === p.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    : (
                      <>
                        <p className="text-xs font-bold text-[#1C5253] leading-tight">{p.nombre}</p>
                        <p className={`text-[11px] mt-0.5 ${alcanza ? 'font-bold text-[#0B7345]' : 'text-gray-500'}`}>
                          {alcanza ? `Canjear · ${p.costo} pts` : `Te faltan ${p.costo - saldo} pts`}
                        </p>
                      </>
                    )}
                </button>
              );
            })}
          </div>
          {errorCanje && <p className="text-[11px] text-red-500 mb-2">{errorCanje}</p>}
          {solicitudPendiente && (
            <p className="text-[11px] text-gray-400 mb-2">
              Ya pediste tu canje de {PREMIOS.find((p) => p.id === solicitudPendiente.premio)?.nombre ?? solicitudPendiente.premio}
              {' '}— te avisamos cuando esté listo.
            </p>
          )}

          {movimientos.length > 0 && (
            <details className="mt-1">
              <summary className="text-[11px] font-bold text-gray-400 cursor-pointer">Historial de puntos</summary>
              <div className="mt-2 space-y-1">
                {movimientos.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate pr-2">{m.descripcion || (m.tipo === 'referido' ? 'Referido' : 'Canje')}</span>
                    <span className={`shrink-0 font-bold ${m.puntos > 0 ? 'text-[#0B7345]' : 'text-red-500'}`}>
                      {m.puntos > 0 ? '+' : ''}{m.puntos}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MIS DATOS — nombre, teléfono principal y segundo contacto (opcional).
// Viven en profiles; el trigger proteger_columnas_profiles solo deja que el
// tutor cambie estos datos, nunca is_admin ni is_rescuer. get_pet_public lee
// de aquí, así que el perfil de sus mascotas se actualiza solo.
// ---------------------------------------------------------------------------

const MisDatos = ({ userId }) => {
  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    supabase
      .from('profiles')
      .select('full_name, phone, phone_2')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (activo) {
          setNombre(data?.full_name || '');
          setPhone(data?.phone || '');
          setPhone2(data?.phone_2 || '');
          setCargando(false);
        }
      });
    return () => { activo = false; };
  }, [userId]);

  const soloDigitos = (valor) => valor.replace(/\D/g, '').slice(0, 10);

  const guardar = async () => {
    setMensaje('');
    setError(true);
    if (!nombre.trim()) { setMensaje('Escribe tu nombre.'); return; }
    if (phone.length !== 10) { setMensaje('Tu teléfono debe tener exactamente 10 dígitos.'); return; }
    if (phone2 && phone2.length !== 10) { setMensaje('El segundo contacto debe tener exactamente 10 dígitos.'); return; }
    if (phone2 && phone2 === phone) { setMensaje('El segundo contacto debe ser un número distinto al tuyo.'); return; }

    setGuardando(true);
    const { error: err } = await conReintentoDeSesion(() => supabase
      .from('profiles')
      .update({ full_name: nombre.trim(), phone: phone, phone_2: phone2 || null })
      .eq('id', userId));
    setGuardando(false);
    if (err) {
      setMensaje('No se pudo guardar: ' + err.message);
    } else {
      setError(false);
      setMensaje('Guardado ✓ El perfil de tus mascotas ya muestra estos datos.');
    }
  };

  const campo = 'w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:border-[#1C5253]';

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5 space-y-3">
      <p className="text-sm font-bold text-[#1C5253] flex items-center gap-1.5">
        <Phone className="w-4 h-4" /> Mis datos de contacto
      </p>
      <p className="text-xs text-gray-500">
        Es lo que ve quien encuentre a tus mascotas. Mantenlo al día.
      </p>
      {cargando ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <>
          <label className="block">
            <span className="text-xs font-semibold text-[#1C5253]">Tu nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value.slice(0, 80))}
              autoComplete="name"
              className={campo}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#1C5253]">Tu teléfono</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(soloDigitos(e.target.value))}
              placeholder="10 dígitos"
              autoComplete="tel-national"
              className={campo + ' font-mono'}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#1C5253]">
              Segundo contacto <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone2}
              onChange={(e) => setPhone2(soloDigitos(e.target.value))}
              placeholder="Por si tú no contestas"
              className={campo + ' font-mono'}
            />
          </label>
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white font-bold rounded-xl text-sm disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar mis datos'}
          </button>
        </>
      )}
      {mensaje && (
        <p className={`text-xs ${error ? 'text-red-600' : 'text-emerald-700'}`}>{mensaje}</p>
      )}
    </div>
  );
};

export const MiCuenta = () => {
  const { user, signOut } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [esRescatista, setEsRescatista] = useState(false);
  const [mascotaActiva, setMascotaActiva] = useState(0);

  const [folio, setFolio] = useState(() => {
    try { return localStorage.getItem('folioPendiente') || ''; } catch { return ''; }
  });
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');

  const cargarMascotas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setPets(data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    cargarMascotas();
    supabase
      .from('profiles')
      .select('is_rescuer')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setEsRescatista(data?.is_rescuer === true));
  }, [cargarMascotas, user.id]);

  // Si se borra la mascota activa (o cambia la lista tras vincular/cargar),
  // el índice del carrusel se recorre para que nunca apunte a algo que ya
  // no existe.
  useEffect(() => {
    setMascotaActiva((i) => {
      if (pets.length === 0) return 0;
      return Math.min(i, pets.length - 1);
    });
  }, [pets]);

  const actualizarMascotaLocal = (id, cambios) => {
    setPets((prev) => {
      const copia = [];
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id === id) copia.push({ ...prev[i], ...cambios });
        else copia.push(prev[i]);
      }
      return copia;
    });
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimMsg('');
    setClaiming(true);

    // El reclamo pasa por una función en Supabase que exige conocer el folio.
    // Antes se hacía con un UPDATE directo, y eso permitía que cualquier
    // usuario registrado listara las placas libres y se las quedara.
    const { error } = await supabase.rpc('reclamar_placa', {
      p_curpita: folio.trim(),
    });

    setClaiming(false);

    if (error) {
      setClaimMsg(error.message || 'Ese folio no existe o ya fue vinculado a otra cuenta.');
      return;
    }

    setClaimMsg('¡Mascota vinculada! Ya puedes completar sus datos abajo.');
    setFolio('');
    try { localStorage.removeItem('folioPendiente'); } catch { /* nada que limpiar */ }
    cargarMascotas();
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-sm mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CURPitas" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="text-xl font-black text-[#1C5253] leading-none">Mi cuenta</h1>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-1 py-3 -my-3 text-xs font-bold text-red-500 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

        <InstalarApp />

        {esRescatista && (
          <Link
            to="/mis-perros"
            className="flex items-center justify-between bg-[#1C5253] text-white rounded-2xl px-4 py-3 mb-5"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Heart className="w-4 h-4 text-[#88D49E]" /> Administrar mis mascotas en adopción
            </span>
            <span className="text-[#88D49E]">→</span>
          </Link>
        )}

        {/* Mis mascotas — primero, porque es lo que más importa y para que
            no haya que bajar tanto para llegar a ellas. Si hay más de una,
            un carrusel 3D (igual que el de Adopciones) elige cuál mostrar;
            abajo solo se renderiza el editor completo de esa mascota
            activa, no todas apiladas. */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Mis mascotas
        </p>

        {loading && <p className="text-xs text-gray-400 mb-5">Cargando...</p>}

        {!loading && pets.length === 0 && (
          <p className="text-xs text-gray-400 mb-5">
            Aún no tienes mascotas vinculadas. Usa el formulario de abajo con el folio de tu placa.
          </p>
        )}

        {!loading && pets.length > 0 && (
          <div className="mb-5">
            {pets.length > 1 && (
              <CarruselMascotas
                pets={pets}
                indice={mascotaActiva}
                onCambiar={setMascotaActiva}
              />
            )}
            <div className={pets.length > 1 ? 'mt-3' : ''}>
              <PetEditorCard
                key={pets[mascotaActiva]?.id}
                pet={pets[mascotaActiva]}
                onUpdated={cargarMascotas}
                onDeleted={cargarMascotas}
                onPerdidaCambiada={actualizarMascotaLocal}
              />
            </div>
          </div>
        )}

        {/* Vincular nueva mascota */}
        <form
          onSubmit={handleClaim}
          className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5 space-y-2"
        >
          <p className="text-sm font-bold text-[#1C5253] flex items-center gap-1.5">
            <Link2 className="w-4 h-4" /> Vincular una mascota
          </p>
          <p className="text-xs text-gray-500">
            Escribe el folio CURPITA que viene en tu placa física.
          </p>
          <div className="flex gap-2">
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="Ej. CURPITA80233025"
              aria-label="Folio CURPITA de la placa"
              className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-xs font-mono text-[#1C5253]"
            />
            <button
              type="submit"
              disabled={claiming || !folio}
              className="px-4 py-2.5 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-xl text-xs disabled:opacity-60"
            >
              {claiming ? '...' : 'Vincular'}
            </button>
          </div>
          {claimMsg && <p className="text-xs text-[#1C5253]">{claimMsg}</p>}
        </form>

        {/* Nombre, teléfono y segundo contacto */}
        <MisDatos userId={user.id} />

        {/* Refiere y gana */}
        <ReferidosYPuntos userId={user.id} />

        {/* Testimonio */}
        <div className="mt-6">
          <TestimonioForm />
        </div>
      </div>
    </div>
  );
};

export default MiCuenta;