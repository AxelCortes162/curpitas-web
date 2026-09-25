import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, X, PawPrint, Share2, Check, Loader2 } from 'lucide-react';
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

// Botones de opción (Sí/No por defecto), para las preguntas de filtro
const BotonSiNo = ({ valor, onChange, opciones = ['Sí', 'No'] }) => (
  <div className="flex gap-2">
    {opciones.map((op) => (
      <button
        key={op}
        type="button"
        onClick={() => onChange(op)}
        className={`flex-1 min-w-0 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
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

// Comparte la liga de una mascota. En celular abre el menú de compartir del
// teléfono; si no existe, copia la liga.
const BotonCompartir = ({ dog, className = '', conTexto = false }) => {
  const [copiado, setCopiado] = useState(false);

  const compartir = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/adopciones?mascota=${dog.id}`;
    const texto = `${dog.name || 'Esta mascota'} busca hogar 🐾 Míralo en CURPitas:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${dog.name || 'Mascota'} en adopción`, text: texto, url: url });
      } catch {
        // la persona cerró el menú de compartir
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.location.href = `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`;
    }
  };

  return (
    <button type="button" onClick={compartir} aria-label="Compartir" className={className}>
      {copiado ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {conTexto && <span>{copiado ? 'Liga copiada' : 'Compartir'}</span>}
    </button>
  );
};

// Formulario de filtro antes de escribirle al rescatista — más completo,
// pensado para rescatistas que hacen una evaluación seria antes de adoptar.
const FormularioAdopcion = ({ dog, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tipoVivienda, setTipoVivienda] = useState('');
  const [propiedad, setPropiedad] = useState('');
  const [permiteMascotas, setPermiteMascotas] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
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

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    const faltantes = [];
    if (!propiedad) faltantes.push('si tu vivienda es propia o rentada');
    if (propiedad === 'Rentada' && !permiteMascotas) faltantes.push('si el dueño permite mascotas');
    if (!tienePatio) faltantes.push('si tienes patio o balcón');
    if (!familiaDeAcuerdo) faltantes.push('si todos en casa están de acuerdo');
    if (!dispuestoVisita) faltantes.push('si aceptas una visita');
    if (!dispuestoEsterilizar) faltantes.push('si lo esterilizarías o vacunarías');
    if (faltantes.length > 0) {
      setError('Falta contestar: ' + faltantes.join(', ') + '.');
      return;
    }

    setEnviando(true);
    // El teléfono del rescatista se pide de uno en uno, hasta este momento.
    // Así el directorio de adopción no expone todos los números de golpe.
    const { data: rescuerPhone } = await supabase.rpc('get_adoptable_contact', {
      p_dog_id: dog.id,
    });
    const telefono = rescuerPhone?.replace(/\D/g, '');
    if (!telefono) {
      setEnviando(false);
      setError('No pudimos obtener el contacto del rescatista. Intenta de nuevo en un momento.');
      return;
    }

    const mensaje =
      `¡Hola! Me interesa adoptar a ${dog.name || 'tu mascota'} 🐾 (visto en CURPitas).\n\n` +
      `*Nombre:* ${nombre}\n` +
      `*Edad:* ${edad}\n` +
      `*Colonia/Ciudad donde vivo:* ${ubicacion}\n` +
      `*Tipo de vivienda:* ${tipoVivienda}${tienePatio ? ` (¿patio o balcón? ${tienePatio})` : ''}\n` +
      `*Vivienda propia o rentada:* ${propiedad}${propiedad === 'Rentada' ? ` (¿el dueño permite mascotas? ${permiteMascotas})` : ''}\n` +
      `*Con quién vivo:* ${conQuienVive}\n` +
      `*¿Todos de acuerdo con la adopción?:* ${familiaDeAcuerdo}\n` +
      `*Otras mascotas actualmente:* ${otrasMascotas || 'Ninguna'}\n` +
      `*Experiencia previa con mascotas:* ${experienciaPrevia}\n` +
      `*Horas al día que estaría solo:* ${horasSolo}\n` +
      `*¿Quién cubrirá los gastos?:* ${gastos}\n` +
      `*¿Por qué quiero adoptarlo?:* ${motivo}\n` +
      `*¿Dispuesto/a a visita domiciliaria?:* ${dispuestoVisita}\n` +
      `*¿Dispuesto/a a esterilizar/vacunar si hace falta?:* ${dispuestoEsterilizar}`;

    // En la misma pestaña: después de esperar al servidor, muchos celulares
    // bloquean las ventanas nuevas y el botón parecía no hacer nada.
    window.location.href = `https://wa.me/52${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  const inputClass =
    'w-full min-w-0 py-2.5 px-3 rounded-lg border border-emerald-100 bg-white text-sm text-[#1C5253] focus:outline-none focus:border-[#1C5253]';
  const labelClass = 'text-xs font-semibold text-[#1C5253] block mb-1';

  return (
    <form onSubmit={enviar} className="space-y-4">
      <p className="text-sm text-gray-600">
        Este rescatista hace una evaluación completa. Respóndele con calma; al final se abre
        WhatsApp con tus respuestas.
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
        <label className={labelClass}>¿Tu vivienda es propia o rentada?</label>
        <BotonSiNo valor={propiedad} onChange={setPropiedad} opciones={['Propia', 'Rentada']} />
      </div>

      {propiedad === 'Rentada' && (
        <div>
          <label className={labelClass}>¿El dueño de la vivienda permite mascotas?</label>
          <BotonSiNo valor={permiteMascotas} onChange={setPermiteMascotas} />
        </div>
      )}

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

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="sticky -bottom-5 -mx-5 -mb-5 px-5 pt-3 pb-4 bg-[#E8F3F1] border-t border-emerald-100 space-y-1">
        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          {enviando ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <MessageCircle className="w-4 h-4 shrink-0" />}
          <span>Enviar por WhatsApp</span>
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="w-full py-2 text-sm font-bold text-gray-500"
        >
          Cancelar
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

        <div className="flex items-start justify-between gap-2 mt-3">
          <h2 className="text-xl font-black text-[#1C5253] min-w-0">{dog.name || 'Sin nombre'}</h2>
          <BotonCompartir
            dog={dog}
            conTexto
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-emerald-100 text-xs font-bold text-[#1C5253]"
          />
        </div>
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
            ) : dog.has_contact ? (
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
    <div style={{ position: 'relative' }}>
      <div className="bg-white rounded-2xl overflow-hidden border border-emerald-100/70 shadow-sm">
        <button onClick={onAbrir} className="block w-full aspect-square bg-[#E8F3F1]">
          {portada && (
            <img
              src={portada}
              alt={dog.name}
              className={`w-full h-full object-cover ${adoptado ? 'grayscale opacity-70' : ''}`}
            />
          )}
        </button>
        <div className="flex items-start gap-1 p-3">
          <button onClick={onAbrir} className="flex-1 min-w-0 text-left">
            <p className="font-black text-[#1C5253] text-sm truncate">{dog.name || 'Sin nombre'}</p>
            <p className="text-[11px] text-gray-500">
              {dog.breed || (dog.species === 'gato' ? 'Gato' : 'Perro')}
              {dog.age_text && ` · ${dog.age_text}`}
            </p>
            {adoptado && dog.got_curpita && (
              <p className="text-[10px] font-bold text-[#1C5253] mt-1 flex items-center gap-1">
                <PawPrint className="w-3 h-3" /> Se fue con su CURPitas
              </p>
            )}
          </button>
          {!adoptado && (
            <BotonCompartir
              dog={dog}
              className="shrink-0 -mt-1.5 -mr-1.5 w-8 h-8 rounded-full flex items-center justify-center text-[#1C5253] hover:bg-[#F4F9F8]"
            />
          )}
        </div>
      </div>
      {adoptado && <SelloAdoptado size={64} style={{ top: -8, left: -8 }} />}
    </div>
  );
};

export const Adopciones = () => {
  const [perros, setPerros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perroAbierto, setPerroAbierto] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .rpc('get_adoptable_dogs')
        .order('status', { ascending: false })
        .order('name');
      const lista = data || [];
      setPerros(lista);
      setLoading(false);

      const idCompartido = params.get('mascota');
      if (idCompartido) {
        for (let i = 0; i < lista.length; i++) {
          if (String(lista[i].id) === idCompartido) setPerroAbierto(lista[i]);
        }
      }
    };
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrarFicha = () => {
    setPerroAbierto(null);
    if (params.get('mascota')) setParams({}, { replace: true });
  };

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

      {perroAbierto && <FichaPerro dog={perroAbierto} onCerrar={cerrarFicha} />}
    </div>
  );
};

export default Adopciones;