import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Ban, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandHeader from '../components/BrandHeader';

// Mismo criterio que en el registro: 8 caracteres, al menos una letra y un número.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const calcularFuerza = (pwd) => {
  if (!pwd) return { nivel: 0, texto: '', color: '' };
  let puntos = 0;
  if (pwd.length >= 8) puntos++;
  if (pwd.length >= 12) puntos++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) puntos++;
  if (/\d/.test(pwd)) puntos++;
  if (/[^A-Za-z0-9]/.test(pwd)) puntos++;

  if (puntos <= 2) return { nivel: 1, texto: 'Débil', color: 'text-red-500' };
  if (puntos === 3) return { nivel: 2, texto: 'Aceptable', color: 'text-amber-600' };
  if (puntos === 4) return { nivel: 3, texto: 'Buena', color: 'text-emerald-600' };
  return { nivel: 4, texto: 'Muy buena', color: 'text-emerald-700' };
};

export const RestablecerContrasena = () => {
  const navigate = useNavigate();

  // esperando | listo | enlace_invalido | guardado
  const [estado, setEstado] = useState('esperando');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fuerza = calcularFuerza(password);

  useEffect(() => {
    // Supabase pone el error en el fragmento de la URL cuando el enlace ya
    // caducó o ya se usó.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error') || hash.get('error_code')) {
      setEstado('enlace_invalido');
      return;
    }

    // Al abrir el enlace, supabase-js canjea el token y crea una sesión de
    // recuperación. Puede tardar un instante, así que escuchamos el evento y
    // además revisamos si ya había sesión.
    const { data: listener } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'PASSWORD_RECOVERY' || sesion) setEstado('listo');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setEstado('listo');
    });

    // Si después de unos segundos no hay sesión, el enlace no sirve.
    const reloj = setTimeout(() => {
      setEstado((previo) => (previo === 'esperando' ? 'enlace_invalido' : previo));
    }, 5000);

    return () => {
      clearTimeout(reloj);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!PASSWORD_REGEX.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, con una letra y un número.');
      return;
    }

    if (password !== confirmacion) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    const { error: errGuardar } = await supabase.auth.updateUser({ password });
    setGuardando(false);

    if (errGuardar) {
      setError(errGuardar.message);
      return;
    }

    setEstado('guardado');
  };

  const caja = 'bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60';
  const pantalla =
    'min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased';

  if (estado === 'esperando') {
    return (
      <div className={pantalla}>
        <p className="text-sm text-gray-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Validando tu enlace...
        </p>
      </div>
    );
  }

  if (estado === 'enlace_invalido') {
    return (
      <div className={pantalla}>
        <div className="w-full max-w-sm">
          <BrandHeader />
          <div className={`${caja} text-center`}>
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ban className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-lg font-black text-[#1C5253] mb-2">Este enlace ya no sirve</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Los enlaces para restablecer la contraseña caducan en una hora y sirven una sola
              vez. Pide uno nuevo y vuelve a intentar.
            </p>
            <Link
              to="/olvide-mi-contrasena"
              className="inline-block w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm"
            >
              Pedir un enlace nuevo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'guardado') {
    return (
      <div className={pantalla}>
        <div className="w-full max-w-sm">
          <BrandHeader />
          <div className={`${caja} text-center`}>
            <div className="w-16 h-16 bg-[#88D49E]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#1C5253]" />
            </div>
            <h1 className="text-xl font-black text-[#1C5253] mb-2">Contraseña actualizada</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Ya puedes entrar con tu contraseña nueva. Tu sesión quedó abierta en este
              dispositivo.
            </p>
            <button
              onClick={() => navigate('/mi-cuenta')}
              className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm"
            >
              Ir a mi cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pantalla}>
      <div className="w-full max-w-sm">
        <BrandHeader />
        <div className={caja}>
          <h1 className="text-xl font-black text-[#1C5253] text-center mb-1">
            Crea tu contraseña nueva
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6">
            Escríbela dos veces para evitar errores de dedo
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Contraseña nueva
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
                placeholder="••••••••"
              />
              {password.length > 0 && (
                <p className={`text-[10px] font-bold mt-1 ${fuerza.color}`}>{fuerza.texto}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Confírmala
              </label>
              <input
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
                placeholder="••••••••"
              />
              {confirmacion.length > 0 && password !== confirmacion && (
                <p className="text-[10px] font-bold text-red-500 mt-1">No coinciden todavía</p>
              )}
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestablecerContrasena;
