import React, { useRef, useState, useEffect } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

type Library = "places";
const libraries: Library[] = ["places"];

interface AddressAutocompleteProps {
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  hideLabel?: boolean;
  className?: string;
  initialValue?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  hideLabel = false,
  className = "",
  initialValue = "",
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS;

  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS environment variable");
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [address, setAddress] = useState(initialValue);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setAddress(initialValue);
  }, [initialValue]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || "";
      setAddress(formattedAddress);
      onAddressSelect(lat, lng, formattedAddress);
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  if (loadError) return <div className="text-red-500 text-xs">Error loading maps</div>;
  if (!isLoaded) return <div className="text-xs animate-pulse">Chargement...</div>;

  return (
    <div className={`field-sm ${className}`}>
      {!hideLabel && (
        <label className="text-[0.72rem] font-semibold tracking-[0.03em] color-[#15172b]">
          Adresse <span className="text-red-600">*</span>
        </label>
      )}
      <Autocomplete onLoad={onLoad} onPlaceChanged={handlePlaceChanged}>
        <input
          type="text"
          placeholder="Entrez l'adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-[0.85rem] py-[0.7rem] border border-[#e8e8ea] rounded-[5px] bg-white text-[0.86rem] text-[#15172b] outline-none transition-all focus:border-[#c93b18] focus:ring-2 focus:ring-[#c93b18]/10"
        />
      </Autocomplete>
    </div>
  );
};

export default AddressAutocomplete;
