import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PetProfile from '../components/PetProfile';

// Registra que alguien abrió la placa. Si la mascota está perdida, esto
// dispara el correo al tutor (con el mapa, si viene ubicación).
// Ojo: en supabase-js la petición solo sale si se encadena un .then().
const registrar = (curpita, coords) => {
  const datos = { p_curpita: curpita };
  if (coords) {
    datos.p_lat = coords.latitude;
    datos.p_lng = coords.longitude;
    datos.p_accuracy = coords.accuracy ?? null;
  }
  supabase.rpc('registrar_escaneo', datos).then(({ error }) => {
    if (error) console.warn('No se registró el escaneo:', error.message);
  });
};

// Mascota perdida: se pide la ubicación desde que se abre el perfil, para que
// el primer correo al tutor ya lleve el mapa.
const registrarConUbicacion = (curpita) => {
  let registrado = false;
  // Si la persona no contesta el permiso, el navegador nunca responde; a los
  // 10 segundos se avisa al tutor sin ubicación. Si la ubicación llega
  // después, se manda otro correo, ya con el mapa.
  const espera = setTimeout(() => {
    if (!registrado) {
      registrado = true;
      registrar(curpita, null);
    }
  }, 10000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      clearTimeout(espera);
      registrado = true;
      registrar(curpita, pos.coords);
    },
    () => {
      clearTimeout(espera);
      if (!registrado) {
        registrado = true;
        registrar(curpita, null);
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
};

export const PerfilMascota = () => {
  const { curpita } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | no_existe | invalidado | sin_reclamar

  // En desarrollo React monta el efecto dos veces; sin esto quedarían dos
  // escaneos registrados por cada visita.
  const yaRegistrado = useRef(false);

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      setLoading(true);

      // Primero revisamos el estado general del folio (existe, está
      // invalidado, o ya fue reclamado) — esto funciona incluso para
      // folios sin dueño todavía, a diferencia de la vista de perfil.
      const { data: status } = await supabase
        .rpc('get_pet_status', { p_curpita: curpita })
        .maybeSingle();

      if (!activo) return;

      if (!status) {
        setEstado('no_existe');
        setLoading(false);
        return;
      }

      if (status.invalidated) {
        setEstado('invalidado');
        setLoading(false);
        return;
      }

      if (!status.reclamada) {
        setEstado('sin_reclamar');
        setLoading(false);
        return;
      }

      // Folio válido y reclamado: ahora sí traemos el perfil público completo
      const { data, error } = await supabase
        .rpc('get_pet_public', { p_curpita: curpita })
        .maybeSingle();

      if (!activo) return;

      if (error || !data) {
        setEstado('no_existe');
      } else {
        setPet(data);
        setEstado('ok');

        // Deja constancia de que alguien abrió esta placa. Si la mascota está
        // marcada como perdida, esto dispara el aviso por correo al tutor
        // (máximo uno cada 10 minutos, y nunca si quien mira es él mismo).
        // Va sin await a propósito: el perfil no debe esperar a esto.
        // Ojo: en supabase-js la petición solo se dispara cuando se encadena
        // un .then() (o un await). Sin esto, la llamada nunca sale.
        if (!yaRegistrado.current) {
          yaRegistrado.current = true;
          if (data.is_lost && navigator.geolocation) {
            registrarConUbicacion(curpita);
          } else {
            registrar(curpita, null);
          }
        }
      }
      setLoading(false);
    };

    cargarPerfil();
    return () => {
      activo = false;
    };
  }, [curpita]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  if (estado === 'invalidado') {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <Ban className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-lg font-black text-[#1C5253] mb-2">Este código fue desactivado</p>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          El folio "{curpita}" ya no está activo. Si crees que esto es un error, contáctanos.
        </p>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#1C5253] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (estado === 'sin_reclamar') {
    const guardarFolio = () => {
      try { localStorage.setItem('folioPendiente', curpita); } catch { /* sin almacenamiento, lo escribe a mano */ }
    };
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <img src="/logo.png" alt="CURPitas" className="w-14 h-14 object-contain mb-4" />
        <p className="text-lg font-black text-[#1C5253] mb-2">Esta placa todavía no está activada</p>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">
          Si es tuya, actívala para que tenga el perfil de tu mascota y tu teléfono.
        </p>
        <p className="font-mono font-bold text-[#1C5253] bg-white px-3 py-1.5 rounded-lg border border-emerald-100 mb-6">
          {curpita}
        </p>
        <Link
          to="/mi-cuenta"
          onClick={guardarFolio}
          className="w-full max-w-xs py-3.5 bg-[#1C5253] hover:bg-[#164343] text-white font-black rounded-2xl text-sm"
        >
          Es mía, activarla
        </Link>
        <Link
          to="/registro"
          onClick={guardarFolio}
          className="mt-3 text-sm font-bold text-[#1C5253] hover:underline"
        >
          Todavía no tengo cuenta
        </Link>
      </div>
    );
  }

  if (estado === 'no_existe') {
    return (
      <div className="min-h-screen bg-[#E8F3F1] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-lg font-black text-[#1C5253] mb-2">Mascota no encontrada</p>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          No existe ninguna mascota registrada con el folio "{curpita}". Revisa que esté bien escrito.
        </p>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[#1C5253] hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Ir al inicio
        </Link>
      </div>
    );
  }

  return <PetProfile pet={pet} />;
};

export default PerfilMascota;