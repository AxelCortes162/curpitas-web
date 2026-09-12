import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// LAS FOTOS DE LAS PLACAS
//
// Para agregar una foto: ponla en public/placas/ y agrega una entrada aquí.
// El orden importa: en un carrusel de página de inicio la mayoría de la gente
// no desliza, así que la primera tiene que vender sola. Deja arriba la mejor.
//
// Cada foto necesita ancho y alto reales (los de la imagen), para que el
// espacio ya esté reservado y la página no brinque al cargar.
//
// Las imágenes son WebP con transparencia: las placas van recortadas, sin
// fondo. Antes traían su propio fondo gris claro y, metidas en una tarjeta
// blanca sobre una página casi blanca, se veían tres blancos distintos como
// parches. Recortadas se apoyan directo sobre el color de la página.
// ---------------------------------------------------------------------------
const FOTOS = [
  {
    id: 'hueso-verde',
    src: '/placas/hueso-verde.webp',
    ancho: 1000,
    alto: 567,
    // El alt lo lee quien no ve la imagen, y también Google.
    alt: 'Placa de hueso en resina verde con glitter, por el frente con el nombre '
       + 'Bebo grabado y el escudo de CURPitas, y por el reverso con el código QR '
       + 'que lleva a curpitas.com.',
    pie: 'Hueso verde glitter — frente y reverso',
  },
  {
    id: 'circulo-menta',
    src: '/placas/circulo-menta.webp',
    ancho: 900,
    alto: 772,
    alt: 'Placa redonda en resina verde menta con glitter, por el frente con el '
       + 'escudo de CURPitas y por el reverso con el código QR.',
    pie: 'Círculo menta glitter — frente y reverso',
  },
];

export default function CarruselPlacas({ fotos = FOTOS }) {
  const [indice, setIndice] = useState(0);
  const tocandoRef = useRef(null);
  const total = fotos.length;
  const variasFotos = total > 1;

  const avanzar = (direccion) => {
    setIndice((prev) => (prev + direccion + total) % total);
  };

  const handleTouchStart = (e) => {
    tocandoRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (tocandoRef.current === null) return;
    const delta = e.changedTouches[0].clientX - tocandoRef.current;
    if (Math.abs(delta) > 40) avanzar(delta < 0 ? 1 : -1);
    tocandoRef.current = null;
  };

  // Con una sola foto no hay nada que recorrer: se muestra sola, sin flechas
  // ni puntos que no llevan a ningún lado.
  if (!variasFotos) {
    const f = fotos[0];
    return (
      <figure className="m-0">
        <img
          src={f.src}
          alt={f.alt}
          width={f.ancho}
          height={f.alto}
          className="w-full h-auto block"
          style={{ filter: 'drop-shadow(0 14px 18px rgba(16,41,42,.18))' }}
        />
        {f.pie && <figcaption className="sr-only">{f.pie}</figcaption>}
      </figure>
    );
  }

  return (
    <div className="relative">
      {/* Se muestra UNA placa a la vez, lo más grande que quepa.
          Antes se veía también la de al lado, girada en perspectiva, copiando
          el carrusel de testimonios. Con la placa grande esa vecina quedaba
          cortada por el borde de la columna y se leía como algo roto, no como
          "la siguiente". Y con solo dos fotos la perspectiva no aportaba nada:
          para eso están las flechas y los puntos. */}
      <div
        className="relative h-[260px] sm:h-[340px] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="group"
        aria-roledescription="carrusel"
        aria-label="Fotos de las placas"
      >
        {fotos.map((f, i) => {
          let offset = i - indice;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;

          const activa = offset === 0;

          return (
            <div
              key={f.id}
              className={
                'absolute inset-0 '
                + 'transition-all duration-500 ease-out motion-reduce:transition-none'
              }
              style={{
                // La que no está al frente se va de lado y se apaga, en vez de
                // quedarse a medias dentro del recuadro.
                transform: `translateX(${offset * 48}px)`,
                opacity: activa ? 1 : 0,
                pointerEvents: activa ? 'auto' : 'none',
                zIndex: activa ? 10 : 1,
              }}
              aria-hidden={activa ? undefined : true}
            >
              {/* Sin tarjeta ni recuadro: la placa va recortada y se apoya en
                  el color de la página. La sombra es drop-shadow, no
                  box-shadow: sigue la silueta de la placa en vez de dibujar un
                  rectángulo.

                  La imagen ocupa la caja completa con object-contain, en vez de
                  centrarse con max-height. Con `place-items-center` la fila del
                  grid se dimensiona por el contenido, así que `max-h-full` se
                  medía contra la propia imagen y no contra el contenedor, y la
                  placa se salía por abajo. */}
              <img
                src={f.src}
                alt={f.alt}
                width={f.ancho}
                height={f.alto}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-contain block"
                style={{ filter: 'drop-shadow(0 14px 18px rgba(16,41,42,.20))' }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* El pie visible decía "Hueso verde glitter — frente y reverso": letrero
          de museo al lado de una foto de producto. Se queda solo como aviso
          para lectores de pantalla, que sí necesitan saber cuál está al frente. */}
      <p className="sr-only" aria-live="polite">{fotos[indice].pie}</p>

      <button
        onClick={() => avanzar(-1)}
        className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-emerald-100 shadow-md flex items-center justify-center text-[#1C5253] hover:bg-emerald-50 z-20"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => avanzar(1)}
        className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-emerald-100 shadow-md flex items-center justify-center text-[#1C5253] hover:bg-emerald-50 z-20"
        aria-label="Foto siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="flex justify-center gap-1.5 mt-4">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setIndice(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === indice ? 'bg-[#1C5253]' : 'bg-emerald-100'
            }`}
            aria-label={`Ir a la foto ${i + 1} de ${total}`}
            aria-current={i === indice ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
