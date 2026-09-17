import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert, CheckCircle2, PawPrint } from 'lucide-react';

// ---------------------------------------------------------------------------
// CARRUSEL DE MASCOTAS — mismo mecanismo 3D que FotoCarrusel3D (el de
// Adopciones), pero aquí cada tarjeta es una mascota distinta, no una foto
// distinta de la misma mascota. La tarjeta central queda sin rotación (por
// eso es la única con onClick real); las de los lados solo se ven, giradas
// y atenuadas, para dar la sensación de "hay más" sin ocupar tanto alto de
// pantalla.
//
// El carrusel solo elige CUÁL mascota está activa (`indice`) — quien lo usa
// (MiCuenta.jsx) es quien decide qué mostrar debajo para esa mascota activa
// (el editor completo). Así esta tarjeta se queda chica y rápida de leer, en
// vez de tener que meter el formulario de edición completo dentro del
// carrusel, que con la perspectiva 3D se volvería inservible.
// ---------------------------------------------------------------------------

export const CarruselMascotas = ({ pets, indice, onCambiar }) => {
  const total = pets.length;
  const tocandoRef = useRef(null);

  const avanzar = (direccion) => onCambiar((indice + direccion + total) % total);

  const handleTouchStart = (e) => {
    tocandoRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (tocandoRef.current === null) return;
    const delta = e.changedTouches[0].clientX - tocandoRef.current;
    if (Math.abs(delta) > 40) avanzar(delta < 0 ? 1 : -1);
    tocandoRef.current = null;
  };

  if (total === 0) return null;

  return (
    <div className="relative">
      <div
        className="relative h-44 flex items-center justify-center overflow-hidden"
        style={{ perspective: '1200px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pets.map((pet, i) => {
          let offset = i - indice;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const activa = offset === 0;
          const translateX = offset * 110;
          const rotateY = offset * -32;
          const scale = 1 - abs * 0.16;
          const opacity = 1 - abs * 0.45;

          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => !activa && onCambiar(i)}
              className="absolute w-32 rounded-2xl bg-white border border-emerald-100/80 shadow-md overflow-hidden transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex: 10 - abs,
                cursor: activa ? 'default' : 'pointer',
              }}
            >
              <div className="pt-3 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#E8F3F1] border-2 border-emerald-100 flex items-center justify-center">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-5 h-5 text-[#1C5253]/30" />
                  )}
                </div>
              </div>
              <div className="px-2 py-2 text-center">
                <p className="font-black text-[#1C5253] text-xs truncate">{pet.name || 'Sin nombre'}</p>
                <p className="font-mono text-[9px] text-gray-400 truncate">{pet.curpita}</p>
                {pet.is_lost ? (
                  <span className="inline-flex items-center gap-1 text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full uppercase mt-1">
                    <ShieldAlert className="w-2 h-2" /> Perdida
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[8px] font-black text-[#1C5253] bg-[#88D49E] px-1.5 py-0.5 rounded-full uppercase mt-1">
                    <CheckCircle2 className="w-2 h-2" /> A salvo
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={() => avanzar(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#1C5253] z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => avanzar(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#1C5253] z-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex justify-center gap-1.5 mt-2">
            {pets.map((_, i) => (
              <button
                key={i}
                onClick={() => onCambiar(i)}
                className={`w-1.5 h-1.5 rounded-full ${i === indice ? 'bg-[#1C5253]' : 'bg-emerald-100'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CarruselMascotas;
