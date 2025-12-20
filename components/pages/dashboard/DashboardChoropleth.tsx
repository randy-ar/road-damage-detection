"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import * as topojson from "topojson-client";
import { Feature, FeatureCollection, Geometry } from "geojson";

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

interface KabupatenStatsData {
  total: number;
  parah: number;
  sedang: number;
  ringan: number;
}

interface KabupatenStatsItem {
  id: string;
  nama: string;
  data: KabupatenStatsData;
}

interface KabupatenStatsResponse {
  success: boolean;
  summary: {
    total: number;
    critical: number;
    moderate: number;
    minor: number;
  };
  data: KabupatenStatsItem[];
}

interface TopoJSONProperties {
  ID_0: number;
  ISO: string;
  NAME_0: string;
  ID_1: number;
  NAME_1: string;
  ID_2: number;
  NAME_2: string;
  VARNAME_2: string | null;
  NL_NAME_2: string | null;
  HASC_2: string | null;
  CC_2: string | null;
  TYPE_2: string;
  ENGTYPE_2: string;
  VALIDFR_2: string;
  VALIDTO_2: string;
  REMARKS_2: string | null;
  Shape_Leng: number;
  Shape_Area: number;
}

interface GeoJSONFeatureProperties extends TopoJSONProperties {
  stats: KabupatenStatsData;
}

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
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<
    Geometry,
    GeoJSONFeatureProperties
  > | null>(null);
  const [kabupatenStats, setKabupatenStats] = useState<KabupatenStatsItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load kabupaten stats from API
        const statsResponse = await fetch("/api/kabupaten-stats");
        const statsData: KabupatenStatsResponse = await statsResponse.json();

        if (!statsData.success) {
          throw new Error("Failed to fetch kabupaten stats");
        }

        setKabupatenStats(statsData.data);

        // Call the callback with calculated stats from API
        if (onStatsCalculated) {
          onStatsCalculated({
            total: statsData.summary.total,
            critical: statsData.summary.critical,
            moderate: statsData.summary.moderate,
            minor: statsData.summary.minor,
          });
        }

        // Load TopoJSON
        const topoResponse = await fetch(
          "/indonesia-topojson-city-regency.json"
        );
        const topoData = await topoResponse.json();

        // Convert TopoJSON to GeoJSON
        const geoJson = topojson.feature(
          topoData,
          topoData.objects.IDN_adm_2_kabkota
        ) as unknown as FeatureCollection<Geometry, TopoJSONProperties>;

        // Filter only Jawa Barat (NAME_1 === "Jawa Barat")
        const jabarFeatures = geoJson.features.filter(
          (feature) => feature.properties.NAME_1 === "Jawa Barat"
        );

        // Helper function to normalize kabupaten name for matching
        const normalizeKabupatenName = (name: string): string => {
          // If name starts with "Kota", use as-is
          if (name.toUpperCase().startsWith("KOTA")) {
            return name.toUpperCase();
          }
          // Otherwise, prepend "Kabupaten"
          return `KABUPATEN ${name}`.toUpperCase();
        };

        // Add stats to properties
        const featuresWithStats: Feature<Geometry, GeoJSONFeatureProperties>[] =
          jabarFeatures.map((feature) => {
            const name2 = feature.properties.NAME_2;
            const normalizedName = normalizeKabupatenName(name2);

            // Find matching stats by name
            const matchedStats = statsData.data.find(
              (item) => item.nama.toUpperCase() === normalizedName
            );

            const statsData_: KabupatenStatsData = matchedStats
              ? matchedStats.data
              : {
                  total: 0,
                  parah: 0,
                  sedang: 0,
                  ringan: 0,
                };

            return {
              ...feature,
              properties: {
                ...feature.properties,
                stats: statsData_,
              },
            };
          });

        setGeoJsonData({
          type: "FeatureCollection",
          features: featuresWithStats,
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

  const style = (
    feature?: Feature<Geometry, GeoJSONFeatureProperties>
  ): L.PathOptions => {
    const stats = feature?.properties.stats || {
      total: 0,
      parah: 0,
      sedang: 0,
      ringan: 0,
      nama: "",
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

  const resetHighlight = (e: L.LeafletMouseEvent) => {
    const layer = e.target as L.Path & {
      feature: Feature<Geometry, GeoJSONFeatureProperties>;
    };
    layer.setStyle(style(layer.feature));
  };

  const onEachFeature = (
    feature: Feature<Geometry, GeoJSONFeatureProperties>,
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
      mouseout: resetHighlight,
    });
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
      {geoJsonData && (
        <GeoJSON
          data={geoJsonData}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
};

export default DashboardChoropleth;
