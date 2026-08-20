import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Calcula qué tan fuerte es una contraseña, además del mínimo obligatorio
const calcularFuerza = (pwd) => {
  if (!pwd) return { nivel: 0, texto: '', color: '' };
  let puntos = 0;
  if (pwd.length >= 8) puntos++;
  if (pwd.length >= 12) puntos++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) puntos++;
  if (/\d/.test(pwd)) puntos++;
  if (/[^A-Za-z0-9]/.test(pwd)) puntos++;

  if (puntos <= 2) return { nivel: 1, texto: 'Débil', color: 'bg-red-400' };
  if (puntos <= 3) return { nivel: 2, texto: 'Media', color: 'bg-amber-400' };
  return { nivel: 3, texto: 'Fuerte', color: 'bg-[#88D49E]' };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const fuerza = calcularFuerza(password);

  const handlePhoneChange = (e) => {
    // Solo dígitos, máximo 10
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(soloNumeros);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !phone || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (phone.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Escribe un correo válido (debe tener @ y un dominio, ej. ejemplo.com).');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número.');
      return;
    }

    if (!aceptaAviso) {
      setError('Debes aceptar el Aviso de Privacidad para continuar.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp({ email, password, fullName, phone });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data?.session) {
      // Poco común con confirmación de correo activada, pero por si acaso:
      // si ya hay sesión, lo mandamos directo a su cuenta.
      navigate('/mi-cuenta');
    } else {
      // Caso normal: se creó el usuario, pero necesita confirmar su correo
      // antes de poder iniciar sesión.
      setRegistroExitoso(true);
    }
  };

  if (registroExitoso) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-sm bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60 text-center">
          <div className="w-16 h-16 bg-[#88D49E]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-8 h-8 text-[#1C5253]" />
          </div>
          <h1 className="text-xl font-black text-[#1C5253] mb-2">¡Ya casi! Revisa tu correo</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Te enviamos un link de confirmación a <strong className="text-[#1C5253]">{email}</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-left">
            <p className="text-xs text-amber-800">
              <strong>Importante:</strong> tienes que abrir ese correo y confirmar tu cuenta antes de
              poder iniciar sesión. Si intentas entrar antes, te va a marcar error.
            </p>
          </div>
          <Link
            to="/iniciar-sesion"
            className="inline-block mt-6 text-sm font-bold text-[#1C5253] hover:underline"
          >
            Ya confirmé, ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

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
              inputMode="numeric"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
              placeholder="10 dígitos, ej. 5512345678"
            />
            {phone.length > 0 && (
              <p className={`text-[10px] mt-1 ${phone.length === 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
                {phone.length}/10 dígitos
              </p>
            )}
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
              placeholder="Mínimo 8 caracteres, con letra y número"
            />
            {password.length > 0 && (
              <div className="mt-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= fuerza.nivel ? fuerza.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Fuerza: <span className="font-bold">{fuerza.texto}</span>
                  {' · '}mínimo 8 caracteres, con letra y número
                </p>
              </div>
            )}
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