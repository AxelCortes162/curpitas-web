import React from 'react';
import { Link } from 'react-router-dom';
import Logotipo from './Logotipo';

// Logo + nombre, clickeable, para volver a la pantalla de Inicio desde
// cualquier pantalla interna (Registro, Iniciar sesión, Mi cuenta, etc.)
export const BrandHeader = () => (
  <Link to="/" className="flex items-center justify-center gap-2 mb-6">
    <img src="/logo.png" alt="CURPitas" className="w-10 h-10 object-contain" />
    <Logotipo className="text-lg" />
  </Link>
);

export default BrandHeader;