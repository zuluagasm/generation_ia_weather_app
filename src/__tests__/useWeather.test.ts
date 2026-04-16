/**
 * useWeather.test.ts
 * Pruebas para el hook useWeather
 * 
 * Ejecutar: npm test -- useWeather.test.ts
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useWeather } from "@/hooks/useWeather";
import * as weatherService from "@/lib/weatherService";

// Mock del servicio
jest.mock("@/lib/weatherService");
const mockedWeatherService = weatherService as jest.Mocked<typeof weatherService>;

describe("useWeather Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Inicializa con valores por defecto", () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.weather).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test("Obtiene clima exitosamente", async () => {
    const mockWeatherData = {
      city: "Madrid",
      country: "España",
      temperature: 22,
      humidity: 65,
      windSpeed: 12,
      apparentTemperature: 20,
      weatherCode: 0,
      description: "Despejado",
      latitude: 40.4168,
      longitude: -3.7038,
      timezone: "Europe/Madrid",
    };

    mockedWeatherService.fetchWeather.mockResolvedValueOnce(mockWeatherData);

    const { result } = renderHook(() => useWeather());

    act(() => {
      result.current.getWeather("Madrid");
    });

    // Espera a que loading sea true
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Espera a que loading sea false y weather tenga datos
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.weather).toEqual(mockWeatherData);
    });
  });

  test("Maneja errores de la API", async () => {
    const errorMessage = "Ciudad no encontrada";
    mockedWeatherService.fetchWeather.mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useWeather());

    act(() => {
      result.current.getWeather("XyzNoExiste");
    });

    await waitFor(() => {
      expect(result.current.error).toContain(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  test("Reset limpia el estado", async () => {
    const mockWeatherData = {
      city: "Madrid",
      country: "España",
      temperature: 22,
      humidity: 65,
      windSpeed: 12,
      apparentTemperature: 20,
      weatherCode: 0,
      description: "Despejado",
      latitude: 40.4168,
      longitude: -3.7038,
      timezone: "Europe/Madrid",
    };

    mockedWeatherService.fetchWeather.mockResolvedValueOnce(mockWeatherData);

    const { result } = renderHook(() => useWeather());

    // Obtiene clima
    act(() => {
      result.current.getWeather("Madrid");
    });

    // Espera a que tenga datos
    await waitFor(() => {
      expect(result.current.weather).not.toBeNull();
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("Rechaza entrada vacía", async () => {
    const { result } = renderHook(() => useWeather());

    act(() => {
      result.current.getWeather("   ");
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
