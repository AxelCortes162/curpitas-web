import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Arreglo necesario: Leaflet busca sus íconos por defecto en rutas que no
// funcionan con Vite. Le damos íconos propios generados por CDN en su lugar.
const iconoMarcador = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RADIO_METROS = 1000; // 1km fijo

// Escucha los clics dentro del mapa y avisa la posición elegida
const CapturadorDeClics = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
};

// value: { lat, lng } | null
export const SelectorUbicacionPerdida = ({ value, onChange }) => {
  const [centroInicial] = useState(() => {
    // Centro de referencia inicial: México, Ciudad de México
    return value || { lat: 19.4326, lng: -99.1332 };
  });

  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Toca el mapa donde se perdió (radio fijo de 1km)
      </p>
      <div className="rounded-xl overflow-hidden border border-emerald-100" style={{ height: 220 }}>
        <MapContainer
          center={[centroInicial.lat, centroInicial.lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CapturadorDeClics onSelect={(latlng) => onChange({ lat: latlng.lat, lng: latlng.lng })} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={iconoMarcador} />
              <Circle
                center={[value.lat, value.lng]}
                radius={RADIO_METROS}
                pathOptions={{ color: '#1C5253', fillColor: '#88D49E', fillOpacity: 0.25 }}
              />
            </>
          )}
        </MapContainer>
      </div>
      {!value && (
        <p className="text-[10px] text-amber-600 mt-1">
          Sin ubicación marcada, tu mascota no aparecerá en el mapa público — pero seguirá visible en su perfil.
        </p>
      )}
    </div>
  );
};

export default SelectorUbicacionPerdida;