import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

// Igual que RutaProtegida, pero además verifica que el usuario tenga
// is_admin = true en su perfil antes de dejarlo pasar.
export const RutaAdmin = ({ children }) => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setEsAdmin(data?.is_admin === true);
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

  if (!esAdmin) {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return children;
};

export default RutaAdmin;