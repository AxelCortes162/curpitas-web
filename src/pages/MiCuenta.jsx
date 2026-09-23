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
      <p className="text-xs font-bold text-[#1C5253] flex items-center gap-1.5 mb-1">
        <Gift className="w-3.5 h-3.5" /> Refiere y gana
      </p>
      <p className="text-[11px] text-gray-400 mb-3">
        Comparte tu link. Cuando un amigo compre su CURPita con él, ganas 100 puntos.
        También ganas 50 por registrarte y 150 por cada placa que tú compres.
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
            <span className="text-xs font-bold text-gray-400">Tus puntos</span>
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
                  className="p-2.5 rounded-xl bg-[#F4F9F8] hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-center"
                >
                  {canjeando === p.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                    : (
                      <>
                        <p className="text-[11px] font-bold text-[#1C5253] leading-tight">{p.nombre}</p>
                        <p className="text-[10px] text-gray-400">{p.costo} pts</p>
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
// SEGUNDO CONTACTO — un teléfono más, opcional, por si el tutor no contesta.
// Vive en profiles.phone_2 (una sola vez por cuenta, igual que el teléfono
// principal), y get_pet_public ya lo regresa: cuando existe, PetProfile
// muestra un segundo botón de llamada además de "Llamar al Tutor Ahora".
// ---------------------------------------------------------------------------

const ContactoEmergencia = ({ userId }) => {
  const [phone2, setPhone2] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    supabase
      .from('profiles')
      .select('phone_2')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (activo) setPhone2(data?.phone_2 || '');
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [userId]);

  const handleChange = (e) => {
    setPhone2(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const guardar = async () => {
    if (phone2 && phone2.length !== 10) {
      setMensaje('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    setGuardando(true);
    setMensaje('');
    const { error } = await conReintentoDeSesion(() => supabase
      .from('profiles')
      .update({ phone_2: phone2 || null })
      .eq('id', userId));
    setGuardando(false);
    setMensaje(error ? 'No se pudo guardar: ' + error.message : 'Guardado ✓');
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5 space-y-2">
      <p className="text-xs font-bold text-[#1C5253] flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5" /> Segundo contacto (opcional)
      </p>
      <p className="text-[11px] text-gray-400">
        Por si no contestas, en el perfil de tus mascotas aparece un botón para llamar también a
        este número.
      </p>
      {cargando ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            value={phone2}
            onChange={handleChange}
            placeholder="10 dígitos, ej. 5512345678"
            className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-xs font-mono text-[#1C5253]"
          />
          <button
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2.5 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-xl text-xs disabled:opacity-60"
          >
            {guardando ? '...' : 'Guardar'}
          </button>
        </div>
      )}
      {mensaje && <p className="text-[11px] text-[#1C5253]">{mensaje}</p>}
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
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

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
              />
            </div>
          </div>
        )}

        {/* Vincular nueva mascota */}
        <form
          onSubmit={handleClaim}
          className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4 mb-5 space-y-2"
        >
          <p className="text-xs font-bold text-[#1C5253] flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Vincular una mascota
          </p>
          <p className="text-[11px] text-gray-400">
            Escribe el folio CURPITA que viene en tu placa física.
          </p>
          <div className="flex gap-2">
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="CURPITA80233025"
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
          {claimMsg && <p className="text-[11px] text-[#1C5253]">{claimMsg}</p>}
        </form>

        {/* Segundo contacto */}
        <ContactoEmergencia userId={user.id} />

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