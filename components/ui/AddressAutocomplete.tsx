import React, { useRef, useState } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { Label } from "./label";

type Library = "places";

const libraries: Library[] = ["places"];

interface AddressAutocompleteProps {
  onAddressSelect: (lat: number, lng: number) => void;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS;

  // Check if the API key is defined
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS environment variable");
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [address, setAddress] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry) {
      const location = place.geometry.location;

      // Check if location is defined
      if (location) {
        const lat = location.lat();
        const lng = location.lng();
        onAddressSelect(lat, lng);
        
        // Update the address state with the selected place's formatted address
        setAddress(place.formatted_address || ""); // Set to an empty string if undefined
      } else {
        console.error("Location is undefined");
      }
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <Label className="text-[13px] ">
        Adresse <span className="text-red-500">*</span>
      </Label>
      <Autocomplete onLoad={onLoad} onPlaceChanged={handlePlaceChanged}>
        <input
          type="text"
          placeholder="Enter your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border border-gray-300 p-2 rounded bg-white w-full"
        />
      </Autocomplete>
    </div>
  );
};

export default AddressAutocomplete;
