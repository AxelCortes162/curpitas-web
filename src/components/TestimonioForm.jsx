import React, { useEffect, useState } from 'react';
import { Star, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export const TestimonioForm = () => {
  const { user } = useAuth();
  const [misTestimonio, setMisTestimonio] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ciudad, setCiudad] = useState('');
  const [rating, setRating] = useState(0);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();
    setMisTestimonio(data);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnviar = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }
    if (texto.trim().length < 10) {
      setError('Escribe un poco más sobre tu experiencia (mínimo 10 caracteres).');
      return;
    }

    setEnviando(true);

    // Traemos el nombre del perfil para usarlo como nombre público del testimonio
    const { data: perfil } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { error: insertError } = await supabase.from('testimonials').insert({
      owner_id: user.id,
      name: perfil?.full_name || 'Cliente CURPitas',
      city: ciudad || null,
      rating,
      text: texto.trim(),
    });

    setEnviando(false);

    if (insertError) {
      setError('No se pudo enviar: ' + insertError.message);
      return;
    }

    cargar();
  };

  const handleBorrar = async () => {
    await supabase.from('testimonials').delete().eq('owner_id', user.id);
    setMisTestimonio(null);
    setRating(0);
    setTexto('');
    setCiudad('');
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm p-4">
      <p className="text-xs font-bold text-[#1C5253] mb-1">Tu testimonio</p>

      {misTestimonio ? (
        <div>
          <div className="flex gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= misTestimonio.rating ? 'fill-[#88D49E] text-[#88D49E]' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 italic">"{misTestimonio.text}"</p>

          {misTestimonio.approved ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-2">
              <CheckCircle2 className="w-3 h-3" /> Publicado en la página
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-2">
              <Clock className="w-3 h-3" /> En revisión, pronto lo publicamos
            </span>
          )}

          <button
            onClick={handleBorrar}
            className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline mt-3"
          >
            <Trash2 className="w-3 h-3" /> Borrar y escribir otro
          </button>
        </div>
      ) : (
        <form onSubmit={handleEnviar} className="space-y-2.5">
          <p className="text-[11px] text-gray-400">
            Cuéntale a otros dueños tu experiencia con CURPitas.
          </p>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="p-0.5"
              >
                <Star
                  className={`w-6 h-6 ${i <= rating ? 'fill-[#88D49E] text-[#88D49E]' : 'fill-gray-200 text-gray-200'}`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="¿Cómo te ha ayudado CURPitas?"
            className="w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />

          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Tu ciudad (opcional)"
            className="w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
          />

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2.5 bg-[#1C5253] hover:bg-[#164343] text-white font-bold rounded-xl text-xs disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar testimonio'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TestimonioForm;