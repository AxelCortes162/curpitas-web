import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabaseClient';

const RADIO_METROS = 1000;

// Crea un ícono de marcador circular con la foto de la mascota
const crearIconoFoto = (photoUrl) => {
  const html = ReactDOMServer.renderToStaticMarkup(
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '3px solid #1C5253',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        background: '#E8F3F1',
      }}
    >
      {photoUrl && (
        <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
    </div>
  );
  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

export const Mapa = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('pet_public_profile')
        .select('curpita, name, photo_url, is_lost, lost_lat, lost_lng')
        .eq('is_lost', true)
        .not('lost_lat', 'is', null)
        .not('lost_lng', 'is', null);
      setMascotas(data || []);
      setLoading(false);
    };
    cargar();
  }, []);

  // Centro del mapa: promedio de las mascotas perdidas, o CDMX por defecto
  const centro =
    mascotas.length > 0
      ? [
          mascotas.reduce((s, m) => s + m.lost_lat, 0) / mascotas.length,
          mascotas.reduce((s, m) => s + m.lost_lng, 0) / mascotas.length,
        ]
      : [19.4326, -99.1332];

  return (
    <div className="min-h-screen bg-[#E8F3F1] font-sans antialiased">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-[#1C5253] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
            <ShieldAlert className="w-4 h-4" />
            {mascotas.length} mascota{mascotas.length !== 1 ? 's' : ''} perdida{mascotas.length !== 1 ? 's' : ''}
          </div>
        </div>

        <h1 className="text-xl font-black text-[#1C5253] mb-1">Mapa de mascotas perdidas</h1>
        <p className="text-xs text-gray-500 mb-4">
          Cada círculo marca la zona donde se perdió. Toca una foto para ver su perfil completo y contactar al dueño.
        </p>

        {loading && <p className="text-sm text-gray-400">Cargando mapa...</p>}

        {!loading && (
          <div className="rounded-2xl overflow-hidden border border-emerald-100 shadow-sm" style={{ height: 500 }}>
            <MapContainer center={centro} zoom={12} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mascotas.map((m) => (
                <React.Fragment key={m.curpita}>
                  <Circle
                    center={[m.lost_lat, m.lost_lng]}
                    radius={RADIO_METROS}
                    pathOptions={{ color: '#1C5253', fillColor: '#ef4444', fillOpacity: 0.12 }}
                  />
                  <Marker position={[m.lost_lat, m.lost_lng]} icon={crearIconoFoto(m.photo_url)}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, margin: 0 }}>{m.name || 'Mascota perdida'}</p>
                        <Link to={`/mascota/${m.curpita}`} style={{ fontSize: 12, color: '#1C5253' }}>
                          Ver perfil completo →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
            </MapContainer>
          </div>
        )}

        {!loading && mascotas.length === 0 && (
          <p className="text-sm text-gray-400 mt-4 text-center">
            No hay mascotas reportadas como perdidas con ubicación en este momento. 🎉
          </p>
        )}
      </div>
    </div>
  );
};

export default Mapa;