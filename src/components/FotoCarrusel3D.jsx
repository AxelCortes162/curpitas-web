import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const FotoCarrusel3D = ({ fotos }) => {
  const [indice, setIndice] = useState(0);
  const total = fotos.length;
  const tocandoRef = useRef(null);

  const avanzar = (direccion) => setIndice((prev) => (prev + direccion + total) % total);

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
        className="relative h-64 flex items-center justify-center overflow-hidden"
        style={{ perspective: '1200px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {fotos.map((url, i) => {
          let offset = i - indice;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const translateX = offset * 130;
          const rotateY = offset * -32;
          const scale = 1 - abs * 0.18;
          const opacity = 1 - abs * 0.45;

          return (
            <div
              key={url + i}
              className="absolute w-48 h-56 rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex: 10 - abs,
              }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
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
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndice(i)}
                className={`w-1.5 h-1.5 rounded-full ${i === indice ? 'bg-[#1C5253]' : 'bg-emerald-100'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FotoCarrusel3D;