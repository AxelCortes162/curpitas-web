import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Envuelve cualquier pantalla que solo deba verse si el usuario inició sesión.
// Uso: <RutaProtegida><MiCuenta /></RutaProtegida>
export const RutaProtegida = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return children;
};

export default RutaProtegida;