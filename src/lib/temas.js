// Temas de edición especial. La fecha de cierre y el número de piezas viven
// en la tabla pet_themes; aquí solo el nombre. El estilo está en index.css
// bajo .tema-<id>.
export const TEMAS = {
  muertos_2026: { nombre: 'Día de Muertos 2026' },
};

// La edición cuyas placas numeradas se están vendiendo ahora
export const EDICION_PLACA = 'muertos_2026';

// 7 de 50 -> "07 / 50"
export const numeroPlaca = (n, total) =>
  `${String(n).padStart(String(total).length, '0')} / ${total}`;
