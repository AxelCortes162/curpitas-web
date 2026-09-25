import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin } from 'lucide-react';
import Logotipo from '../components/Logotipo';

export const NoEncontrada = () => (
  <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center px-6 py-10 text-center">
    <Link to="/" className="flex items-center gap-2 mb-10">
      <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
      <Logotipo className="text-lg" />
    </Link>

    <p className="font-black text-[#1C5253] text-7xl leading-none tracking-tight">
      4<span className="text-[#399D56]">0</span>4
    </p>
    <h1 className="text-2xl font-black text-[#1C5253] mt-4 leading-tight max-w-xs">
      Esta página se perdió
    </h1>
    <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
      No encontramos lo que buscabas. Por suerte, sabemos cómo encontrar el camino de regreso a casa.
    </p>

    <Link
      to="/"
      className="mt-8 w-full max-w-xs py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2"
    >
      <ArrowLeft className="w-4 h-4" /> Volver al inicio
    </Link>

    <div className="mt-3 w-full max-w-xs grid grid-cols-2 gap-2">
      <Link
        to="/mapa"
        className="py-3 bg-white border border-emerald-100 text-[#1C5253] font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5"
      >
        <MapPin className="w-4 h-4" /> Perdidas
      </Link>
      <Link
        to="/adopciones"
        className="py-3 bg-white border border-emerald-100 text-[#1C5253] font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5"
      >
        <Heart className="w-4 h-4" /> Adopción
      </Link>
    </div>

    <p className="text-xs text-gray-400 mt-8 max-w-xs">
      ¿Escaneaste una placa y llegaste aquí? Revisa que la liga esté completa o escríbenos por WhatsApp.
    </p>
  </div>
);

export default NoEncontrada;
