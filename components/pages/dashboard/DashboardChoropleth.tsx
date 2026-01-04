"use client";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import { Feature, FeatureCollection, Geometry } from "geojson";

interface ChoroplethKecamatan {
  nama: string;
  kode: string;
}

interface RoadDamageData {
  id: number;
  kode_provinsi: string;
  nama_provinsi: string;
  kode_kabupaten_kota: string;
  nama_kabupaten_kota: string;
  kode_kecamatan: string;
  nama_kecamatan: string;
  latitude: number;
  longitude: number;
  kerusakan: string; // ringan, sedang, berat
  choropleth?: ChoroplethKecamatan;
}

interface StatsData {
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}

interface KabupatenFeatureProperties {
  CC_2: string;
  NAME_2: string;
  NAME_1: string;
  stats: StatsData;
}

interface KecamatanFeatureProperties {
  CC_3: string;
  NAME_3: string;
  NAME_2: string;
  NAME_1: string;
  stats: StatsData;
}

type ViewLevel = "kabupaten" | "kecamatan";

interface DashboardChoroplethProps {
  onStatsCalculated?: (stats: {
    total: number;
    critical: number;
    moderate: number;
    minor: number;
  }) => void;
}

const DashboardChoropleth = ({
  onStatsCalculated,
}: DashboardChoroplethProps) => {
  const [viewLevel, setViewLevel] = useState<ViewLevel>("kabupaten");
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(
    null
  );
  const [kabupatenGeoJson, setKabupatenGeoJson] = useState<FeatureCollection<
    Geometry,
    KabupatenFeatureProperties
  > | null>(null);
  const [kecamatanGeoJson, setKecamatanGeoJson] = useState<FeatureCollection<
    Geometry,
    KecamatanFeatureProperties
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load both GeoJSON files from choropleth folder
        const [kabupatenResponse, kecamatanResponse] = await Promise.all([
          fetch("/choropleth/gadm41_JABAR_2.json"),
          fetch("/choropleth/gadm41_JABAR_3.json"),
        ]);

        const kabupatenData: FeatureCollection<
          Geometry,
          Record<string, unknown>
        > = await kabupatenResponse.json();
        const kecamatanData: FeatureCollection<
          Geometry,
          Record<string, unknown>
        > = await kecamatanResponse.json();

        // Both files already contain only Jawa Barat data
        const jabarKabupatenFeatures = kabupatenData.features;

        console.log(
          "Loaded kabupaten features:",
          jabarKabupatenFeatures.length
        );
        console.log(
          "Sample kabupaten feature:",
          jabarKabupatenFeatures[0]?.properties
        );

        // Fetch road damage data from MongoDB via API
        const response = await fetch("/api/road-damages");
        const roadDamagesData = await response.json();

        if (!roadDamagesData.success) {
          throw new Error("Failed to fetch road damages data");
        }

        const roadDamages: RoadDamageData[] = roadDamagesData.data;

        // Group data by kabupaten
        const kabupatenStatsMap = new Map<string, StatsData>();
        // Group data by kecamatan
        const kecamatanStatsMap = new Map<string, StatsData>();

        roadDamages.forEach((data) => {
          // Aggregate by kabupaten
          const kabupatenCode = data.kode_kabupaten_kota;
          if (kabupatenCode) {
            if (!kabupatenStatsMap.has(kabupatenCode)) {
              kabupatenStatsMap.set(kabupatenCode, {
                total: 0,
                parah: 0,
                sedang: 0,
                ringan: 0,
              });
            }

            const kabStats = kabupatenStatsMap.get(kabupatenCode)!;
            kabStats.total++;

            if (data.kerusakan === "berat") {
              kabStats.parah++;
            } else if (data.kerusakan === "sedang") {
              kabStats.sedang++;
            } else if (data.kerusakan === "ringan") {
              kabStats.ringan++;
            }
          }

          // Aggregate by kecamatan
          const kecamatanCode = data.choropleth?.kode;
          if (kecamatanCode) {
            if (!kecamatanStatsMap.has(kecamatanCode)) {
              kecamatanStatsMap.set(kecamatanCode, {
                total: 0,
                parah: 0,
                sedang: 0,
                ringan: 0,
              });
            }

            const kecStats = kecamatanStatsMap.get(kecamatanCode)!;
            kecStats.total++;

            if (data.kerusakan === "berat") {
              kecStats.parah++;
            } else if (data.kerusakan === "sedang") {
              kecStats.sedang++;
            } else if (data.kerusakan === "ringan") {
              kecStats.ringan++;
            }
          }
        });

        // Calculate summary statistics
        let totalDamages = 0;
        let totalParah = 0;
        let totalSedang = 0;
        let totalRingan = 0;

        kabupatenStatsMap.forEach((stats) => {
          totalDamages += stats.total;
          totalParah += stats.parah;
          totalSedang += stats.sedang;
          totalRingan += stats.ringan;
        });

        // Call the callback with calculated stats
        if (onStatsCalculated) {
          onStatsCalculated({
            total: totalDamages,
            critical: totalParah,
            moderate: totalSedang,
            minor: totalRingan,
          });
        }

        // Create kabupaten GeoJSON with stats
        const kabupatenFeaturesWithStats: Feature<
          Geometry,
          KabupatenFeatureProperties
        >[] = jabarKabupatenFeatures.map((feature) => {
          const cc2 = feature.properties.CC_2 as string;
          const stats = kabupatenStatsMap.get(cc2) || {
            total: 0,
            parah: 0,
            sedang: 0,
            ringan: 0,
          };

          return {
            type: "Feature",
            geometry: feature.geometry,
            properties: {
              CC_2: cc2,
              NAME_2: feature.properties.NAME_2 as string,
              NAME_1: feature.properties.NAME_1 as string,
              stats,
            },
          };
        });

        // Create kecamatan GeoJSON with stats
        const kecamatanFeaturesWithStats: Feature<
          Geometry,
          KecamatanFeatureProperties
        >[] = kecamatanData.features.map((feature) => {
          const cc3 = feature.properties.CC_3 as string;
          const stats = kecamatanStatsMap.get(cc3) || {
            total: 0,
            parah: 0,
            sedang: 0,
            ringan: 0,
          };

          return {
            type: "Feature",
            geometry: feature.geometry,
            properties: {
              CC_3: cc3,
              NAME_3: feature.properties.NAME_3 as string,
              NAME_2: feature.properties.NAME_2 as string,
              NAME_1: feature.properties.NAME_1 as string,
              stats,
            },
          };
        });

        setKabupatenGeoJson({
          type: "FeatureCollection",
          features: kabupatenFeaturesWithStats,
        });

        console.log(
          "Kabupaten GeoJSON set with",
          kabupatenFeaturesWithStats.length,
          "features"
        );
        console.log(
          "Sample kabupaten stats:",
          kabupatenFeaturesWithStats[0]?.properties
        );

        setKecamatanGeoJson({
          type: "FeatureCollection",
          features: kecamatanFeaturesWithStats,
        });

        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [onStatsCalculated]);

  const getColor = (total: number, parah: number) => {
    if (total === 0) return "#e5e7eb"; // gray-200 for no data

    // Color based on severity ratio
    const severityRatio = parah / total;

    if (severityRatio > 0.3) return "#dc2626"; // red-600
    if (severityRatio > 0.2) return "#ea580c"; // orange-600
    if (severityRatio > 0.1) return "#f59e0b"; // amber-500
    if (severityRatio > 0.05) return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };

  const kabupatenStyle = (
    feature?: Feature<Geometry, KabupatenFeatureProperties>
  ): L.PathOptions => {
    const stats = feature?.properties.stats || {
      total: 0,
      parah: 0,
      sedang: 0,
      ringan: 0,
    };
    return {
      fillColor: getColor(stats.total, stats.parah),
      weight: 2,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
    };
  };

  const kecamatanStyle = (
    feature?: Feature<Geometry, KecamatanFeatureProperties>
  ): L.PathOptions => {
    const stats = feature?.properties.stats || {
      total: 0,
      parah: 0,
      sedang: 0,
      ringan: 0,
    };
    return {
      fillColor: getColor(stats.total, stats.parah),
      weight: 1.5,
      opacity: 1,
      color: "white",
      dashArray: "2",
      fillOpacity: 0.7,
    };
  };

  const highlightFeature = (e: L.LeafletMouseEvent) => {
    const layer = e.target as L.Path;
    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.9,
    });
    layer.bringToFront();
  };

  const resetKabupatenHighlight = (e: L.LeafletMouseEvent) => {
    const layer = e.target as L.Path & {
      feature: Feature<Geometry, KabupatenFeatureProperties>;
    };
    layer.setStyle(kabupatenStyle(layer.feature));
  };

  const resetKecamatanHighlight = (e: L.LeafletMouseEvent) => {
    const layer = e.target as L.Path & {
      feature: Feature<Geometry, KecamatanFeatureProperties>;
    };
    layer.setStyle(kecamatanStyle(layer.feature));
  };

  const handleKabupatenClick = (
    feature: Feature<Geometry, KabupatenFeatureProperties>,
    layer: L.Layer
  ) => {
    const kabupatenCode = feature.properties.CC_2;

    setSelectedKabupaten(kabupatenCode);
    setViewLevel("kecamatan");

    // Zoom to the clicked kabupaten
    if ("getBounds" in layer && mapRef.current) {
      const bounds = (layer as L.Polygon | L.Polyline).getBounds();
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const onEachKabupatenFeature = (
    feature: Feature<Geometry, KabupatenFeatureProperties>,
    layer: L.Layer
  ) => {
    const nama = feature.properties.NAME_2;
    const stats = feature.properties.stats || {
      total: 0,
      parah: 0,
      sedang: 0,
      ringan: 0,
    };

    layer.bindPopup(`
      <div class="p-3 min-w-[250px]">
        <h3 class="font-bold text-lg text-gray-800 mb-2">${nama}</h3>
        <p class="text-xs text-gray-500 mb-2">Klik untuk melihat detail kecamatan</p>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Kerusakan:</span>
            <span class="font-semibold text-gray-800">${stats.total}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-red-600">Parah:</span>
            <span class="font-semibold text-red-600">${stats.parah}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-yellow-600">Sedang:</span>
            <span class="font-semibold text-yellow-600">${stats.sedang}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-600">Ringan:</span>
            <span class="font-semibold text-green-600">${stats.ringan}</span>
          </div>
        </div>
      </div>
    `);

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetKabupatenHighlight,
      click: () => handleKabupatenClick(feature, layer),
    });
  };

  const onEachKecamatanFeature = (
    feature: Feature<Geometry, KecamatanFeatureProperties>,
    layer: L.Layer
  ) => {
    const namaKecamatan = feature.properties.NAME_3;
    const namaKabupaten = feature.properties.NAME_2;
    const stats = feature.properties.stats || {
      total: 0,
      parah: 0,
      sedang: 0,
      ringan: 0,
    };

    layer.bindPopup(`
      <div class="p-3 min-w-[250px]">
        <h3 class="font-bold text-lg text-gray-800 mb-1">${namaKecamatan}</h3>
        <p class="text-xs text-gray-500 mb-2">${namaKabupaten}</p>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Kerusakan:</span>
            <span class="font-semibold text-gray-800">${stats.total}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-red-600">Parah:</span>
            <span class="font-semibold text-red-600">${stats.parah}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-yellow-600">Sedang:</span>
            <span class="font-semibold text-yellow-600">${stats.sedang}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-600">Ringan:</span>
            <span class="font-semibold text-green-600">${stats.ringan}</span>
          </div>
        </div>
      </div>
    `);

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetKecamatanHighlight,
    });
  };

  // Component to handle back button and map reference
  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      mapRef.current = map;
    }, [map]);

    return null;
  };

  // Component to handle zoom level changes
  const ZoomHandler = () => {
    const map = useMapEvents({
      zoomend: () => {
        const zoom = map.getZoom();
        // Auto switch to kecamatan view when zoomed in
        if (zoom >= 11 && viewLevel === "kabupaten") {
          // Don't auto-switch, let user click
        }
        // Auto switch back to kabupaten when zoomed out
        if (zoom < 10 && viewLevel === "kecamatan") {
          setViewLevel("kabupaten");
          setSelectedKabupaten(null);
        }
      },
    });

    return null;
  };

  // Filter kecamatan features based on selected kabupaten
  const getFilteredKecamatanGeoJson = (): FeatureCollection<
    Geometry,
    KecamatanFeatureProperties
  > | null => {
    if (!kecamatanGeoJson || !selectedKabupaten) return kecamatanGeoJson;

    const filteredFeatures = kecamatanGeoJson.features.filter((feature) => {
      // Match based on kabupaten name or code
      // CC_3 format is usually kabupaten code + kecamatan code
      // For example: 3204150 where 3204 is kabupaten code
      const cc3 = feature.properties.CC_3;
      const kabupatenFromCC3 = cc3.substring(0, 4);
      return selectedKabupaten.startsWith(kabupatenFromCC3);
    });

    return {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
  };

  const handleBackToKabupaten = () => {
    setViewLevel("kabupaten");
    setSelectedKabupaten(null);
    if (mapRef.current) {
      mapRef.current.setView([-6.9175, 107.6191], 9);
    }
  };

  const center: [number, number] = [-6.9175, 107.6191];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat choropleth map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const currentGeoJson =
    viewLevel === "kabupaten"
      ? kabupatenGeoJson
      : getFilteredKecamatanGeoJson();
  const currentStyle =
    viewLevel === "kabupaten" ? kabupatenStyle : kecamatanStyle;
  const currentOnEachFeature =
    viewLevel === "kabupaten" ? onEachKabupatenFeature : onEachKecamatanFeature;

  return (
    <div className="relative w-full h-full">
      {viewLevel === "kecamatan" && (
        <button
          onClick={handleBackToKabupaten}
          className="absolute top-4 left-4 z-[1000] bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow-lg flex items-center gap-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Kembali ke Kabupaten
        </button>
      )}

      <div className="absolute top-4 right-4 z-[1000] bg-white px-3 py-2 rounded shadow-lg border border-gray-300">
        <p className="text-sm font-semibold text-gray-700">
          {viewLevel === "kabupaten"
            ? "Level: Kabupaten/Kota"
            : `Level: Kecamatan ${selectedKabupaten ? "(Filtered)" : ""}`}
        </p>
      </div>

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
        <MapController />
        <ZoomHandler />
        {currentGeoJson && (
          <GeoJSON
            key={viewLevel + (selectedKabupaten || "")}
            data={currentGeoJson}
            style={currentStyle}
            onEachFeature={currentOnEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default DashboardChoropleth;
