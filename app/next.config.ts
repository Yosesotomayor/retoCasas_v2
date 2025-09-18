// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: false },

  async headers() {
    // En desarrollo: sin headers para evitar conflictos con HMR/Turbopack y scripts inline de Next
    if (isDev) return [];

    // En producción: headers de seguridad comunes (sin CSP aquí para evitar bloqueos).
    // La CSP robusta con nonce/strict-dynamic se aplicará vía `middleware.ts`.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // NOTA: No establezcas Content-Security-Policy aquí.
          // Usaremos `middleware.ts` con nonce para evitar errores de inline scripts en prod.
        ],
      },
    ];
  },

  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;