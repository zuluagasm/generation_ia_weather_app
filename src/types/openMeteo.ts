// Respuesta de la API de Geocodificación
export interface GeocodeResponse {
  results?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    feature_code: string;
    country_code: string;
    country: string;
    admin1?: string;
    timezone: string;
  }[];
  generationtime_ms: number;
}

// Respuesta de la API del Clima
export interface WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
}

export interface WeatherData {
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  context: string;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

export interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  getWeather: (city: string) => Promise<void>;
  reset: () => void;
}
