"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

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

// Dummy data untuk lokasi kerusakan jalan di Jawa Barat
const roadDamageData = [
  // Bandung
  {
    id: 1,
    lat: -6.9175,
    lng: 107.6191,
    severity: "critical",
    location: "Jl. Asia Afrika, Bandung",
    description: "Lubang besar diameter 2m",
    city: "Bandung",
  },
  {
    id: 2,
    lat: -6.9147,
    lng: 107.6098,
    severity: "moderate",
    location: "Jl. Dago, Bandung",
    description: "Retak memanjang 5m",
    city: "Bandung",
  },
  {
    id: 3,
    lat: -6.9344,
    lng: 107.6049,
    severity: "minor",
    location: "Jl. Pasteur, Bandung",
    description: "Permukaan kasar",
    city: "Bandung",
  },

  // Bekasi
  {
    id: 4,
    lat: -6.2383,
    lng: 106.9756,
    severity: "critical",
    location: "Jl. Ahmad Yani, Bekasi",
    description: "Jalan amblas 3m²",
    city: "Bekasi",
  },
  {
    id: 5,
    lat: -6.2615,
    lng: 107.0012,
    severity: "moderate",
    location: "Jl. Cut Mutiah, Bekasi",
    description: "Aspal mengelupas",
    city: "Bekasi",
  },

  // Bogor
  {
    id: 6,
    lat: -6.5971,
    lng: 106.806,
    severity: "critical",
    location: "Jl. Pajajaran, Bogor",
    description: "Lubang dalam 30cm",
    city: "Bogor",
  },
  {
    id: 7,
    lat: -6.5885,
    lng: 106.7979,
    severity: "minor",
    location: "Jl. Sudirman, Bogor",
    description: "Retak halus",
    city: "Bogor",
  },

  // Cirebon
  {
    id: 8,
    lat: -6.7063,
    lng: 108.5571,
    severity: "moderate",
    location: "Jl. Siliwangi, Cirebon",
    description: "Permukaan bergelombang",
    city: "Cirebon",
  },
  {
    id: 9,
    lat: -6.732,
    lng: 108.552,
    severity: "minor",
    location: "Jl. Kesambi, Cirebon",
    description: "Bahu jalan rusak",
    city: "Cirebon",
  },

  // Depok
  {
    id: 10,
    lat: -6.4025,
    lng: 106.7942,
    severity: "critical",
    location: "Jl. Margonda Raya, Depok",
    description: "Lubang besar di jalur kanan",
    city: "Depok",
  },
  {
    id: 11,
    lat: -6.3915,
    lng: 106.8317,
    severity: "moderate",
    location: "Jl. Juanda, Depok",
    description: "Retak alligator",
    city: "Depok",
  },

  // Tasikmalaya
  {
    id: 12,
    lat: -7.3506,
    lng: 108.205,
    severity: "moderate",
    location: "Jl. HZ Mustofa, Tasikmalaya",
    description: "Aspal berlubang",
    city: "Tasikmalaya",
  },
  {
    id: 13,
    lat: -7.3274,
    lng: 108.2207,
    severity: "minor",
    location: "Jl. Sutisna Senjaya, Tasikmalaya",
    description: "Permukaan aus",
    city: "Tasikmalaya",
  },

  // Sukabumi
  {
    id: 14,
    lat: -6.9278,
    lng: 106.9271,
    severity: "critical",
    location: "Jl. Bhayangkara, Sukabumi",
    description: "Jalan amblas",
    city: "Sukabumi",
  },
  {
    id: 15,
    lat: -6.9186,
    lng: 106.928,
    severity: "moderate",
    location: "Jl. Pelabuhan II, Sukabumi",
    description: "Retak memanjang",
    city: "Sukabumi",
  },

  // Karawang
  {
    id: 16,
    lat: -6.3063,
    lng: 107.3019,
    severity: "moderate",
    location: "Jl. Tuparev, Karawang",
    description: "Permukaan bergelombang",
    city: "Karawang",
  },
  {
    id: 17,
    lat: -6.3215,
    lng: 107.3344,
    severity: "minor",
    location: "Jl. Kertabumi, Karawang",
    description: "Retak kecil",
    city: "Karawang",
  },

  // Purwakarta
  {
    id: 18,
    lat: -6.5569,
    lng: 107.4431,
    severity: "critical",
    location: "Jl. Veteran, Purwakarta",
    description: "Lubang dalam",
    city: "Purwakarta",
  },

  // Garut
  {
    id: 19,
    lat: -7.2253,
    lng: 107.9019,
    severity: "moderate",
    location: "Jl. Ciledug, Garut",
    description: "Aspal mengelupas",
    city: "Garut",
  },
  {
    id: 20,
    lat: -7.2145,
    lng: 107.8967,
    severity: "minor",
    location: "Jl. Pembangunan, Garut",
    description: "Permukaan kasar",
    city: "Garut",
  },
];

const DashboardMap = () => {
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
                  {damage.description}
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
