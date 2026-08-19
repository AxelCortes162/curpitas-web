import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Registro = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceptaAviso, setAceptaAviso] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !phone || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (!aceptaAviso) {
      setError('Debes aceptar el Aviso de Privacidad para continuar.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({ email, password, fullName, phone });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Registro exitoso: lo mandamos a su panel de cuenta
    navigate('/mi-cuenta');
  };

  return (
    <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60">
        <h1 className="text-xl font-black text-[#1C5253] text-center mb-1">Crear cuenta</h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          Para registrar y administrar tus mascotas CURPitas
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
              placeholder="Alejandro Cortés"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teléfono celular</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
              placeholder="+52 55 1234 5678"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <label className="flex items-start gap-2 text-[11px] text-gray-500 leading-snug">
            <input
              type="checkbox"
              checked={aceptaAviso}
              onChange={(e) => setAceptaAviso(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 accent-[#1C5253] shrink-0"
            />
            <span>
              He leído y acepto el{' '}
              <Link to="/aviso-de-privacidad" target="_blank" className="text-[#1C5253] font-bold hover:underline">
                Aviso de Privacidad
              </Link>
              , incluyendo que mi teléfono se mostrará públicamente en el perfil de mi mascota.
            </span>
          </label>

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/iniciar-sesion" className="text-[#1C5253] font-bold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;