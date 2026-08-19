import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { pets } from '../data/pets';

export const BuscarMascota = () => {
  const [query, setQuery] = useState('');

  const resultados = pets.filter((pet) => {
    const texto = query.toLowerCase();
    return (
      pet.name.toLowerCase().includes(texto) ||
      pet.curpita.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="min-h-screen bg-[#E8F3F1] flex items-start justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm mt-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[#1C5253]">CURPitas</h1>
          <p className="text-xs font-bold text-emerald-800/60 uppercase tracking-widest mt-1">
            Buscar mascota por folio o nombre
          </p>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. MAYA o CURPITA80233025"
            className="w-full py-3 pl-10 pr-4 rounded-2xl border border-emerald-100 bg-white shadow-sm text-sm text-[#1C5253] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
          />
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          {resultados.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-8">
              No se encontraron mascotas con ese folio o nombre.
            </p>
          )}

          {resultados.map((pet) => (
            <Link
              key={pet.curpita}
              to={`/mascota/${pet.curpita}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-emerald-100/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="flex-1 text-left">
                <p className="font-black text-sm text-[#1C5253]">{pet.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{pet.curpita}</p>
              </div>
              {pet.isLost ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                  <ShieldAlert className="w-3 h-3" /> Perdida
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#1C5253] uppercase">
                  <CheckCircle2 className="w-3 h-3 text-[#88D49E]" /> A salvo
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuscarMascota;