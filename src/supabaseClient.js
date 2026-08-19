import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Este objeto "supabase" es tu conexión a la base de datos.
// Lo vas a importar en cualquier archivo donde necesites leer o guardar datos,
// por ejemplo: import { supabase } from '../supabaseClient';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);