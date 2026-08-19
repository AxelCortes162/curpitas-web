import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const IniciarSesion = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Tu correo todavía no ha sido confirmado. Revisa tu bandeja de entrada (o spam).');
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(error.message);
      }
      return;
    }

    navigate('/mi-cuenta');
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