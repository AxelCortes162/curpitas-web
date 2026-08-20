import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export const IniciarSesion = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [correoSinConfirmar, setCorreoSinConfirmar] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCorreoSinConfirmar(false);
    setReenviado(false);
    setLoading(true);

    const { error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Tu correo todavía no ha sido confirmado.');
        setCorreoSinConfirmar(true);
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(error.message);
      }
      return;
    }

    navigate('/mi-cuenta');
  };

  const handleReenviar = async () => {
    setReenviando(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setReenviando(false);
    if (!error) setReenviado(true);
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60">
        <h1 className="text-xl font-black text-[#1C5253] text-center mb-1">Iniciar sesión</h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          Entra para administrar tus mascotas
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          {correoSinConfirmar && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-2">
              <p className="text-[11px] text-amber-800">
                Revisa tu bandeja de entrada (o spam) para confirmarlo. ¿No te llegó?
              </p>
              {reenviado ? (
                <p className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                  <MailCheck className="w-3.5 h-3.5" /> Correo reenviado, revisa tu bandeja.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando || !email}
                  className="text-[11px] font-bold text-[#1C5253] hover:underline disabled:opacity-60"
                >
                  {reenviando ? 'Reenviando...' : 'Reenviar correo de confirmación'}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-[#1C5253] font-bold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default IniciarSesion;