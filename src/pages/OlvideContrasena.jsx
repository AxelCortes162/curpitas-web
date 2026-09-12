import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BrandHeader from '../components/BrandHeader';
import CaptchaBox from '../components/CaptchaBox';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OlvideContrasena = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!EMAIL_REGEX.test(email)) {
      setError('Escribe un correo válido.');
      return;
    }

    if (!captchaToken) {
      setError('Completa la verificación de seguridad para continuar.');
      return;
    }

    setLoading(true);
    const { error: errEnvio } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
      captchaToken,
    });
    setLoading(false);

    // El token del captcha es de un solo uso.
    captchaRef.current?.resetCaptcha();
    setCaptchaToken('');

    if (errEnvio) {
      // El único error que vale mostrar es el de demasiados intentos. Cualquier
      // otro se trata como éxito a propósito: ver más abajo.
      if (errEnvio.message?.toLowerCase().includes('rate')) {
        setError('Ya se enviaron varios correos. Espera unos minutos antes de volver a intentar.');
        return;
      }
      console.warn('Error al pedir el restablecimiento:', errEnvio.message);
    }

    // Se muestra el mismo mensaje exista o no la cuenta. Si dijéramos "ese
    // correo no está registrado", cualquiera podría averiguar qué correos
    // tienen cuenta en CURPitas probando uno por uno.
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-sm">
          <BrandHeader />
          <div className="bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60 text-center">
            <div className="w-16 h-16 bg-[#88D49E]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-8 h-8 text-[#1C5253]" />
            </div>
            <h1 className="text-xl font-black text-[#1C5253] mb-2">Revisa tu correo</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Si <strong className="text-[#1C5253]">{email}</strong> tiene una cuenta en CURPitas,
              te enviamos un enlace para crear una contraseña nueva.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-left">
              <p className="text-xs text-amber-800">
                Revisa también la carpeta de spam. El enlace sirve una sola vez y caduca en
                una hora.
              </p>
            </div>
            <Link
              to="/iniciar-sesion"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-bold text-[#1C5253] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-sm">
        <BrandHeader />
        <div className="bg-white rounded-[28px] shadow-xl p-6 border border-emerald-100/60">
          <h1 className="text-xl font-black text-[#1C5253] text-center mb-1">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6">
            Escribe tu correo y te mandamos un enlace para crear una nueva
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 py-2.5 px-3 rounded-xl border border-emerald-100 bg-[#F4F9F8] text-sm text-[#1C5253] focus:outline-none focus:ring-2 focus:ring-[#88D49E]"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <CaptchaBox ref={captchaRef} onToken={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#88D49E] hover:bg-[#78c98e] text-[#1C5253] font-black rounded-2xl text-sm disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviarme el enlace'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            <Link to="/iniciar-sesion" className="text-[#1C5253] font-bold hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OlvideContrasena;
