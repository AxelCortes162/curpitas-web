import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
  PawPrint,
  ShieldCheck,
  Phone,
  Nfc,
  QrCode,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  User,
  Star,
} from 'lucide-react';

// ⚠️ EDITA ESTO cuando tengas tus cuentas y número reales.
// El número de WhatsApp va sin espacios ni signos, con código de país (52 = México).
const REDES = {
  instagram: 'https://instagram.com/curpitas', // PENDIENTE: confirmar disponibilidad
  tiktok: 'https://tiktok.com/@curpitas', // PENDIENTE: confirmar disponibilidad
  facebook: 'https://facebook.com/curpitas', // PENDIENTE: confirmar disponibilidad
  whatsapp: 'https://wa.me/5215500000000', // PENDIENTE: poner tu número real
};

// Los testimonios reales se cargan desde Supabase (tabla "testimonials",
// solo los que ya aprobaste en el panel de admin). Ver componente Inicio.

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.5 2h-3.2v13.2a2.9 2.9 0 1 1-2.1-2.8v-3.3a6.2 6.2 0 1 0 5.3 6.1V8.9a7.6 7.6 0 0 0 4.5 1.5V7.2a4.4 4.4 0 0 1-4.5-4.4V2z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7A21 21 0 0 0 14.4 3.6c-2.3 0-3.9 1.4-3.9 4v2.3H8v3.1h2.5v8h3z" />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5a1 1 0 0 0 .1-.5c0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4a15 15 0 0 0 1.5.5c.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
  </svg>
);

const NavBar = ({ user }) => (
  <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/logo.png" alt="CURPitas" className="w-12 h-12 object-contain" />
      <span className="font-black text-[#1C5253] tracking-tight text-lg">CURPitas</span>
    </Link>
    <div className="flex items-center gap-5">
      <Link
        to="/mapa"
        className="text-sm font-bold text-[#1C5253] hover:text-[#88D49E] transition-colors"
      >
        Mapa de perdidas
      </Link>
      {user ? (
        <Link
          to="/mi-cuenta"
          className="flex items-center gap-1.5 text-sm font-bold text-[#1C5253] hover:text-[#88D49E] transition-colors"
        >
          <User className="w-4 h-4" /> Mi cuenta
        </Link>
      ) : (
        <Link
          to="/iniciar-sesion"
          className="text-sm font-bold text-[#1C5253] hover:text-[#88D49E] transition-colors"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  </nav>
);

// La credencial inclinada del hero — reutiliza el mismo lenguaje visual
// de la tarjeta real, con un "sello" dorado tipo holograma en la esquina.
const CredencialHero = () => (
  <div className="relative w-full max-w-xs mx-auto">
    <div className="absolute -inset-4 bg-[#88D49E]/20 rounded-[32px] blur-2xl" />
    <div className="relative bg-white rounded-[24px] shadow-2xl border border-emerald-100/60 overflow-hidden -rotate-3 hover:rotate-0 transition-transform duration-500">
      <div className="bg-[#1C5253] px-5 py-4 flex items-center justify-between">
        <span className="text-[9px] font-bold text-[#88D49E] uppercase tracking-[0.15em]">
          Credencial Digital
        </span>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4B968] to-[#B08D3E] shadow-inner" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <img
            src="/kenai.png"
            alt="Kenai"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#E8F3F1]"
          />
          <div>
            <p className="font-black text-[#1C5253] leading-none">KENAI</p>
            <p className="text-[9px] text-gray-400 font-mono mt-1 tracking-wide">
              CURPITA80233025
            </p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-[#88D49E] ml-auto" />
        </div>
        <div className="mt-4 pt-3 border-t border-dashed border-emerald-100 flex items-center justify-between">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Teléfono
          </span>
          <span className="text-[11px] font-mono font-bold text-[#1C5253]">
            +52 55 1234 5678
          </span>
        </div>
      </div>
    </div>
    {/* Chip NFC asomando, como si fuera la placa física detrás */}
    <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-white rounded-2xl shadow-lg border border-emerald-100 flex items-center justify-center rotate-6">
      <Nfc className="w-6 h-6 text-[#1C5253]" />
    </div>
  </div>
);

const Paso = ({ numero, titulo, texto }) => (
  <div className="flex-1">
    <span className="font-mono text-3xl font-bold text-[#88D49E]">{numero}</span>
    <h3 className="text-lg font-black text-[#1C5253] mt-2">{titulo}</h3>
    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{texto}</p>
  </div>
);

const Feature = ({ icon: Icon, titulo, texto }) => (
  <div className="bg-white rounded-2xl p-5 border border-emerald-100/70 shadow-sm">
    <div className="w-10 h-10 rounded-xl bg-[#E8F3F1] flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-[#1C5253]" />
    </div>
    <h3 className="font-black text-[#1C5253] text-sm">{titulo}</h3>
    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{texto}</p>
  </div>
);

// Mini-mock de los interruptores de privacidad, tal como se ven en "Mi cuenta"
const TogglePreview = ({ label, on }) => (
  <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-emerald-100/70">
    <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
      {on ? <Eye className="w-3.5 h-3.5 text-[#1C5253]" /> : <EyeOff className="w-3.5 h-3.5 text-gray-300" />}
      {label}
    </span>
    <div className={`w-8 h-4.5 rounded-full flex items-center px-0.5 ${on ? 'bg-[#88D49E] justify-end' : 'bg-gray-200 justify-start'}`}>
      <div className="w-3.5 h-3.5 rounded-full bg-white shadow" />
    </div>
  </div>
);

const TestimonioCard = ({ name, city, rating, text }) => (
  <div className="bg-white rounded-2xl p-5 border border-emerald-100/70 shadow-sm">
    <div className="flex gap-0.5 mb-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-[#88D49E] text-[#88D49E]' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
    <p className="text-sm text-gray-600 leading-relaxed">"{text}"</p>
    <p className="text-xs font-black text-[#1C5253] mt-3">
      {name}
      {city && <span className="font-medium text-gray-400"> · {city}</span>}
    </p>
  </div>
);

export const Inicio = () => {
  const { user } = useAuth();
  const [testimonios, setTestimonios] = useState([]);

  useEffect(() => {
    const cargarTestimonios = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(6);
      setTestimonios(data || []);
    };
    cargarTestimonios();
  }, []);

  return (
    <div className="min-h-screen bg-[#E8F3F1] font-sans antialiased overflow-x-hidden">
      <NavBar user={user} />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1C5253] bg-[#88D49E]/25 px-3 py-1.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Identidad oficial para mascotas
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1C5253] leading-[1.05] mt-4 tracking-tight">
            La credencial que le da a tu mascota un camino de regreso a casa.
          </h1>
          <p className="text-gray-500 mt-5 text-base leading-relaxed max-w-md">
            Cada mascota CURPitas tiene un folio único, una placa física con QR
            y NFC, y un perfil digital con tu teléfono siempre visible — para
            que cualquiera que la encuentre pueda contactarte al instante, sin
            instalar nada.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to={user ? '/mi-cuenta' : '/registro'}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#1C5253]/20 transition-colors"
            >
              {user ? 'Ir a mi cuenta' : 'Registrar mi mascota'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/iniciar-sesion"
                className="inline-flex items-center px-6 py-3.5 bg-white border-2 border-[#1C5253] text-[#1C5253] font-bold rounded-2xl text-sm hover:bg-emerald-50/50 transition-colors"
              >
                Ya tengo cuenta
              </Link>
            )}
          </div>
        </div>

        <CredencialHero />
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-white border-y border-emerald-100/70">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xs font-bold text-[#88D49E] uppercase tracking-[0.2em] mb-2">
            Cómo funciona
          </h2>
          <p className="text-2xl font-black text-[#1C5253] mb-10 max-w-lg">
            De la placa física al teléfono que suena, en tres pasos.
          </p>
          <div className="flex flex-col md:flex-row gap-10 md:gap-8">
            <Paso
              numero="01"
              titulo="Pide tu placa"
              texto="Recibes una placa personalizada con su folio CURPITA, un chip NFC y un código QR, ya grabados y listos."
            />
            <Paso
              numero="02"
              titulo="Vincula a tu mascota"
              texto="Creas tu cuenta, escribes el folio de tu placa, y completas su perfil: nombre, raza, alergias, lo que tú decidas."
            />
            <Paso
              numero="03"
              titulo="Si se pierde, la encuentran"
              texto="Cualquier persona acerca su celular al chip o escanea el QR, y llega directo a su perfil — con tu teléfono a la vista."
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-xs font-bold text-[#88D49E] uppercase tracking-[0.2em] mb-2">
          Qué incluye
        </h2>
        <p className="text-2xl font-black text-[#1C5253] mb-8 max-w-lg">
          Una identidad digital pensada para el peor momento.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature
            icon={PawPrint}
            titulo="Folio único"
            texto="Cada mascota tiene su propio CURPITA, como una credencial oficial imposible de duplicar."
          />
          <Feature
            icon={Phone}
            titulo="Contacto inmediato"
            texto="Tu teléfono siempre visible en el perfil público — sin excepciones ni pasos extra."
          />
          <Feature
            icon={QrCode}
            titulo="QR + NFC"
            texto="Funciona con cualquier celular moderno: acércalo o escanéalo, sin instalar ninguna app."
          />
          <Feature
            icon={ShieldCheck}
            titulo="Datos protegidos"
            texto="La información de cada dueño está cifrada y aislada — nadie más puede verla ni editarla."
          />
        </div>
      </section>

      {/* PRIVACIDAD */}
      <section className="bg-[#1C5253] text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xs font-bold text-[#88D49E] uppercase tracking-[0.2em] mb-2">
              Privacidad
            </h2>
            <p className="text-2xl font-black leading-tight mb-4">
              Tú decides qué se muestra. El teléfono es lo único obligatorio.
            </p>
            <p className="text-emerald-100/80 text-sm leading-relaxed max-w-md">
              Desde tu cuenta puedes activar o desactivar cada dato del perfil
              público de tu mascota: raza, fecha de nacimiento, información
              médica, incluso tu nombre. Lo único que siempre se muestra es tu
              teléfono, porque es lo que de verdad importa cuando alguien la
              encuentra.
            </p>
          </div>
          <div className="bg-[#E8F3F1]/10 rounded-2xl p-5 space-y-2 backdrop-blur-sm">
            <TogglePreview label="Raza" on={true} />
            <TogglePreview label="Fecha de nacimiento" on={true} />
            <TogglePreview label="Información médica" on={false} />
            <TogglePreview label="Nombre del tutor" on={false} />
            <div className="flex items-center justify-between bg-[#88D49E] rounded-xl px-3.5 py-2.5 mt-3">
              <span className="text-xs font-black text-[#1C5253] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Teléfono
              </span>
              <span className="text-[9px] font-black text-[#1C5253] uppercase tracking-wider">
                Siempre visible
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS — solo se muestra si hay al menos uno aprobado */}
      {testimonios.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-xs font-bold text-[#88D49E] uppercase tracking-[0.2em] mb-2">
            Testimonios
          </h2>
          <div className="flex items-center gap-2 mb-8">
            <p className="text-2xl font-black text-[#1C5253]">Lo que dicen nuestros clientes</p>
            <span className="flex items-center gap-1 text-sm font-bold text-[#1C5253] bg-[#88D49E]/25 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 fill-[#1C5253] text-[#1C5253]" />
              {(
                testimonios.reduce((suma, t) => suma + t.rating, 0) / testimonios.length
              ).toFixed(1)}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonios.map((t) => (
              <TestimonioCard key={t.id} {...t} />
            ))}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black text-[#1C5253] max-w-lg mx-auto leading-tight">
          Dale a tu mascota un camino de regreso a casa.
        </h2>
        <Link
          to={user ? '/mi-cuenta' : '/registro'}
          className="inline-flex items-center gap-2 mt-6 px-7 py-4 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#1C5253]/20 transition-colors"
        >
          {user ? 'Ir a mi cuenta' : 'Crear mi cuenta'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-emerald-100/70">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CURPitas" className="w-6 h-6 object-contain" />
            <span className="text-xs font-bold text-[#1C5253]">CURPitas</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400 font-medium">
            <Link to="/iniciar-sesion" className="hover:text-[#1C5253]">Iniciar sesión</Link>
            <Link to="/registro" className="hover:text-[#1C5253]">Crear cuenta</Link>
            <Link to="/aviso-de-privacidad" className="hover:text-[#1C5253]">Aviso de Privacidad</Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={REDES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-[#F4F9F8] flex items-center justify-center text-[#1C5253] hover:bg-[#88D49E]/30 transition-colors"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a
              href={REDES.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-8 h-8 rounded-full bg-[#F4F9F8] flex items-center justify-center text-[#1C5253] hover:bg-[#88D49E]/30 transition-colors"
            >
              <TikTokIcon className="w-4 h-4" />
            </a>
            <a
              href={REDES.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-full bg-[#F4F9F8] flex items-center justify-center text-[#1C5253] hover:bg-[#88D49E]/30 transition-colors"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>
          </div>
          <p className="text-[11px] text-gray-400">© 2026 CURPitas</p>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={REDES.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full shadow-xl flex items-center justify-center z-40 transition-transform hover:scale-105"
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </a>
    </div>
  );
};

export default Inicio;