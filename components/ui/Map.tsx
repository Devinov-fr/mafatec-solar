'use client'; // Ensure this is a client component

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L here

interface MapComponentProps {
  onPositionChange: (position: { lat: number; lng: number }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onPositionChange }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // This effect handles the marker icon setup
  useEffect(() => {
    // Fix marker icon not showing
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Map click event handler
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newPosition = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };
        setPosition(newPosition);
        onPositionChange(newPosition); // Send position to the parent
      },
    });
    return null;
  };

  return (
    <div style={{ height: '600px', width: '100%' }} className='rounded-[20px]'>
      <MapContainer
        center={[46.603354, 1.888334]} // France's central coordinates
        zoom={6} // Adjust the zoom level for a broader view of France
        style={{ height: '100%', width: '100%', borderRadius: '20px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {position && (
          <Marker position={[position.lat, position.lng]} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
