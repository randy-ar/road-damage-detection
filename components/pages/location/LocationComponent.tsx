"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

interface LocationComponentProps {
  cityCode?: string;
  districtCode?: string;
  onChange?: (latitude: number, longitude: number) => void;
}

interface LocationData {
  center: {
    latitude: number;
    longitude: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  name: string;
  code: string;
}

// Default center for West Java
const DEFAULT_CENTER: [number, number] = [-6.9175, 107.6191];
const DEFAULT_ZOOM = 10;

const LocationComponent = ({
  cityCode,
  districtCode,
  onChange,
}: LocationComponentProps) => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    center: [number, number];
    zoom: number;
    latitude: number | null;
    longitude: number | null;
    onMapClick: (lat: number, lng: number) => void;
  }> | null>(null);

  // Dynamically load the map component on client side only
  useEffect(() => {
    const loadMapComponent = async () => {
      // Dynamically import Leaflet and react-leaflet only on client
      const L = (await import("leaflet")).default;
      const { MapContainer, TileLayer, Marker, useMapEvents, useMap } =
        await import("react-leaflet");

      // Create marker icon
      const markerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Create internal components
      const MapClickHandler = ({
        onMapClick,
      }: {
        onMapClick: (lat: number, lng: number) => void;
      }) => {
        useMapEvents({
          click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
          },
        });
        return null;
      };

      const MapViewUpdater = ({
        center,
        zoom,
      }: {
        center: [number, number];
        zoom: number;
      }) => {
        const map = useMap();

        useEffect(() => {
          if (center && map) {
            map.setView(center, zoom);
          }
        }, [center, zoom, map]);

        return null;
      };

      // Create the map component
      const DynamicMap = ({
        center,
        zoom,
        latitude,
        longitude,
        onMapClick,
      }: {
        center: [number, number];
        zoom: number;
        latitude: number | null;
        longitude: number | null;
        onMapClick: (lat: number, lng: number) => void;
      }) => {
        return (
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewUpdater center={center} zoom={zoom} />
            <MapClickHandler onMapClick={onMapClick} />
            {latitude !== null && longitude !== null && (
              <Marker position={[latitude, longitude]} icon={markerIcon} />
            )}
          </MapContainer>
        );
      };

      setMapComponent(() => DynamicMap);
    };

    loadMapComponent();
  }, []);

  // Fetch location data when city or district code changes
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!cityCode && !districtCode) {
        // Reset to default if no codes provided
        setMapCenter(DEFAULT_CENTER);
        setMapZoom(DEFAULT_ZOOM);
        setLocationName(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (districtCode) {
          params.set("district", districtCode);
        } else if (cityCode) {
          params.set("city", cityCode);
        }

        const response = await fetch(`/api/location/lookup?${params}`);
        const result = await response.json();

        if (result.success && result.data) {
          const data: LocationData = result.data;

          // Set map center to the area centroid
          setMapCenter([data.center.latitude, data.center.longitude]);

          // Calculate zoom based on bounds
          const latDiff = data.bounds.north - data.bounds.south;
          const lngDiff = data.bounds.east - data.bounds.west;
          const maxDiff = Math.max(latDiff, lngDiff);

          // Estimate zoom level based on bounds size
          let zoom = 13;
          if (maxDiff > 0.5) zoom = 10;
          else if (maxDiff > 0.2) zoom = 11;
          else if (maxDiff > 0.1) zoom = 12;
          else if (maxDiff > 0.05) zoom = 13;
          else zoom = 14;

          setMapZoom(zoom);
          setLocationName(data.name);

          // If no coordinate selected yet, set to center
          if (latitude === null || longitude === null) {
            setLatitude(data.center.latitude);
            setLongitude(data.center.longitude);
            if (onChange) {
              onChange(data.center.latitude, data.center.longitude);
            }
          }
        } else {
          setError(result.error || "Failed to fetch location data");
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        setError("Failed to load location data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [cityCode, districtCode]);

  // Handle map click to set coordinates
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      setError(null);

      if (onChange) {
        onChange(lat, lng);
      }
    },
    [onChange],
  );

  // Use device GPS to get current location
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);
        setMapZoom(16);
        setIsLoading(false);

        if (onChange) {
          onChange(lat, lng);
        }
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      },
    );
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Pilih Lokasi di Peta</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4 mr-1" />
          )}
          Gunakan GPS
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">Error: {error}</p>}

      {locationName && (
        <p className="text-sm text-muted-foreground">
          Area: <span className="font-medium">{locationName}</span>
        </p>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[250px] rounded-lg overflow-hidden border">
        {MapComponent ? (
          <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            latitude={latitude}
            longitude={longitude}
            onMapClick={handleMapClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Crosshair overlay for visual guidance */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-400">
          <div className="w-8 h-8 border-2 border-primary/30 rounded-full" />
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Klik pada peta untuk memilih lokasi kerusakan jalan
      </p>

      {/* Coordinate Display */}
      {latitude !== null && longitude !== null && (
        <div className="flex flex-row gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono">
            <MapPin className="w-3 h-3 mr-1" />
            {latitude.toFixed(8)}
          </Badge>
          <Badge variant="secondary" className="font-mono">
            {longitude.toFixed(8)}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default LocationComponent;
