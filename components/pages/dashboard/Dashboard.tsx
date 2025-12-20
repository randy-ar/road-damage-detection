"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// Dynamically import the map component with no SSR
const DashboardMap = dynamic(
  () => import("@/components/pages/dashboard/DashboardMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat peta...</p>
        </div>
      </div>
    ),
  }
);

// Dynamically import the choropleth component with no SSR
const DashboardChoropleth = dynamic(
  () => import("@/components/pages/dashboard/DashboardChoropleth"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat choropleth...</p>
        </div>
      </div>
    ),
  }
);

import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  User,
  BarChart3,
  TrendingUp,
} from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [viewMode, setViewMode] = useState<"marker" | "heatmap" | "choropleth">(
    "choropleth"
  );
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    moderate: 0,
    minor: 0,
  });

  // Load CSV data and calculate stats
  useMemo(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/kerusakan_jalan_jabar.csv");
        const csvText = await response.text();
        const lines = csvText.split("\n");

        let total = 0;
        let critical = 0;
        let moderate = 0;
        let minor = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",");
          if (values.length < 10) continue;

          const lat = parseFloat(values[5]);
          const lng = parseFloat(values[6]);

          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lng)) continue;
          // Skip coordinates outside Jawa Barat bounds
          if (lat < -8 || lat > -5.5 || lng < 106 || lng > 109) continue;

          total++;
          const rusak_parah = parseInt(values[8]);
          const rusak_sedang = parseInt(values[9]);

          if (rusak_parah === 1) {
            critical++;
          } else if (rusak_sedang === 1) {
            moderate++;
          } else {
            minor++;
          }
        }

        setStats({ total, critical, moderate, minor });
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    loadStats();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Dashboard Kerusakan Jalan
                </h1>
                <p className="text-sm text-gray-600">Provinsi Jawa Barat</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    {user?.displayName || "Operator"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Kerusakan */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Kerusakan
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Data terkini</span>
            </div>
          </div>

          {/* Kerusakan Parah */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Kerusakan Parah
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.critical.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-red-600 font-medium">
              Prioritas tinggi
            </div>
          </div>

          {/* Kerusakan Sedang */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Kerusakan Sedang
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.moderate.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-yellow-600 font-medium">
              Perlu perhatian
            </div>
          </div>

          {/* Kerusakan Ringan */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Kerusakan Ringan
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.minor.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium">
              Monitoring rutin
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Peta Sebaran Kerusakan Jalan
                </h2>
                <p className="text-sm text-emerald-100 mt-1">
                  Visualisasi real-time kondisi jalan se-Provinsi Jawa Barat
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("choropleth")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === "choropleth"
                      ? "bg-white text-emerald-600 shadow-md"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Choropleth
                </button>
                <button
                  onClick={() => setViewMode("marker")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === "marker"
                      ? "bg-white text-emerald-600 shadow-md"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  Marker
                </button>
              </div>
            </div>
          </div>

          <div className="relative h-[600px]">
            {viewMode === "choropleth" ? (
              <DashboardChoropleth />
            ) : (
              <DashboardMap />
            )}
          </div>

          {/* Legend */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-6">
              <h3 className="font-semibold text-gray-700">Keterangan:</h3>
              {viewMode === "choropleth" ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-6 h-4 bg-green-500"></div>
                      <div className="w-6 h-4 bg-yellow-500"></div>
                      <div className="w-6 h-4 bg-amber-500"></div>
                      <div className="w-6 h-4 bg-orange-600"></div>
                      <div className="w-6 h-4 bg-red-600"></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      Rasio Kerusakan Parah: Rendah → Tinggi
                    </span>
                  </div>
                </>
              ) : viewMode === "heatmap" ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded"></div>
                    <span className="text-sm text-gray-600">
                      Intensitas: Ringan → Parah
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Parah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sedang</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Ringan</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © 2025 Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Barat
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
