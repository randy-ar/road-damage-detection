"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Interface for road damage data from Firestore
interface RoadDamageData {
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  latitude: number;
  longitude: number;
  berat: number;
  rusak_parah: number;
  rusak_sedang: number;
}

// Interface for display data
interface DisplayDamageData {
  id: number;
  lat: number;
  lng: number;
  severity: "critical" | "moderate" | "minor";
  location: string;
  city: string;
}

// Fix for default marker icons in Leaflet
const icon = L.icon({
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

    // Fetch data from Firestore
    const fetchRoadDamages = async () => {
      try {
        setLoading(true);
        const roadDamagesRef = collection(db, "road_damages");
        const snapshot = await getDocs(roadDamagesRef);

        const damages: DisplayDamageData[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as RoadDamageData;

          // Determine severity based on damage type
          let severity: "critical" | "moderate" | "minor" = "minor";
          if (data.berat === 1) {
            severity = "critical";
          } else if (data.rusak_parah === 1) {
            severity = "critical";
          } else if (data.rusak_sedang === 1) {
            severity = "moderate";
          }

          damages.push({
            id: data.id,
            lat: data.latitude,
            lng: data.longitude,
            severity: severity,
            location: `${data.nama_kabupaten_kota}`,
            city: data.nama_kabupaten_kota,
          });
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

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return criticalIcon;
      case "moderate":
        return moderateIcon;
      case "minor":
        return minorIcon;
      default:
        return icon;
    }
  };

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

      {roadDamageData.map((damage) => (
        <Marker
          key={damage.id}
          position={[damage.lat, damage.lng]}
          icon={getIcon(damage.severity)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">ID: {damage.id}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityColor(
                    damage.severity
                  )}`}
                >
                  {getSeverityLabel(damage.severity)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-semibold">Lokasi:</span>{" "}
                  {damage.location}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Kota:</span> {damage.city}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Deskripsi:</span>{" "}
                  {damage.severity}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DashboardMap;
