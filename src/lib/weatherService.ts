import axios from "axios";
import { CONFIG } from "./config";
import { ApiError } from "./errorService";
import { createApiError } from "./errorService";
import { debugLog } from "./debugService";
import { weatherCache, cleanExpiredCache } from "./cacheService";
import { validateCityInput, validateCoordinates } from "./validationService";
import { WEATHER_CODE_MAP } from "./weatherList";
import { 
  GeocodeResponse, 
  WeatherResponse, 
  WeatherData,
  LocationData, 
} from "@/types/openMeteo";

/**
 * AXIOS INSTANCE - Con configuración global
 */
const apiClient = axios.create({
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    "User-Agent": "WeatherApp/1.0",
  },
});


/**
 * GEOLOCALIZACIÓN - Obtener coordenadas de ciudad
 * 
 * @param city - Nombre de la ciudad
 * @returns LocationData con coordenadas y datos geográficos
 * @throws ApiError si la ciudad no existe o hay error de conectividad
 * 
 * @example
 * const location = await getCoordinates("Madrid");
 * console.log(location.latitude, location.longitude);
 */
async function getCoordinates(city: string): Promise<LocationData> {
  debugLog("Obteniendo coordenadas para:", city);

  try {
    const response = await apiClient.get<GeocodeResponse>(CONFIG.GEOCODE_URL, {
      params: {
        name: city,
        count: 1,
        language: CONFIG.LANGUAGE,
        format: "json",
      },
    });

    // Validar respuesta
    if (!response.data.results || response.data.results.length === 0) {
      throw new ApiError(
        `No se encontró la ciudad "${city}". Verifica la ortografía.`,
        { 
          context: "geocoding:not_found",
          status: 404,
        }
      );
    }

    const location = response.data.results[0];

    // Validar campos requeridos
    const requiredFields = ["latitude", "longitude", "timezone"];
    for (const field of requiredFields) {
      if (!(field in location) || location[field as keyof typeof location] === undefined) {
        throw new ApiError(
          "Datos incompletos recibidos de la API de geolocalización",
          { 
            context: "geocoding:incomplete_response",
            status: 502,
          }
        );
      }
    }

    const result: LocationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.name || city,
      country: location.country || "Desconocido",
      timezone: location.timezone,
    };

    debugLog("Coordenadas obtenidas:", result);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    createApiError(error, "geocoding");
  }
}

/**
 * CLIMA - Obtener datos de clima por coordenadas
 * 
 * @param latitude - Latitud (WGS84)
 * @param longitude - Longitud (WGS84)
 * @param timezone - Zona horaria IANA
 * @returns WeatherResponse["current"]
 * @throws ApiError si hay error de conectividad o datos incompletos
 * 
 * @example
 * const weather = await getWeatherByCoordinates(40.4168, -3.7038, "Europe/Madrid");
 */
async function getWeatherByCoordinates(
  latitude: number,
  longitude: number,
  timezone: string
): Promise<WeatherResponse["current"]> {
  // Validar entrada
  validateCoordinates(latitude, longitude);

  if (typeof timezone !== "string" || timezone.trim().length === 0) {
    throw new ApiError(
      "Zona horaria inválida",
      { context: "validation:invalid_timezone" }
    );
  }

  debugLog("Obteniendo datos de clima", { latitude, longitude, timezone });

  try {
    const response = await apiClient.get<WeatherResponse>(CONFIG.WEATHER_URL, {
      params: {
        latitude,
        longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        timezone,
        language: CONFIG.LANGUAGE,
      },
    });

    // Validar respuesta
    if (!response.data.current) {
      throw new ApiError(
        "Datos de clima incompletos recibidos de la API",
        { 
          context: "weather:incomplete_response",
          status: 502,
        }
      );
    }

    // Validar campos críticos
    const criticalFields = ["temperature_2m", "weather_code"];
    for (const field of criticalFields) {
      if (!(field in response.data.current) || response.data.current[field as keyof typeof response.data.current] === undefined) {
        throw new ApiError(
          `Campo faltante en respuesta de clima: ${field}`,
          { 
            context: "weather:missing_field",
            status: 502,
          }
        );
      }
    }

    debugLog("Datos de clima obtenidos:", response.data.current);
    return response.data.current;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    createApiError(error, "weather");
  }
}

/**
 * DESCRIPCIÓN DE CLIMA - Convertir código a descripción legible
 * 
 * @param code - Código de clima de Open-Meteo
 * @returns Descripción en español
 * 
 * @example
 * getWeatherDescription(0) // "Despejado"
 * getWeatherDescription(999) // "Desconocido"
 */
export function getWeatherDescription(code: number): string {
  if (!Number.isInteger(code)) {
    debugLog("Código de clima inválido:", code);
    return "Desconocido";
  }

  return WEATHER_CODE_MAP[code as keyof typeof WEATHER_CODE_MAP] ?? "Desconocido";
}

/**
 * CLIMA COMPLETO - Función principal
 * 
 * Obtiene toda la información del clima de una ciudad:
 * - Geolocalización (ciudad, país, zona horaria, coordenadas)
 * - Datos de clima actual (temperatura, humedad, viento, descripción)
 * - Caché inteligente (1 hora TTL)
 * 
 * @param city - Nombre de la ciudad
 * @returns WeatherData completo
 * @throws ApiError con mensajes claros en español
 * 
 * @example
 * try {
 *   const weather = await fetchWeather("Madrid");
 *   console.log(weather.temperature); // 22.5
 * } catch (error) {
 *   console.error(error.message); // "La ciudad no se encontró"
 * }
 */
export async function fetchWeather(city: string): Promise<WeatherData> {
  try {
    // Validar entrada
    const validatedCity = validateCityInput(city);
    
    const cacheKey = validatedCity.toLowerCase();

    // Limpiar cache expirado
    cleanExpiredCache();

    // Verificar cache
    const cached = weatherCache.get(cacheKey);
    if (cached) {
      debugLog("Clima encontrado en cache:", cacheKey);
      return cached.data;
    }

    debugLog("Obteniendo clima para:", validatedCity);

    // Obtener coordenadas y clima en paralelo podría optarse, pero mejor secuencial
    // para mejor manejo de errores (si geocoding falla, no hace la otra llamada)
    const locationData = await getCoordinates(validatedCity);
    const weatherData = await getWeatherByCoordinates(
      locationData.latitude,
      locationData.longitude,
      locationData.timezone
    );

    // Construir respuesta
    const result: WeatherData = {
      city: locationData.city,
      country: locationData.country,
      timezone: locationData.timezone,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      temperature: Math.round(weatherData.temperature_2m * 10) / 10, // 1 decimal
      apparentTemperature: Math.round(weatherData.apparent_temperature * 10) / 10,
      humidity: Math.round(weatherData.relative_humidity_2m),
      windSpeed: Math.round(weatherData.wind_speed_10m * 10) / 10,
      weatherCode: weatherData.weather_code,
      description: getWeatherDescription(weatherData.weather_code),
    };

    // Guardar en cache
    weatherCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    debugLog("Clima cacheado:", cacheKey);
    return result;
  } catch (error) {
    // Re-lanzar ApiError (ya tiene contexto)
    if (error instanceof ApiError) {
      throw error;
    }

    // Error inesperado
    throw new ApiError(
      "Error inesperado al obtener el clima",
      { 
        context: "fetch_weather:unexpected",
        status: 500,
      }
    );
  }
}


