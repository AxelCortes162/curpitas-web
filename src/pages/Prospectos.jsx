import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, MapPin, Phone, Loader2, Search, Navigation } from 'lucide-react';
import { supabase, conReintentoDeSesion } from '../supabaseClient';

const ESTADOS = [
  { id: 'por_visitar', nombre: 'Por visitar', color: 'bg-gray-100 text-gray-500' },
  { id: 'visitada', nombre: 'Visitada', color: 'bg-sky-50 text-sky-600' },
  { id: 'seguimiento', nombre: 'En seguimiento', color: 'bg-amber-50 text-amber-600' },
  { id: 'negada', nombre: 'Negada', color: 'bg-red-50 text-red-500' },
  { id: 'aceptada', nombre: 'Aceptada', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'afiliada', nombre: 'Afiliada', color: 'bg-[#0B7345]/10 text-[#0B7345]' },
];

const TIPOS = [
  { id: 'veterinaria', nombre: 'Veterinaria' },
  { id: 'tienda', nombre: 'Tienda de mascotas' },
  { id: 'otro', nombre: 'Otro' },
];

const estadoPorId = (id) => {
  for (let i = 0; i < ESTADOS.length; i++) {
    if (ESTADOS[i].id === id) return ESTADOS[i];
  }
  return ESTADOS[0];
};

const POR_PAGINA = 15;

const limpiar = (texto) => (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const distanciaKm = (lat1, lng1, lat2, lng2) => {
  const r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2
    + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lng2 - lng1) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

const inputClase = 'mt-1 w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] outline-none focus:border-[#1C5253]';

export const Prospectos = () => {
  const [lugares, setLugares] = useState([]);
  const [nombres, setNombres] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [miPos, setMiPos] = useState(null);
  const [ubicando, setUbicando] = useState(false);
  const [errorPos, setErrorPos] = useState('');
  const [limite, setLimite] = useState(POR_PAGINA);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', tipo: 'veterinaria', telefono: '', direccion: '', maps_url: '', nota: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    const [{ data: ps }, { data: admins }] = await Promise.all([
      conReintentoDeSesion(() => supabase.from('prospectos').select('*').order('actualizado_en', { ascending: false })),
      conReintentoDeSesion(() => supabase.from('profiles').select('id, full_name').eq('is_admin', true)),
    ]);
    const mapa = {};
    const lista = admins || [];
    for (let i = 0; i < lista.length; i++) {
      mapa[lista[i].id] = (lista[i].full_name || '').trim().split(' ')[0];
    }
    setNombres(mapa);
    setLugares(ps || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    if (!nuevo.nombre.trim()) { setError('Falta el nombre.'); return; }
    setGuardando(true);
    const { error: err } = await conReintentoDeSesion(() => supabase.from('prospectos').insert({
      nombre: nuevo.nombre.trim(),
      tipo: nuevo.tipo,
      telefono: nuevo.telefono.trim() || null,
      direccion: nuevo.direccion.trim() || null,
      maps_url: nuevo.maps_url.trim() || null,
      nota: nuevo.nota.trim() || null,
    }));
    setGuardando(false);
    if (err) { setError(err.message); return; }
    setNuevo({ nombre: '', tipo: 'veterinaria', telefono: '', direccion: '', maps_url: '', nota: '' });
    setMostrarForm(false);
    setError('');
    cargar();
  };

  const actualizar = async (id, cambios) => {
    await conReintentoDeSesion(() => supabase.from('prospectos').update(cambios).eq('id', id));
    cargar();
  };

  const guardarCoordenadas = (lugar, texto) => {
    const partes = texto.split(',');
    let lat = null;
    let lng = null;
    if (partes.length === 2 && partes[0].trim() !== '' && partes[1].trim() !== '') {
      lat = Number(partes[0]);
      lng = Number(partes[1]);
      if (isNaN(lat) || isNaN(lng)) { lat = null; lng = null; }
    }
    if (lat === lugar.lat && lng === lugar.lng) return;
    actualizar(lugar.id, { lat: lat, lng: lng });
  };

  const ubicarme = () => {
    if (miPos) { setMiPos(null); return; }
    setUbicando(true);
    setErrorPos('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLimite(POR_PAGINA);
        setUbicando(false);
      },
      () => {
        setErrorPos('No se pudo obtener tu ubicación. Revisa el permiso del navegador.');
        setUbicando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const conteo = {};
  for (let i = 0; i < lugares.length; i++) {
    conteo[lugares[i].estado] = (conteo[lugares[i].estado] || 0) + 1;
  }

  const texto = limpiar(busqueda.trim());
  const filtrados = [];
  for (let i = 0; i < lugares.length; i++) {
    const l = lugares[i];
    const pasaEstado = filtro === 'todos' || l.estado === filtro;
    const pasaTexto = texto === '' || limpiar(l.nombre + ' ' + l.direccion + ' ' + l.nota).includes(texto);
    if (pasaEstado && pasaTexto) {
      let km = null;
      if (miPos && l.lat !== null) km = distanciaKm(miPos.lat, miPos.lng, l.lat, l.lng);
      filtrados.push({ ...l, km: km });
    }
  }
  if (miPos) {
    filtrados.sort((a, b) => (a.km === null ? 9999 : a.km) - (b.km === null ? 9999 : b.km));
  }
  const visibles = filtrados.slice(0, limite);

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-lg mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#1C5253] mb-3">
          <ChevronLeft className="w-3.5 h-3.5" /> Admin
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <img src="/logo.png" alt="CURPitas" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-black text-[#1C5253]">Prospectos</h1>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Veterinarias y tiendas por visitar. Las afiliadas son las que después saldrán en el mapa del inicio.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => { setFiltro('todos'); setLimite(POR_PAGINA); }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${filtro === 'todos' ? 'bg-[#1C5253] text-white' : 'bg-white text-[#1C5253]'}`}
          >
            Todos · {lugares.length}
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e.id}
              onClick={() => { setFiltro(e.id); setLimite(POR_PAGINA); }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${filtro === e.id ? 'bg-[#1C5253] text-white' : 'bg-white text-[#1C5253]'}`}
            >
              {e.nombre} · {conteo[e.id] || 0}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1 flex items-center gap-2 px-3 bg-white rounded-xl border border-emerald-100">
            <Search className="w-4 h-4 text-gray-300 shrink-0" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setLimite(POR_PAGINA); }}
              placeholder="Buscar nombre, calle o colonia"
              className="w-full py-2.5 text-sm text-[#1C5253] outline-none bg-transparent"
            />
          </div>
          <button
            onClick={ubicarme}
            className={`px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 ${miPos ? 'bg-[#1C5253] text-white' : 'bg-white text-[#1C5253] border border-emerald-100'}`}
          >
            {ubicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Cerca de mí
          </button>
        </div>
        {errorPos && <p className="text-xs text-red-500 mb-2">{errorPos}</p>}
        <p className="text-[11px] text-gray-400 mb-4">
          {filtrados.length} lugares{miPos ? ', del más cercano al más lejano' : ''}
        </p>

        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full mb-5 py-3 bg-[#1C5253] hover:bg-[#164343] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar lugar
          </button>
        )}

        {mostrarForm && (
          <form onSubmit={crear} className="bg-white rounded-2xl border border-emerald-100/80 p-4 space-y-3 mb-5">
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nombre</span>
              <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className={inputClase} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo</span>
                <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })} className={inputClase}>
                  {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Teléfono</span>
                <input value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} className={inputClase} />
              </label>
            </div>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dirección</span>
              <input value={nuevo.direccion} onChange={(e) => setNuevo({ ...nuevo, direccion: e.target.value })} className={inputClase} />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Liga de Google Maps</span>
              <input value={nuevo.maps_url} onChange={(e) => setNuevo({ ...nuevo, maps_url: e.target.value })} className={inputClase} />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nota</span>
              <textarea rows={2} value={nuevo.nota} onChange={(e) => setNuevo({ ...nuevo, nota: e.target.value })} className={inputClase} />
            </label>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2">
              <button type="submit" disabled={guardando} className="flex-1 py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white text-xs font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-1.5">
                {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Guardar
              </button>
              <button type="button" onClick={() => { setMostrarForm(false); setError(''); }} className="px-4 py-2.5 bg-[#F4F9F8] hover:bg-emerald-100 text-[#1C5253] text-xs font-bold rounded-xl">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cargando && <p className="text-xs text-gray-400">Cargando...</p>}

        {!cargando && visibles.length === 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-6 text-center">
            <p className="text-sm font-bold text-[#1C5253]">No hay lugares aquí</p>
          </div>
        )}

        <div className="space-y-3">
          {visibles.map((l) => {
            const est = estadoPorId(l.estado);
            return (
              <div key={l.id} className="bg-white rounded-2xl border border-emerald-100/80 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1C5253]">{l.nombre}</p>
                    {l.km !== null && (
                      <p className="text-[11px] font-bold text-[#0B7345]">
                        {l.km < 1 ? Math.round(l.km * 1000) + ' m' : l.km.toFixed(1) + ' km'}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      {l.tipo === 'veterinaria' ? 'Veterinaria' : l.tipo === 'tienda' ? 'Tienda de mascotas' : 'Otro'}
                      {l.direccion ? ' · ' + l.direccion : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${est.color}`}>{est.nombre}</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <select
                    value={l.estado}
                    onChange={(e) => actualizar(l.id, { estado: e.target.value })}
                    className="flex-1 py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs font-bold text-[#1C5253] outline-none"
                  >
                    {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                  {l.maps_url && (
                    <a href={l.maps_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-[#F4F9F8] text-[#1C5253] flex items-center">
                      <MapPin className="w-4 h-4" />
                    </a>
                  )}
                  {l.telefono && (
                    <a href={'tel:' + l.telefono} className="px-3 py-1.5 rounded-lg bg-[#F4F9F8] text-[#1C5253] flex items-center">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <textarea
                  rows={2}
                  defaultValue={l.nota || ''}
                  placeholder="Nota (con quién hablaste, qué dijeron...)"
                  onBlur={(e) => { if (e.target.value !== (l.nota || '')) actualizar(l.id, { nota: e.target.value }); }}
                  className="mt-2 w-full py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253] outline-none focus:border-[#1C5253]"
                />

                {l.estado === 'afiliada' && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Para el mapa público</p>
                    <input
                      defaultValue={l.lat !== null ? l.lat + ', ' + l.lng : ''}
                      placeholder="Coordenadas: 19.4326, -99.1332"
                      onBlur={(e) => guardarCoordenadas(l, e.target.value)}
                      className="w-full py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs font-mono text-[#1C5253] outline-none focus:border-[#1C5253]"
                    />
                    <textarea
                      rows={2}
                      defaultValue={l.resumen_publico || ''}
                      placeholder="Resumen: horario, qué formas tienen..."
                      onBlur={(e) => { if (e.target.value !== (l.resumen_publico || '')) actualizar(l.id, { resumen_publico: e.target.value }); }}
                      className="w-full py-1.5 px-2 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253] outline-none focus:border-[#1C5253]"
                    />
                  </div>
                )}

                <p className="text-[10px] text-gray-300 mt-2">
                  {nombres[l.actualizado_por] ? nombres[l.actualizado_por] + ' · ' : ''}
                  {new Date(l.actualizado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            );
          })}
        </div>

        {filtrados.length > limite && (
          <button
            onClick={() => setLimite(limite + POR_PAGINA)}
            className="w-full mt-3 py-3 bg-white hover:bg-emerald-50 text-[#1C5253] text-xs font-bold rounded-xl border border-emerald-100"
          >
            Ver más ({filtrados.length - limite} restantes)
          </button>
        )}
      </div>
    </div>
  );
};

export default Prospectos;
