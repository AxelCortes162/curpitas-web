import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AvisoPrivacidad = () => {
  return (
    <div className="min-h-screen bg-[#E8F3F1] py-10 px-4 font-sans antialiased">
      <div className="max-w-2xl mx-auto bg-white rounded-[24px] shadow-xl border border-emerald-100/60 p-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C5253] hover:underline mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
        </Link>

        <h1 className="text-2xl font-black text-[#1C5253] mb-1">Aviso de Privacidad</h1>
        <p className="text-xs text-gray-400 mb-8">Última actualización: 19 de agosto de 2026</p>

        <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">1. Identidad y domicilio del responsable</h2>
            <p>
              <strong>Axel Alejandro Cortés Fonseca</strong>, con domicilio en{' '}
              <strong>Eje Central Lázaro Cárdenas 36, Lindavista Vallejo, Gustavo A. Madero, C.P. 07755, Ciudad de México</strong>
              {' '}(en adelante, "CURPitas" o "el Responsable"), es responsable del tratamiento de tus
              datos personales conforme a este Aviso de Privacidad, en cumplimiento de la Ley Federal
              de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
            </p>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">2. Datos personales que recabamos</h2>
            <p>Para las finalidades descritas en este aviso, podemos recabar los siguientes datos personales:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nombre completo</li>
              <li>Número de teléfono celular</li>
              <li>Correo electrónico</li>
              <li>Datos de la(s) mascota(s) que registras (nombre, raza, fecha de nacimiento, información médica, fotografía) — estos datos corresponden a tu mascota, no son datos personales tuyos, pero los tratamos con la misma seriedad.</li>
            </ul>
            <p className="mt-2">
              No recabamos datos personales sensibles (origen étnico, salud, religión, preferencias
              sexuales, etc.) de nuestros usuarios.
            </p>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">3. Finalidades del tratamiento</h2>
            <p className="font-bold text-[#1C5253] text-xs uppercase tracking-wide mb-1">Finalidades primarias (necesarias para el servicio):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear y administrar tu cuenta de usuario.</li>
              <li>Vincular tu(s) mascota(s) a tu cuenta mediante su folio CURPITA.</li>
              <li>Mostrar tu número de teléfono en el perfil público de tu mascota, para que quien la encuentre pueda contactarte. Esta finalidad es esencial para el servicio: al registrar una mascota, aceptas que tu teléfono se muestre públicamente en su perfil.</li>
              <li>Dar soporte y atención a tus solicitudes.</li>
            </ul>
            <p className="font-bold text-[#1C5253] text-xs uppercase tracking-wide mt-3 mb-1">Finalidades secundarias (opcionales):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enviarte comunicaciones sobre nuevos productos o promociones.</li>
            </ul>
            <p className="mt-2">
              Puedes oponerte a las finalidades secundarias sin que esto afecte el servicio principal,
              escribiendo a <strong>axelcortes.developer@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">4. Transferencia de datos</h2>
            <p>
              Tus datos son almacenados mediante Supabase (proveedor de infraestructura de base de
              datos), que puede procesar datos en servidores fuera de México conforme a sus propias
              políticas de seguridad y privacidad. No vendemos ni compartimos tus datos personales con
              terceros para fines de mercadotecnia ajenos a CURPitas.
            </p>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">5. Derechos ARCO</h2>
            <p>
              Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos ARCO) al tratamiento
              de tus datos personales. Puedes ejercer estos derechos:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Directamente desde tu cuenta, en la sección "Mi cuenta", donde puedes editar o eliminar la información de tus mascotas.</li>
              <li>Escribiendo a <strong>curpitas.mx@gmail.com</strong>, indicando tu nombre, el derecho que deseas ejercer, y una identificación que acredite tu titularidad.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">6. Seguridad</h2>
            <p>
              Implementamos medidas de seguridad técnicas para proteger tus datos, incluyendo controles
              de acceso a nivel de base de datos (Row Level Security) que garantizan que solo tú puedas
              ver y editar la información de tus propias mascotas.
            </p>
          </section>

          <section>
            <h2 className="font-black text-[#1C5253] text-base mb-2">7. Cambios a este aviso</h2>
            <p>
              Cualquier modificación a este Aviso de Privacidad será publicada en esta misma página. Te
              recomendamos revisarla periódicamente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AvisoPrivacidad;