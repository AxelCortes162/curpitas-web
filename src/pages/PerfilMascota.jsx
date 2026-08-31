import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PetProfile from '../components/PetProfile';

export const PerfilMascota = () => {
  const { curpita } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | no_existe | invalidado | sin_reclamar

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      setLoading(true);

      // Primero revisamos el estado general del folio (existe, está
      // invalidado, o ya fue reclamado) — esto funciona incluso para
      // folios sin dueño todavía, a diferencia de la vista de perfil.
      const { data: status } = await supabase
        .from('pet_status_public')
        .select('*')
        .eq('curpita', curpita)
        .maybeSingle();

      if (!activo) return;

      if (!status) {
        setEstado('no_existe');
        setLoading(false);
        return;
      }

      if (status.invalidated) {
        setEstado('invalidado');
        setLoading(false);
        return;
      }

      if (!status.reclamada) {
        setEstado('sin_reclamar');
        setLoading(false);
        return;
      }

      // Folio válido y reclamado: ahora sí traemos el perfil público completo
      const { data, error } = await supabase
        .from('pet_public_profile')
        .select('*')
        .eq('curpita', curpita)
        .maybeSingle();

      if (!activo) return;

      if (error || !data) {
        setEstado('no_existe');
      } else {
        setPet(data);
        setEstado('ok');
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

  if (estado === 'invalidado') {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <Ban className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-lg font-black text-[#1C5253] mb-2">Este código fue desactivado</p>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          El folio "{curpita}" ya no está activo. Si crees que esto es un error, contáctanos.
        </p>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#1C5253] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (estado === 'no_existe' || estado === 'sin_reclamar') {
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