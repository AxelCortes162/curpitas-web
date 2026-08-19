import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPetByCurpita } from '../data/pets';
import PetProfile from '../components/PetProfile';

export const PerfilMascota = () => {
  // useParams lee el ":curpita" que definimos en la ruta dentro de App.jsx
  const { curpita } = useParams();
  const pet = getPetByCurpita(curpita);

  // Si no existe ninguna mascota con ese folio, mostramos un mensaje en vez de romper la app
  if (!pet) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-lg font-black text-[#1C5253] mb-2">Mascota no encontrada</p>
        <p className="text-sm text-gray-500 mb-6">
          No existe ninguna mascota registrada con el folio "{curpita}".
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold text-[#1C5253] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la búsqueda
        </Link>
      </div>
    );
  }

  return <PetProfile pet={pet} />;
};

export default PerfilMascota;