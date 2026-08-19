import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, revisamos si ya hay una sesión guardada (usuario ya logueado antes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Nos suscribimos a cambios de sesión (login, logout, token renovado, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Registra un nuevo dueño. El nombre y teléfono viajan como "metadata" del
  // usuario; un trigger en la base de datos crea automáticamente su fila en
  // "profiles" apenas se crea el usuario (ver supabase_trigger_profiles.sql).
  const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  };

  // No renderizamos nada hasta saber si hay sesión o no, para evitar parpadeos raros
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Hook para usar el contexto fácilmente desde cualquier componente:
// const { user, signIn, signOut } = useAuth();
export const useAuth = () => useContext(AuthContext);