"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

// Type for ONNX Runtime
type OrtType = typeof import("onnxruntime-web");

export default function RealtimeDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [session, setSession] = useState<OrtType["InferenceSession"] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [ort, setOrt] = useState<OrtType | null>(null);
  const [modelInfo, setModelInfo] = useState<string | null>(null);

  // Ensure we're on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dynamically import onnxruntime-web on client side only
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    async function loadOnnxRuntime() {
      try {
        console.log("Loading ONNX Runtime Web...");
        const ortModule = await import("onnxruntime-web");
        setOrt(ortModule);
        console.log("ONNX Runtime Web loaded successfully");
      } catch (e) {
        console.error("Failed to load ONNX Runtime Web:", e);
        setError("Failed to load ONNX Runtime library");
        setIsLoading(false);
      }
    }

    loadOnnxRuntime();
  }, [isMounted]);

  // Load Model after ONNX Runtime is loaded
  useEffect(() => {
    if (!ort) return;

    const ortRuntime = ort; // Create local constant for type safety

    async function loadModel() {
      try {
        // Configure ONNX Runtime Web environment
        if (ortRuntime.env?.wasm) {
          ortRuntime.env.wasm.wasmPaths =
            "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/";
          // Suppress CPU vendor warning (harmless warning about unknown CPU)
          ortRuntime.env.wasm.numThreads = 1;
        }

        // Set log level to warning to reduce console noise
        ortRuntime.env.logLevel = "warning";

        console.log("Loading ONNX model from /models/ssd_mobilenet.onnx...");

        const sess = await ortRuntime.InferenceSession.create(
          "/models/ssd_mobilenet.onnx",
          {
            // Try WebGL first, then fallback to WASM and CPU
            executionProviders: ["webgl", "wasm", "cpu"],
          }
        );

        console.log("✅ Model loaded successfully!");

        // Log which execution provider is being used
        console.log("🚀 Model ready - Inference session created");
        console.log("� Model inputs:", sess.inputNames);
        console.log("📊 Model outputs:", sess.outputNames);

        // Set model info for UI display
        setModelInfo(
          `Model loaded with ${sess.inputNames.length} input(s) and ${sess.outputNames.length} output(s)`
        );

        setSession(sess as unknown as OrtType["InferenceSession"]);
        setIsLoading(false);
      } catch (e) {
        console.error("❌ Failed to load model:", e);
        setError(
          e instanceof Error ? e.message : "Unknown error loading model"
        );
        setIsLoading(false);
      }
    }

    loadModel();
    startCamera(); // Keep startCamera here as it was originally in the model loading effect
  }, [ort]);

  // 2. Akses Kamera
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Kamera belakang untuk HP
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  };

  // 3. Loop Deteksi
  useEffect(() => {
    let requestID: number;

    const detectFrame = async () => {
      if (videoRef.current && canvasRef.current && session) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === 4) {
          // Samakan ukuran canvas dengan video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // --- Proses Gambar ke Tensor ---
          // Catatan: Anda perlu menyesuaikan preprocessing ini
          // sesuai dengan input model SSD/EfficientNet Anda (300x300 atau 224x224)

          // Contoh pemanggilan inferensi (pseudo-code sesuai lib/onnx-utils Anda)
          // const results = await runInference(session, video);

          // --- Gambar Hasil ke Canvas ---
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Contoh menggambar Box (Ganti dengan koordinat hasil prediksi)
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 4;
          ctx.strokeRect(50, 50, 200, 200);
          ctx.fillStyle = "#00FF00";
          ctx.fillText("Rusak: Ringan", 55, 45);
        }
      }
      requestID = requestAnimationFrame(detectFrame);
    };

    detectFrame();
    return () => cancelAnimationFrame(requestID);
  }, [session]);

  return (
    <Card className="p-4 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Deteksi Realtime</h2>
      {isLoading && <p className="text-blue-600">Memuat Model...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error loading model:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {modelInfo && !isLoading && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">✅ {modelInfo}</p>
        </div>
      )}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="rounded-lg shadow-lg"
          style={{ width: "100%", maxWidth: "640px" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ width: "100%", maxWidth: "640px" }}
        />
      </div>
    </Card>
  );
}
