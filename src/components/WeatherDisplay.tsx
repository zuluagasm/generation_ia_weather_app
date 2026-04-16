"use client";

import { useState, FormEvent, useEffect } from "react";
import { useWeather } from "@/hooks/useWeather";
import { ErrorModal } from "./ErrorModal";

export function WeatherDisplay() {
  const { weather, loading, error, getWeather, reset } = useWeather();
  const [cityInput, setCityInput] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  // Cuando hay un nuevo error, resetea el flag de dismissed
  useEffect(() => {
    if (error) {
      setDismissedError(false);
    }
  }, [error]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cityInput.trim()) {
      setShowErrorModal(true);
      return;
    }

    await getWeather(cityInput);
    setCityInput("");
  };

  const handleClear = () => {
    reset();
    setCityInput("");
    setShowErrorModal(false);
    setDismissedError(false);
  };

  const handleCloseModal = () => {
    setShowErrorModal(false);
    setDismissedError(true); // Marca el error como visto/cerrado
  };

  const getWeatherEmoji = (code: number): string => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77 || code >= 80 && code <= 82 || code >= 85 && code <= 86)
      return "❄️";
    if (code === 99) return "⛈️";
    return "🌍";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header Title */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-2">🌍 Weather</h1>
          <p className="text-white/80 text-lg">Descubre el clima en tiempo real</p>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-md bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
              <p className="text-white text-lg font-medium">
                Buscando información del clima...
              </p>
            </div>
          </div>
        )}

        {/* Weather Card - Actual */}
        {weather && !loading && (
          <div className="backdrop-blur-md bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30 animate-in duration-300">
            {/* Location Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70 text-sm font-medium">📍 Ubicación</p>
                <p className="text-white text-sm">
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white">
                +
              </button>
            </div>

            {/* Temperature Display */}
            <div className="text-center mb-8">
              <div className="text-7xl font-bold text-white mb-2">
                {weather.temperature}°
              </div>
              <p className="text-white/90 text-lg font-medium">
                {weather.description}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {weather.city}, {weather.country}
              </p>
            </div>

            {/* Weather Emoji */}
            <div className="text-center mb-8 text-8xl">
              {getWeatherEmoji(weather.weatherCode)}
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Humedad */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-white/60 text-xs font-medium mb-2">Humedad</p>
                <p className="text-white text-lg font-semibold">
                  {weather.humidity}%
                </p>
              </div>

              {/* Viento */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-white/60 text-xs font-medium mb-2">Viento</p>
                <p className="text-white text-lg font-semibold">
                  {weather.windSpeed} km/h
                </p>
              </div>

              {/* Código */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                <p className="text-white/60 text-xs font-medium mb-2">Código</p>
                <p className="text-white text-lg font-semibold">
                  {weather.weatherCode}
                </p>
              </div>
            </div>

            {/* Secondary Info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Sensación Térmica */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">Sensación</p>
                <p className="text-white text-lg font-semibold">
                  {weather.apparentTemperature}°C
                </p>
              </div>

              {/* Zona Horaria */}
              <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                <p className="text-white/60 text-xs font-medium mb-1">Zona Horaria</p>
                <p className="text-white text-sm font-semibold truncate">
                  {weather.timezone}
                </p>
              </div>
            </div>

            {/* Location Coordinates */}
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 mb-6">
              <p className="text-white/60 text-xs font-medium mb-2">Coordenadas</p>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-white font-semibold">
                  Lat: {weather.latitude.toFixed(3)}°
                </p>
                <p className="text-white font-semibold">
                  Lng: {weather.longitude.toFixed(3)}°
                </p>
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-300 to-purple-300 hover:from-blue-200 hover:to-purple-200 text-white font-semibold rounded-2xl transition-all active:scale-95 shadow-lg"
            >
              Buscar otra ciudad
            </button>
          </div>
        )}

        {/* Empty State */}
        {!weather && !loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search Input */}
            <div className="backdrop-blur-md bg-white/20 rounded-3xl p-6 shadow-2xl border border-white/30">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Ingresa una ciudad..."
                disabled={loading}
                className="w-full bg-transparent text-white placeholder-white/50 text-lg focus:outline-none font-medium"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-300 to-purple-300 hover:from-blue-200 hover:to-purple-200 text-white font-semibold rounded-2xl transition-all active:scale-95 shadow-lg disabled:opacity-50 text-lg"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>

            {/* Info Text */}
            <div className="backdrop-blur-md bg-white/20 rounded-2xl p-6 shadow-lg border border-white/30 text-center">
              <p className="text-white/90 font-medium mb-2">Bienvenido a Weather App</p>
              <p className="text-white/70 text-sm">
                Descubre el clima de cualquier ciudad del mundo
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal || (!!error && !dismissedError)}
        error={error || "Por favor, ingresa un nombre de ciudad válido"}
        onClose={handleCloseModal}
      />
    </div>
  );
}
