/**
 * CONFIGURACIÓN - Centralizadas para fácil cambio
 */
export const CONFIG = {
  GEOCODE_URL: process.env.NEXT_PUBLIC_GEOCODE_URL || "",
  WEATHER_URL: process.env.NEXT_PUBLIC_WEATHER_URL || "",
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10000, // 10s
  LANGUAGE: process.env.NEXT_PUBLIC_API_LANGUAGE || "es",
  CACHE_TTL: Number(process.env.NEXT_PUBLIC_CACHE_TTL) || 3600000, // 1h
  MAX_CITY_LENGTH: 100,
  DEBUG: process.env.NODE_ENV === "development",
} as const;