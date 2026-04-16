import { CONFIG } from "./config";

/**
 * LOGGING - Solo en desarrollo
 */
export function debugLog(message: string, data?: unknown): void {
  if (CONFIG.DEBUG) {
    console.log(`[WeatherService] ${message}`, data ?? "");
  }
}