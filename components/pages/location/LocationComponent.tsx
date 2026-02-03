import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface LocationComponentProps {
  onChange?: (latitude: number, longitude: number) => void;
}

const LocationComponent = ({ onChange }: LocationComponentProps) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setError(null);

        // Notify parent component
        if (onChange) {
          onChange(lat, lng);
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      },
    );
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">Error: {error}</p>}
      {latitude && longitude && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Location</label>
          <div className="flex flex-row gap-2">
            <Badge variant="secondary">Latitude: {latitude.toFixed(6)}</Badge>
            <Badge variant="secondary">Longitude: {longitude.toFixed(6)}</Badge>
          </div>
        </div>
      )}
      {!latitude && !longitude && !error && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Location</label>
          <p className="text-sm text-muted-foreground">Getting location...</p>
        </div>
      )}
    </div>
  );
};

export default LocationComponent;
