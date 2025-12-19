"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { MapPin, Shield, TrendingUp, Users } from "lucide-react";

const Login = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Info */}
        <div className="text-white space-y-8 hidden md:block">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Dashboard Kerusakan Jalan
                </h1>
                <p className="text-blue-100">Provinsi Jawa Barat</p>
              </div>
            </div>
            <p className="text-lg text-blue-50 leading-relaxed">
              Sistem monitoring dan pemetaan kerusakan infrastruktur jalan untuk
              operator dinas pemerintahan
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Peta Interaktif</h3>
                <p className="text-sm text-blue-100">
                  Visualisasi sebaran kerusakan jalan se-Jawa Barat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-indigo-500/30 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analisis Real-time</h3>
                <p className="text-sm text-blue-100">
                  Data terkini kondisi jalan dan prioritas perbaikan
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-all duration-300">
              <div className="p-2 bg-purple-500/30 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Akses Aman</h3>
                <p className="text-sm text-blue-100">
                  Login dengan akun Google untuk keamanan maksimal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-8">
          {/* Mobile Header */}
          <div className="md:hidden text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Dashboard Kerusakan Jalan
            </h2>
            <p className="text-gray-600">Provinsi Jawa Barat</p>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">Selamat Datang</h2>
            <p className="text-gray-600">
              Silakan login untuk mengakses dashboard
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-indigo-500 hover:shadow-lg text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="group-hover:text-indigo-600 transition-colors">
                  Masuk dengan Google
                </span>
              </>
            )}
          </button>

          {/* Info Text */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Khusus untuk operator dinas pemerintahan</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <Shield className="w-4 h-4" />
              <span>Login aman dengan Google SSO</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>© 2025 Dinas Pekerjaan Umum dan Penataan Ruang</p>
            <p className="mt-1">Provinsi Jawa Barat</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
