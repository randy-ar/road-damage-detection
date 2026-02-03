"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useMemo } from "react";

// Interface for road damage data from MongoDB
interface RoadDamageData {
  _id: string;
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  kode_kecamatan: string;
  nama_kecamatan: string;
  latitude: number;
  longitude: number;
  kerusakan: "ringan" | "sedang" | "berat";
  damage_class?: string;
  confidence?: number;
  created_at?: string;
}

// Interface for API response
interface ApiResponse {
  success: boolean;
  count: number;
  data: RoadDamageData[];
  error?: string;
}

// Interface for display data
interface DisplayDamageData {
  id: number;
  mongoId: string;
  lat: number;
  lng: number;
  severity: "critical" | "moderate" | "minor";
  location: string;
  city: string;
  kecamatan: string;
  damageClass?: string;
  confidence?: number;
  createdAt?: string;
}

// Fix for default marker icons in Leaflet
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icons for different severity levels
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const criticalIcon = createCustomIcon("#ef4444");
const moderateIcon = createCustomIcon("#eab308");
const minorIcon = createCustomIcon("#22c55e");

// Custom cluster icon creator function
// Per documentation: iconCreateFunction?: ((cluster: MarkerCluster) => Icon | DivIcon)
const createClusterCustomIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const count = cluster.getChildCount();

  // Determine cluster color and size based on marker count
  let bgColor = "#22c55e"; // green for small clusters
  let size = 40;

  if (count >= 100) {
    bgColor = "#ef4444"; // red for large clusters
    size = 50;
  } else if (count >= 50) {
    bgColor = "#f97316"; // orange for medium-large clusters
    size = 48;
  } else if (count >= 20) {
    bgColor = "#eab308"; // yellow for medium clusters
    size = 44;
  }

  return L.divIcon({
    html: `
      <div style="
        background: ${bgColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${count >= 100 ? "14px" : "12px"};
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    className: "custom-cluster-icon",
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
};

const DashboardMap = () => {
  const [roadDamageData, setRoadDamageData] = useState<DisplayDamageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fix for Leaflet icon paths
    const DefaultIcon = L.Icon.Default.prototype as unknown as Record<
      string,
      unknown
    >;
    delete DefaultIcon._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Fetch data from MongoDB API
    const fetchRoadDamages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/road-damages");
        const result: ApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch data");
        }

        const damages: DisplayDamageData[] = result.data.map((data) => {
          // Map kerusakan to severity
          let severity: "critical" | "moderate" | "minor" = "minor";
          if (data.kerusakan === "berat") {
            severity = "critical";
          } else if (data.kerusakan === "sedang") {
            severity = "moderate";
          } else {
            severity = "minor";
          }

          return {
            id: data.id,
            mongoId: data._id,
            lat: data.latitude,
            lng: data.longitude,
            severity: severity,
            location: data.nama_kecamatan,
            city: data.nama_kabupaten_kota,
            kecamatan: data.nama_kecamatan,
            damageClass: data.damage_class,
            confidence: data.confidence,
            createdAt: data.created_at,
          };
        });

        setRoadDamageData(damages);
        setError(null);
      } catch (err) {
        console.error("Error fetching road damages:", err);
        setError("Gagal memuat data kerusakan jalan");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadDamages();
  }, []);

  // Memoize icon getter to prevent re-creation
  const getIcon = useMemo(() => {
    return (severity: string) => {
      switch (severity) {
        case "critical":
          return criticalIcon;
        case "moderate":
          return moderateIcon;
        case "minor":
          return minorIcon;
        default:
          return defaultIcon;
      }
    };
  }, []);

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Parah";
      case "moderate":
        return "Sedang";
      case "minor":
        return "Ringan";
      default:
        return severity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "moderate":
        return "text-yellow-600 bg-yellow-50";
      case "minor":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return roadDamageData.map((damage) => (
      <Marker
        key={`${damage.mongoId}-${damage.id}`}
        position={[damage.lat, damage.lng]}
        icon={getIcon(damage.severity)}
      >
        <Popup>
          <div className="p-2 min-w-[220px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800">ID: {damage.id}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityColor(
                  damage.severity,
                )}`}
              >
                {getSeverityLabel(damage.severity)}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="font-semibold">Kecamatan:</span>{" "}
                {damage.kecamatan}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Kota/Kab:</span> {damage.city}
              </p>
              {damage.damageClass && (
                <p className="text-gray-600">
                  <span className="font-semibold">Kelas Kerusakan:</span>{" "}
                  {damage.damageClass}
                </p>
              )}
              {damage.confidence !== undefined && (
                <p className="text-gray-600">
                  <span className="font-semibold">Confidence:</span>{" "}
                  {damage.confidence.toFixed(2)}%
                </p>
              )}
              {damage.createdAt && (
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(damage.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [roadDamageData, getIcon]);

  // Center of West Java
  const center: [number, number] = [-6.9175, 107.6191];

  return (
    <MapContainer
      center={center}
      zoom={9}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md">
          Memuat data...
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 text-red-600 px-4 py-2 rounded-lg shadow-md">
          {error}
        </div>
      )}

      {/* MarkerClusterGroup with options from documentation */}
      <MarkerClusterGroup
        // Chunked loading options - split processing to prevent page freeze
        chunkedLoading={true}
        chunkDelay={50}
        chunkInterval={200}
        // Cluster behavior options
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        spiderfyOnMaxZoom={true}
        removeOutsideVisibleBounds={true}
        // Animation options
        animate={true}
        animateAddingMarkers={false}
        // Cluster radius - can be number or function
        maxClusterRadius={60}
        // Disable clustering at high zoom levels
        disableClusteringAtZoom={16}
        // Custom icon function
        iconCreateFunction={createClusterCustomIcon}
        // Spider leg styling
        spiderLegPolylineOptions={{
          weight: 1.5,
          color: "#222",
          opacity: 0.5,
        }}
        spiderfyDistanceMultiplier={1}
      >
        {markers}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default DashboardMap;
