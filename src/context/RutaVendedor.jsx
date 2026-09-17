import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase, conReintentoDeSesion } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// Igual que RutaAdmin, pero para el dashboard del vendedor: solo deja pasar
// si hay una fila en `vendedores` con este id y sigue activo. Un vendedor
// desactivado se trata igual que uno que nunca existió — no ve nada.
export const RutaVendedor = ({ children }) => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [esVendedor, setEsVendedor] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await conReintentoDeSesion(() => supabase
        .from('vendedores')
        .select('activo')
        .eq('id', user.id)
        .maybeSingle());

      setEsVendedor(data?.activo === true);
      setChecking(false);
    };
    verificar();
  }, [user.id]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center">
        <p className="text-sm text-gray-400">Verificando acceso...</p>
      </div>
    );
  }

  if (!esVendedor) {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return children;
};

export default RutaVendedor;
