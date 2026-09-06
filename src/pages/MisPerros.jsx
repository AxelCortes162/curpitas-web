import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Plus, Heart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import PerroAdopcionCard from '../components/PerroAdopcionCard';

export const MisPerros = () => {
  const { user, signOut } = useAuth();
  const [perros, setPerros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('adoptable_dogs')
      .select('*')
      .eq('rescuer_id', user.id)
      .order('created_at', { ascending: false });
    setPerros(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const agregarPerro = async () => {
    setCreando(true);
    await supabase.from('adoptable_dogs').insert({
      rescuer_id: user.id,
      name: '',
    });
    setCreando(false);
    cargar();
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-5">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CURPitas" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="text-xl font-black text-[#1C5253] leading-none">Mis perros</h1>
              <p className="text-xs text-gray-400 mt-0.5">en adopción</p>
            </div>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

        <Link
          to="/adopciones"
          className="flex items-center gap-1.5 text-xs font-bold text-[#1C5253] hover:underline mb-4"
        >
          <Heart className="w-3.5 h-3.5" /> Ver página pública de adopciones
        </Link>

        <button
          onClick={agregarPerro}
          disabled={creando}
          className="w-full py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-60 mb-4"
        >
          <Plus className="w-4 h-4" />
          {creando ? 'Agregando...' : 'Agregar perro en adopción'}
        </button>

        {loading && <p className="text-xs text-gray-400">Cargando...</p>}
        {!loading && perros.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">
            Aún no tienes perros publicados. Usa el botón de arriba para agregar el primero.
          </p>
        )}

        <div className="space-y-3">
          {perros.map((dog) => (
            <PerroAdopcionCard key={dog.id} dog={dog} onUpdated={cargar} onDeleted={cargar} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MisPerros;