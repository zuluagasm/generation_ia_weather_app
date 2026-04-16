"use client";

import { useState, useCallback } from "react";
import { fetchWeather } from "@/lib/weatherService";
import { WeatherData } from "@/types/openMeteo";
import { UseWeatherReturn } from "@/types/openMeteo";
/**
 * Hook personalizado para obtener datos del clima
 * 
 * Uso:
 * const { weather, loading, error, getWeather } = useWeather();
 * 
 * // Obtener clima de una ciudad
 * await getWeather("Madrid");
 */
export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeather = useCallback(async (city: string) => {
    if (!city.trim()) {
      setError("Por favor ingresa un nombre de ciudad");
      return;
    }

    setLoading(true);
    setError(null);
    setWeather(null);

    try {
      const data = await fetchWeather(city);
      setWeather(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error fetching weather:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setWeather(null);
    setError(null);
    setLoading(false);
  }, []);

  return { weather, loading, error, getWeather, reset };
}
