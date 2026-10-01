import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Seccion = ({ titulo, children }) => (
  <section>
    <h2 className="font-black text-[#1C5253] text-base mb-2">{titulo}</h2>
    {children}
  </section>
);

export const TerminosCondiciones = () => {
  return (
    <div className="min-h-screen bg-[#E8F3F1] py-10 px-4 font-sans antialiased">
      <title>Términos y condiciones | CURPitas</title>
      <div className="max-w-2xl mx-auto bg-white rounded-[24px] shadow-xl border border-emerald-100/60 p-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C5253] hover:underline mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
        </Link>

        <h1 className="text-2xl font-black text-[#1C5253] mb-1">Términos y Condiciones</h1>
        <p className="text-xs text-gray-400 mb-8">Última actualización: 1 de octubre de 2026</p>

        <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <Seccion titulo="1. Quién vende">
            <p>
              CURPitas es operado por <strong>Axel Alejandro Cortés Fonseca</strong>, con domicilio en{' '}
              <strong>Eje Central Lázaro Cárdenas 36, Lindavista Vallejo, Gustavo A. Madero, C.P. 07755, Ciudad de México</strong>.
              Puedes contactarnos por WhatsApp al <strong>56 6186 8461</strong> o al correo{' '}
              <strong>curpitas.mx@gmail.com</strong>.
            </p>
            <p className="mt-2">
              Al hacer un pedido o crear una cuenta en curpitas.com aceptas estos términos. Si no estás
              de acuerdo, por favor no uses el sitio.
            </p>
          </Seccion>

          <Seccion titulo="2. Qué incluye tu CURPita">
            <ul className="list-disc pl-5 space-y-1">
              <li>Una placa física hecha a mano, con código QR y chip NFC.</li>
              <li>Un folio CURPITA único y un perfil digital de tu mascota, con tu teléfono de contacto.</li>
              <li>
                El perfil digital no tiene costo extra ni mensualidad: se paga una sola vez con la placa
                y queda activo mientras CURPitas siga operando.
              </li>
            </ul>
            <p className="mt-2">
              Cada placa se hace a mano, así que el tono del color y el glitter pueden variar un poco
              respecto a las fotos y al modelo 3D del sitio.
            </p>
          </Seccion>

          <Seccion titulo="3. Precios y pago">
            <p>
              Los precios están en pesos mexicanos y el total que pagas es el que ves en el sitio al
              momento de pagar. El pago en línea lo procesa Mercado Pago; CURPitas no recibe ni guarda
              los datos de tu tarjeta. Tu pedido entra a producción cuando el pago queda confirmado.
            </p>
          </Seccion>

          <Seccion titulo="4. Entrega">
            <p>
              Después de tu pago te contactamos por WhatsApp para acordar la entrega.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Ciudad de México y zona metropolitana:</strong> entrega en persona, de 1 a 5 días
                hábiles después de confirmado el pago.
              </li>
              <li>
                <strong>Resto de México:</strong> envío por paquetería. El costo y el tiempo dependen
                del destino y de la paquetería, y te los confirmamos antes de enviar.
              </li>
            </ul>
            <p className="mt-2">
              Puedes ver en qué paso va tu pedido desde el enlace de seguimiento que recibes al pagar.
            </p>
          </Seccion>

          <Seccion titulo="5. Cambios, devoluciones y garantía">
            <p>
              Como cada placa se hace a mano y lleva el nombre de tu mascota, no aceptamos devoluciones
              ni cambios por gusto o por cambiar de opinión. Sí la reponemos sin costo para ti si:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Llega dañada.</li>
              <li>Tiene un error nuestro (nombre mal escrito, forma o color distinto al que pediste).</li>
              <li>El QR o el NFC no funcionan.</li>
            </ul>
            <p className="mt-2">
              Para hacer válida la garantía escríbenos por WhatsApp o correo dentro de los 90 días
              siguientes a recibir tu placa, con una foto o video del problema. Si no podemos reponerla,
              te devolvemos tu dinero por el mismo medio con el que pagaste. La garantía no cubre el
              desgaste normal, la pérdida de la placa ni daños por mal uso.
            </p>
          </Seccion>

          <Seccion titulo="6. Cancelaciones">
            <p>
              Puedes cancelar tu pedido y recibir el reembolso completo mientras no hayamos empezado a
              hacer tu placa. Una vez en producción ya no se puede cancelar, porque está hecha
              especialmente para tu mascota.
            </p>
          </Seccion>

          <Seccion titulo="7. Uso del perfil digital">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Tu teléfono se muestra públicamente en el perfil de tu mascota, para que quien la
                encuentre pueda contactarte. Mantenerlo actualizado es tu responsabilidad.
              </li>
              <li>
                CURPitas es una herramienta para ayudar a que tu mascota regrese a casa, pero no podemos
                garantizar que alguien la encuentre, escanee la placa o te contacte.
              </li>
              <li>
                El QR funciona con la cámara de cualquier celular. El NFC solo funciona en celulares que
                tengan NFC activado.
              </li>
              <li>
                No uses el sitio para publicar información falsa, de otras personas sin su permiso, u
                ofensiva. Podemos desactivar cuentas o folios que se usen así.
              </li>
            </ul>
          </Seccion>

          <Seccion titulo="8. Adopciones y mapa de mascotas perdidas">
            <p>
              Las mascotas en adopción las publican rescatistas verificados, y el trato de cada adopción
              es directamente entre el rescatista y quien adopta. CURPitas solo facilita el contacto y no
              es parte de ese acuerdo. El mapa de mascotas perdidas muestra zonas aproximadas, no
              ubicaciones exactas.
            </p>
          </Seccion>

          <Seccion titulo="9. Puntos por referidos">
            <p>
              Los puntos que ganas por recomendar CURPitas no tienen valor en dinero, no se pueden
              transferir y solo se canjean por los premios que aparecen en tu cuenta. Vencen 12 meses
              después de ganarlos.
            </p>
          </Seccion>

          <Seccion titulo="10. Privacidad">
            <p>
              El uso de tus datos personales se rige por nuestro{' '}
              <Link to="/aviso-de-privacidad" className="text-[#1C5253] font-bold hover:underline">
                Aviso de Privacidad
              </Link>
              .
            </p>
          </Seccion>

          <Seccion titulo="11. Cambios y leyes aplicables">
            <p>
              Podemos actualizar estos términos; la versión vigente es la publicada en esta página, y
              los cambios no afectan pedidos ya pagados. Estos términos se rigen por las leyes de
              México. Si tienes una queja que no podamos resolver juntos, puedes acudir a la
              Procuraduría Federal del Consumidor (PROFECO).
            </p>
          </Seccion>
        </div>
      </div>
    </div>
  );
};

export default TerminosCondiciones;
