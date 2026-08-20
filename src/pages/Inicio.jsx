import React from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

const NavBar = () => (
  <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="CURPitas" className="w-9 h-9 object-contain" />
      <span className="font-black text-[#1C5253] tracking-tight">CURPitas</span>
    </div>
    <Link
      to="/iniciar-sesion"
      className="text-sm font-bold text-[#1C5253] hover:text-[#88D49E] transition-colors"
    >
      Iniciar sesión
    </Link>
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
            src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200"
            alt="Maya"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#E8F3F1]"
          />
          <div>
            <p className="font-black text-[#1C5253] leading-none">MAYA</p>
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

export const Inicio = () => {
  return (
    <div className="min-h-screen bg-[#E8F3F1] font-sans antialiased overflow-x-hidden">
      <NavBar />

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
              to="/registro"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#1C5253]/20 transition-colors"
            >
              Registrar mi mascota
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/iniciar-sesion"
              className="inline-flex items-center px-6 py-3.5 bg-white border-2 border-[#1C5253] text-[#1C5253] font-bold rounded-2xl text-sm hover:bg-emerald-50/50 transition-colors"
            >
              Ya tengo cuenta
            </Link>
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

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black text-[#1C5253] max-w-lg mx-auto leading-tight">
          Dale a tu mascota un camino de regreso a casa.
        </h2>
        <Link
          to="/registro"
          className="inline-flex items-center gap-2 mt-6 px-7 py-4 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#1C5253]/20 transition-colors"
        >
          Crear mi cuenta
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
          <p className="text-[11px] text-gray-400">© 2026 CURPitas</p>
        </div>
      </footer>
    </div>
  );
};

export default Inicio;