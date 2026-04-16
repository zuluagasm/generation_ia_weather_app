/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => {
    return [
      {
        // Aplicar headers de seguridad a todas las rutas
        source: "/(.*)",
        headers: [
          // Previene clickjacking (A05 - Security Misconfiguration)
          { key: "X-Frame-Options", value: "DENY" },
          // Previene MIME-type sniffing (A05)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controla referrer para no filtrar URLs a terceros (Privacidad)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Fuerza HTTPS en navegadores que ya visitaron el sitio (A02)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Restringe acceso a APIs de browser sensibles (A05)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          // Content Security Policy — solo permite recursos propios y las APIs de Open-Meteo (A03)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ""),   // 'unsafe-eval' requerido por React Refresh en desarrollo
              "style-src 'self' 'unsafe-inline'",    // Tailwind genera estilos inline
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Cache-Control para rutas de API
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
