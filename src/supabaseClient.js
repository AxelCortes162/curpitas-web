import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Este objeto "supabase" es tu conexión a la base de datos.
// Lo vas a importar en cualquier archivo donde necesites leer o guardar datos,
// por ejemplo: import { supabase } from '../supabaseClient';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ---------------------------------------------------------------------------
// SESIÓN VENCIDA — cuando alguien deja una pestaña abierta (el panel de
// producción, por ejemplo) sin tocarla por un rato largo, o la compu se
// suspende, el token de acceso vence (dura 1 hora) y el refresco automático
// de supabase-js puede no alcanzar a renovarlo a tiempo: los timers de una
// pestaña en segundo plano, o de una compu dormida, no corren. El resultado
// es un 401 "JWT expired" en la primera acción que se hace al volver.
//
// Dos capas para que eso no se sienta como un error:
//
// 1) Proactiva: en cuanto la pestaña vuelve a estar visible, se revisa la
//    sesión. getSession() de supabase-js ya renueva sola si hace falta, así
//    que para cuando alguien alcanza a hacer clic en algo, el token ya está
//    fresco casi siempre.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession();
    }
  });
}

// 2) Reactiva: por si de todos modos una llamada alcanza a salir con el
//    token vencido (carrera entre el clic y la renovación), este envoltorio
//    detecta el 401 de JWT vencido, renueva la sesión, y reintenta esa misma
//    llamada UNA vez, todo de forma transparente para quien esté usando el
//    panel.
export const esErrorDeSesionVencida = (error) => !!error && (
  error.status === 401 || /jwt expired|jwt is expired|invalid jwt/i.test(error.message || '')
);

// Uso: const { data, error } = await conReintentoDeSesion(() => supabase.rpc(...));
export const conReintentoDeSesion = async (llamada) => {
  const primero = await llamada();
  if (!esErrorDeSesionVencida(primero.error)) return primero;

  const { error: errorRefresh } = await supabase.auth.refreshSession();
  if (errorRefresh) return primero; // no se pudo renovar (p.ej. hay que iniciar sesión otra vez)

  return llamada();
};