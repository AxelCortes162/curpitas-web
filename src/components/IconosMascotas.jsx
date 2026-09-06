import React from 'react';

// Ícono de gato, estilo línea (mismo lenguaje visual que los íconos de Lucide
// que ya usa el resto de la app: trazo, sin relleno, puntas redondeadas).
export const IconoGato = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="6,10 4,4 10,9" />
    <polyline points="18,10 20,4 14,9" />
    <circle cx="12" cy="13" r="6" />
    <circle cx="10.2" cy="11.8" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="13.8" cy="11.8" r="0.6" fill="currentColor" stroke="none" />
    <path d="M11 15h2l-1 1.3z" fill="currentColor" stroke="none" />
    <path d="M2 12.5l4-0.7M2 15l4-0.7" />
    <path d="M22 12.5l-4-0.7M22 15l-4-0.7" />
  </svg>
);

// Ícono para "otra mascota" (conejo), mismo estilo.
export const IconoOtraMascota = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <ellipse cx="8.7" cy="7" rx="1.8" ry="6.2" />
    <ellipse cx="15.3" cy="7" rx="1.8" ry="6.2" />
    <ellipse cx="12" cy="17" rx="6" ry="5" />
    <circle cx="10.2" cy="16.1" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="13.8" cy="16.1" r="0.6" fill="currentColor" stroke="none" />
    <path d="M11 18.5h2l-1 1.3z" fill="currentColor" stroke="none" />
  </svg>
);