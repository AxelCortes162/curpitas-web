import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, X, PawPrint } from 'lucide-react';
import { IconoGato, IconoOtraMascota } from '../components/IconosMascotas';
import { supabase } from '../supabaseClient';
import FotoCarrusel3D from '../components/FotoCarrusel3D';

// Sello de "Adoptado" — imagen real (PNG con transparencia). Usa estilos en
// línea para el posicionamiento (más confiable que clases de Tailwind aquí).
const SelloAdoptado = ({ size = 76, style = {} }) => (
  <img
    src="/sello-adoptado.png"
    alt="Adoptado"
    style={{ width: size, height: size, position: 'absolute', zIndex: 10, ...style }}
  />
);

// Botón tipo interruptor Sí/No, para las preguntas de filtro
const BotonSiNo = ({ valor, onChange }) => (
  <div className="flex gap-2">
    {['Sí', 'No'].map((op) => (
      <button
        key={op}
        type="button"
        onClick={() => onChange(op)}
        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
          valor === op
            ? 'bg-[#1C5253] text-white border-[#1C5253]'
            : 'bg-[#F4F9F8] text-[#1C5253] border-emerald-100'
        }`}
      >
        {op}
      </button>
    ))}
  </div>
);

// Formulario de filtro antes de escribirle al rescatista — más completo,
// pensado para rescatistas que hacen una evaluación seria antes de adoptar.
const FormularioAdopcion = ({ dog, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tipoVivienda, setTipoVivienda] = useState('');
  const [tienePatio, setTienePatio] = useState('');
  const [conQuienVive, setConQuienVive] = useState('');
  const [familiaDeAcuerdo, setFamiliaDeAcuerdo] = useState('');
  const [otrasMascotas, setOtrasMascotas] = useState('');
  const [experienciaPrevia, setExperienciaPrevia] = useState('');
  const [horasSolo, setHorasSolo] = useState('');
  const [gastos, setGastos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [dispuestoVisita, setDispuestoVisita] = useState('');
  const [dispuestoEsterilizar, setDispuestoEsterilizar] = useState('');

  const telefono = dog.rescuer_phone?.replace(/\D/g, '');

  const enviar = (e) => {
    e.preventDefault();
    const mensaje =
      `¡Hola! Me interesa adoptar a ${dog.name || 'tu mascota'} 🐾 (visto en CURPitas).\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Edad:* ${edad}\n` +
      `*Colonia/Ciudad donde vivo:* ${ubicacion}\n` +
      `*Tipo de vivienda:* ${tipoVivienda}${tienePatio ? ` (¿patio o balcón? ${tienePatio})` : ''}\n` +
      `*Con quién vivo:* ${conQuienVive}\n` +
      `*¿Todos de acuerdo con la adopción?:* ${familiaDeAcuerdo}\n` +
      `*Otras mascotas actualmente:* ${otrasMascotas || 'Ninguna'}\n` +
      `*Experiencia previa con mascotas:* ${experienciaPrevia}\n` +
      `*Horas al día que estaría solo:* ${horasSolo}\n` +
      `*¿Quién cubrirá los gastos?:* ${gastos}\n` +
      `*¿Por qué quiero adoptarlo?:* ${motivo}\n` +
      `*¿Dispuesto/a a visita domiciliaria?:* ${dispuestoVisita}\n` +
      `*¿Dispuesto/a a esterilizar/vacunar si hace falta?:* ${dispuestoEsterilizar}`;

    window.open(`https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const inputClass =
    'w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]';
  const labelClass = 'text-[10px] font-bold text-gray-400 uppercase block mb-1';

  return (
    <form onSubmit={enviar} className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
      <p className="text-xs font-bold text-[#1C5253]">
        Este rescatista hace una evaluación completa — respóndele con calma:
      </p>

      <div>
        <label className={labelClass}>Nombre completo</label>
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Edad</label>
          <input required value={edad} onChange={(e) => setEdad(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Colonia / Ciudad</label>
          <input required value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Tipo de vivienda</label>
        <select required value={tipoVivienda} onChange={(e) => setTipoVivienda(e.target.value)} className={inputClass}>
          <option value="">Selecciona...</option>
          <option value="Casa">Casa</option>
          <option value="Departamento">Departamento</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>¿Tiene patio o balcón?</label>
        <BotonSiNo valor={tienePatio} onChange={setTienePatio} />
      </div>

      <div>
        <label className={labelClass}>¿Con quién vives?</label>
        <input
          required
          value={conQuienVive}
          onChange={(e) => setConQuienVive(e.target.value)}
          placeholder="Solo, con familia, con roommates..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>¿Todos en casa están de acuerdo con la adopción?</label>
        <BotonSiNo valor={familiaDeAcuerdo} onChange={setFamiliaDeAcuerdo} />
      </div>

      <div>
        <label className={labelClass}>¿Tienes otras mascotas actualmente?</label>
        <input value={otrasMascotas} onChange={(e) => setOtrasMascotas(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>¿Has tenido mascotas antes? ¿Qué pasó con ellas?</label>
        <textarea
          required
          value={experienciaPrevia}
          onChange={(e) => setExperienciaPrevia(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>¿Cuántas horas al día estaría solo?</label>
        <input required value={horasSolo} onChange={(e) => setHorasSolo(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>¿Quién cubrirá los gastos (comida, veterinario)?</label>
        <input required value={gastos} onChange={(e) => setGastos(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>¿Por qué te gustaría adoptar a {dog.name || 'él/ella'}?</label>
        <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>¿Estás dispuesto/a a una visita domiciliaria?</label>
        <BotonSiNo valor={dispuestoVisita} onChange={setDispuestoVisita} />
      </div>

      <div>
        <label className={labelClass}>¿Dispuesto/a a esterilizar/vacunar si hace falta?</label>
        <BotonSiNo valor={dispuestoEsterilizar} onChange={setDispuestoEsterilizar} />
      </div>

      <div className="flex gap-2 pt-1 sticky bottom-0 bg-[#E8F3F1] pb-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 py-2.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Enviar por WhatsApp
        </button>
      </div>
    </form>
  );
};

// Ficha completa del perro: carrusel 3D de fotos + info + botón de contacto
const FichaPerro = ({ dog, onCerrar }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const fotos = dog.photo_urls?.length ? dog.photo_urls : dog.photo_url ? [dog.photo_url] : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <div
        className="bg-[#E8F3F1] rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCerrar}
          className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full p-1.5 z-10"
        >
          <X className="w-4 h-4 text-[#1C5253]" />
        </button>

        {fotos.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <FotoCarrusel3D fotos={fotos} />
            {dog.status === 'adoptado' && (
              <SelloAdoptado size={100} style={{ top: -14, left: -14 }} />
            )}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-xs">Sin fotos aún</div>
        )}

        <h2 className="text-xl font-black text-[#1C5253] mt-3 flex items-center gap-2">
          {dog.name || 'Sin nombre'}
        </h2>
        <p className="text-xs text-gray-500">
          {dog.breed || (dog.species === 'gato' ? 'Gato' : 'Perro')}
          {dog.age_text && ` · ${dog.age_text}`}
        </p>
        {dog.city && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" /> {dog.city}
          </p>
        )}
        {dog.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{dog.description}</p>
        )}

        {dog.status === 'adoptado' ? (
          <div className="mt-4 bg-[#F4F9F8] rounded-xl py-3 px-3 text-center space-y-1">
            <p className="text-xs text-gray-400">
              {dog.name || 'Esta mascota'} ya encontró un hogar — gracias a quienes lo hicieron posible.
            </p>
            {dog.got_curpita && (
              <p className="text-xs font-bold text-[#1C5253] flex items-center justify-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> Se fue a su nuevo hogar con su credencial CURPitas puesta
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {mostrarFormulario ? (
              <FormularioAdopcion dog={dog} onCancelar={() => setMostrarFormulario(false)} />
            ) : dog.rescuer_phone ? (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" /> Quiero adoptarlo
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const TarjetaPerro = ({ dog, onAbrir }) => {
  const portada = dog.photo_urls?.[0] || dog.photo_url;
  const adoptado = dog.status === 'adoptado';
  return (
    <button onClick={onAbrir} style={{ position: 'relative' }} className="text-left block w-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-emerald-100/70 shadow-sm">
        <div className="aspect-square bg-[#E8F3F1]">
          {portada && (
            <img
              src={portada}
              alt={dog.name}
              className={`w-full h-full object-cover ${adoptado ? 'grayscale opacity-70' : ''}`}
            />
          )}
        </div>
        <div className="p-3">
          <p className="font-black text-[#1C5253] text-sm">{dog.name || 'Sin nombre'}</p>
          <p className="text-[11px] text-gray-500">
            {dog.breed || (dog.species === 'gato' ? 'Gato' : 'Perro')}
            {dog.age_text && ` · ${dog.age_text}`}
          </p>
          {adoptado && dog.got_curpita && (
            <p className="text-[10px] font-bold text-[#1C5253] mt-1 flex items-center gap-1">
            <PawPrint className="w-3 h-3" /> Se fue con su CURPitas
          </p>
          )}
        </div>
      </div>
      {adoptado && <SelloAdoptado size={64} style={{ top: -8, left: -8 }} />}
    </button>
  );
};

export const Adopciones = () => {
  const [perros, setPerros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perroAbierto, setPerroAbierto] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('adoptable_dogs_public')
        .select('*')
        .order('status', { ascending: false })
        .order('name');
      setPerros(data || []);
      setLoading(false);
    };
    cargar();
  }, []);

  const perrosFiltrados = filtro === 'todos' ? perros : perros.filter((p) => p.species === filtro);

  const opcionesFiltro = [
    { valor: 'todos', label: 'Todos', icon: null },
    { valor: 'perro', label: 'Perros', icon: PawPrint },
    { valor: 'gato', label: 'Gatos', icon: IconoGato },
    { valor: 'otro', label: 'Otros', icon: IconoOtraMascota },
  ];

  return (
    <div className="min-h-screen bg-[#E8F3F1] font-sans antialiased">
      <div className="max-w-4xl mx-auto p-4">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-[#1C5253] hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Inicio
        </Link>

        <h1 className="text-xl font-black text-[#1C5253] mb-1">Mascotas en adopción</h1>
        <p className="text-xs text-gray-500 mb-4">
          Cada mascota fue publicada por un rescatista verificado. Toca una para ver más fotos y contactarlo.
        </p>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {opcionesFiltro.map((op) => (
            <button
              key={op.valor}
              onClick={() => setFiltro(op.valor)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                filtro === op.valor
                  ? 'bg-[#1C5253] text-white border-[#1C5253]'
                  : 'bg-white text-[#1C5253] border-emerald-100'
              }`}
            >
              {op.icon && <op.icon className="w-3.5 h-3.5" />}
              {op.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-gray-400">Cargando...</p>}

        {!loading && perrosFiltrados.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-10">
            {perros.length === 0
              ? 'No hay mascotas disponibles en este momento. Vuelve pronto.'
              : 'No hay mascotas en esta categoría por ahora.'}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {perrosFiltrados.map((dog) => (
            <TarjetaPerro key={dog.id} dog={dog} onAbrir={() => setPerroAbierto(dog)} />
          ))}
        </div>
      </div>

      {perroAbierto && <FichaPerro dog={perroAbierto} onCerrar={() => setPerroAbierto(null)} />}
    </div>
  );
};

export default Adopciones;