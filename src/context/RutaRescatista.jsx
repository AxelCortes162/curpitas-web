import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

export const RutaRescatista = ({ children }) => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [esRescatista, setEsRescatista] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_rescuer')
        .eq('id', user.id)
        .single();

      setEsRescatista(data?.is_rescuer === true);
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

  if (!esRescatista) {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return children;
};

export default RutaRescatista;