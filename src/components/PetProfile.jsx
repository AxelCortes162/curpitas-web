import React, { useState } from 'react';
import { Phone, ShieldAlert, MapPin, AlertCircle, Share2, CheckCircle2, Cake } from 'lucide-react';

// Calcula la edad en años/meses a partir de la fecha de nacimiento (formato DD/MM/YYYY)
const getAge = (birthDateStr) => {
  const [day, month, year] = birthDateStr.split('/').map(Number);
  const birth = new Date(year, month - 1, day);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }

  if (years <= 0) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  return `${years} ${years === 1 ? 'año' : 'años'}`;
};

export const PetProfile = ({ pet }) => {
  // Estado para saber si la mascota está marcada como perdida.
  // Arranca con el valor que traiga "pet", o true si no se especificó.
  const [isLost, setIsLost] = useState(pet.isLost ?? true);

  return (
    <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
      {/* Contenedor Principal (Credencial Digital) */}
      <div className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden border border-emerald-100/60 relative">
        
        {/* Banner de Estado / Alerta */}
        <div className={`p-3 text-center text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 ${isLost ? 'bg-red-500 shadow-inner' : 'bg-[#1C5253]'}`}>
          {isLost ? (
            <>
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>¡MASCOTA REPORTADA COMO PERDIDA!</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#88D49E]" />
              <span>IDENTIFICACIÓN OFICIAL VITAL</span>
            </>
          )}
        </div>

        {/* Encabezado Hero Simplificado y Centrado */}
        <div className="bg-[#1C5253] pt-12 pb-16 px-6 text-center relative overflow-hidden flex flex-col items-center justify-center">
          {/* Marca de agua CENTRADA */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <img src="/logo.png" alt="" className="w-40 h-40 object-contain invert" />
          </div>

          {/* Espacio limpio y centrado antes de la foto */}
        </div>

        {/* Foto de la Mascota */}
        <div className="-mt-14 flex justify-center relative z-10">
          <div className="relative">
            <img 
              src={pet.photo} 
              alt={pet.name} 
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
            />
            {/* Ícono de verificado sobre la foto */}
            <div className="absolute bottom-1 right-1 bg-[#88D49E] p-1.5 rounded-full border-2 border-white shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1C5253]" />
            </div>
          </div>
        </div>

        {/* Detalles de Identidad */}
        <div className="px-6 pb-6 pt-2 text-center">
          <h1 className="text-2xl font-black text-[#1C5253] tracking-wide">{pet.name}</h1>
          <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest mt-0.5">Credencial Digital de Mascota</p>

          {/* Ubicación y edad rápida, debajo del nombre */}
          <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-gray-500 font-semibold">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {pet.city}
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <Cake className="w-3 h-3" />
              {getAge(pet.birthDate)}
            </span>
          </div>

          {/* Tarjeta de Datos Estilo INE */}
          <div className="bg-[#F4F9F8] rounded-2xl p-4 mt-4 space-y-2 text-xs text-left border border-emerald-100/80 shadow-sm">
            <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
              <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">Folio CURPITA</span>
              <span className="font-extrabold text-[#1C5253] font-mono bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-2xs">{pet.curpita}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-emerald-100 pb-1.5">
              <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">Nacimiento</span>
              <span className="font-bold text-gray-700">{pet.birthDate}</span>
            </div>

            <div className="flex justify-between items-center border-b border-emerald-100 pb-1.5">
              <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">Raza</span>
              <span className="font-bold text-gray-700">{pet.breed}</span>
            </div>

            <div className="flex justify-between items-center border-b border-emerald-100 pb-1.5">
              <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">Tutor Responsable</span>
              <span className="font-bold text-gray-700">{pet.owner}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold text-[10px] tracking-wider uppercase">Teléfono</span>
              <span className="font-bold text-gray-700">{pet.phone}</span>
            </div>
          </div>

          {/* Alerta Médica Importante */}
          {pet.medicalInfo && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 mt-3 text-left flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-950">Atención médica prioritaria:</span>
                <span className="text-amber-800 text-[11px] leading-tight block mt-0.5">{pet.medicalInfo}</span>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="mt-5 space-y-2">
            <a 
              href={`tel:${pet.phone}`}
              className="w-full py-3.5 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 text-sm active:scale-[0.99] transition-transform"
            >
              <Phone className="w-4 h-4 fill-current" />
              Llamar al Tutor Ahora
            </a>

            <button 
              onClick={() => alert("Ubicación compartida con el dueño.")}
              className="w-full py-2.5 bg-white border-2 border-[#1C5253] text-[#1C5253] font-bold rounded-2xl flex items-center justify-center gap-2 text-xs hover:bg-emerald-50/50 active:scale-[0.99] transition-transform"
            >
              <MapPin className="w-3.5 h-3.5" />
              Compartir mi ubicación GPS
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F4F9F8] px-5 py-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-medium">Sistema de Seguridad CURPitas</span>
          <button 
            onClick={() => setIsLost(!isLost)}
            className="flex items-center gap-1 text-[#1C5253] font-bold hover:underline"
          >
            <Share2 className="w-3 h-3" /> Estado
          </button>
        </div>

      </div>
    </div>
  );
};

export default PetProfile;