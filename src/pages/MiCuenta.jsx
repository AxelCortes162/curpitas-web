import React, { useEffect, useState, useCallback } from 'react';
import { LogOut, Link2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import PetEditorCard from '../components/PetEditorCard';

export const MiCuenta = () => {
  const { user, signOut } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [folio, setFolio] = useState('');
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
  }, [cargarMascotas]);

  const handleClaim = async (e) => {
    e.preventDefault();
    setClaimMsg('');
    setClaiming(true);

    // Solo se puede reclamar una mascota que exista y no tenga dueño todavía
    // (la política de UPDATE en Supabase es la que realmente lo garantiza).
    const { data, error } = await supabase
      .from('pets')
      .update({ owner_id: user.id })
      .eq('curpita', folio.trim())
      .is('owner_id', null)
      .select();

    setClaiming(false);

    if (error) {
      setClaimMsg('Error: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      setClaimMsg('Ese folio no existe o ya fue vinculado a otra cuenta.');
      return;
    }

    setClaimMsg('¡Mascota vinculada! Ya puedes completar sus datos abajo.');
    setFolio('');
    cargarMascotas();
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] p-4 font-sans antialiased">
      <div className="w-full max-w-sm mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-[#1C5253]">Mi cuenta</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

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

        {/* Lista de mascotas */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Mis mascotas
        </p>

        {loading && <p className="text-xs text-gray-400">Cargando...</p>}

        {!loading && pets.length === 0 && (
          <p className="text-xs text-gray-400">
            Aún no tienes mascotas vinculadas. Usa el formulario de arriba con el folio de tu placa.
          </p>
        )}

        <div className="space-y-3">
          {pets.map((pet) => (
            <PetEditorCard
              key={pet.id}
              pet={pet}
              onUpdated={cargarMascotas}
              onDeleted={cargarMascotas}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiCuenta;