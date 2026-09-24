import React from 'react';

// El nombre de la marca: CURP en Poppins Black e ITAS en SemiBold.
// Sobre fondo claro ITAS va en un menta más oscuro (#399D56) para que se lea
// contra el crema; sobre fondo oscuro, CURP va en blanco e ITAS en el menta
// original (#88D49E).
export const Logotipo = ({ className = '', sobreOscuro = false }) => (
  <span className={`whitespace-nowrap leading-none ${className}`}>
    <span className={`font-black tracking-[-0.01em] ${sobreOscuro ? 'text-white' : 'text-[#1C5253]'}`}>
      CURP
    </span>
    <span className={`font-semibold tracking-[0.02em] ${sobreOscuro ? 'text-[#88D49E]' : 'text-[#399D56]'}`}>
      ITAS
    </span>
  </span>
);

export default Logotipo;
