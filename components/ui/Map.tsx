'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapComponentProps {
  onPositionChange: (position: { lat: number; lng: number }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onPositionChange }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  // ⚙️ S'assurer qu'on est bien monté côté client avant de rendre la map
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix marker icon
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newPosition = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };
        setPosition(newPosition);
        onPositionChange(newPosition);
      },
    });
    return null;
  };

  // ⛔ Tant que pas monté, on ne rend rien
  if (!mounted) {
    return null;
  }

  return (
    <div style={{ height: '500px', width: '100%' }} className="rounded-[20px]">
      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '20px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
