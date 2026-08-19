import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PetProfile from '../components/PetProfile';

export const PerfilMascota = () => {
  const { curpita } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      setLoading(true);
      setNotFound(false);

      // "pet_public_profile" es la VISTA que ya armamos en Supabase: solo
      // devuelve los campos que el dueño marcó como visibles, más el
      // teléfono, que siempre viene incluido.
      const { data, error } = await supabase
        .from('pet_public_profile')
        .select('*')
        .eq('curpita', curpita)
        .maybeSingle();

      if (!activo) return;

      if (error || !data) {
        setNotFound(true);
      } else {
        setPet(data);
      }
      setLoading(false);
    };

    cargarPerfil();
    return () => {
      activo = false;
    };
  }, [curpita]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  if (notFound || !pet) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-lg font-black text-[#1C5253] mb-2">Mascota no encontrada</p>
        <p className="text-sm text-gray-500 mb-6">
          No existe ninguna mascota registrada con el folio "{curpita}", o todavía no ha sido
          vinculada a una cuenta.
        </p>
        <Link to="/iniciar-sesion" className="flex items-center gap-2 text-sm font-bold text-[#1C5253] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return <PetProfile pet={pet} />;
};

export default PerfilMascota;