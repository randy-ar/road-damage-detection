import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL("https://placehold.co/**"),
      new URL("https://*.supabase.co/**"),
    ],
  },

  // Suppress harmless ONNX Runtime warnings in development
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore ONNX Runtime CPU vendor warning (harmless, see docs/ONNX_CPU_WARNING.md)
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /onnxruntime-web/,
          message: /Unknown CPU vendor/,
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
