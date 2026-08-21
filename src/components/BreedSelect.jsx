import React, { useState, useRef, useEffect } from 'react';
import { Search, PenLine } from 'lucide-react';

export const RAZAS_PERRO = [
  'Labrador Retriever',
  'Golden Retriever',
  'Pastor Alemán',
  'Chihuahua',
  'Pug',
  'Bulldog Francés',
  'Bulldog Inglés',
  'Poodle / Caniche',
  'Schnauzer',
  'Yorkshire Terrier',
  'Boxer',
  'Rottweiler',
  'Doberman',
  'Husky Siberiano',
  'Beagle',
  'Cocker Spaniel',
  'Dálmata',
  'Gran Danés',
  'San Bernardo',
  'Border Collie',
  'Shih Tzu',
  'Maltés',
  'Salchicha (Dachshund)',
  'Pitbull',
  'Xoloitzcuintle',
  'Criollo / Caramelo',
];

export const RAZAS_GATO = [
  'Persa',
  'Siamés',
  'Maine Coon',
  'Angora',
  'Bengalí',
  'Esfinge (Sphynx)',
  'Ragdoll',
  'Británico de Pelo Corto',
  'Común Europeo / Criollo',
];

// Selector de raza con buscador. Si la especie es "otro", se salta la lista
// y deja escribir libremente. Siempre hay una opción "+ Otro" al final de
// la lista para cuando la raza no aparece (o quieren poner algo como
// "Doberman de Temu" 😄).
export const BreedSelect = ({ species, value, onChange }) => {
  const lista = species === 'gato' ? RAZAS_GATO : RAZAS_PERRO;
  const [modoManual, setModoManual] = useState(value !== '' && !lista.includes(value));
  const [query, setQuery] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const cerrarSiClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', cerrarSiClickAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiClickAfuera);
  }, []);

  if (species === 'otro' || modoManual) {
    return (
      <div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe la raza (o lo que sea 😄)"
          className="w-full py-2 px-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        />
        {species !== 'otro' && (
          <button
            type="button"
            onClick={() => {
              setModoManual(false);
              onChange('');
            }}
            className="text-[10px] font-bold text-[#1C5253] hover:underline mt-1"
          >
            Mejor elegir de la lista
          </button>
        )}
      </div>
    );
  }

  const filtradas = lista.filter((r) => r.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={contenedorRef}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          value={abierto ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => {
            setQuery('');
            setAbierto(true);
          }}
          placeholder={value || 'Buscar raza...'}
          className="w-full py-2 pl-8 pr-2.5 rounded-lg border border-emerald-100 bg-[#F4F9F8] text-xs text-[#1C5253]"
        />
      </div>

      {abierto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-emerald-100 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtradas.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-gray-400">Sin resultados</p>
          )}
          {filtradas.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                onChange(r);
                setAbierto(false);
                setQuery('');
              }}
              className="block w-full text-left px-3 py-2 text-xs text-[#1C5253] hover:bg-emerald-50"
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setModoManual(true);
              setAbierto(false);
              onChange('');
            }}
            className="flex items-center gap-1.5 w-full text-left px-3 py-2 text-xs font-bold text-[#1C5253] hover:bg-emerald-50 border-t border-emerald-100"
          >
            <PenLine className="w-3 h-3" /> Otro (escribir yo mismo)
          </button>
        </div>
      )}
    </div>
  );
};

export default BreedSelect;