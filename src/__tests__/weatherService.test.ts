/**
 * weatherService.test.ts
 * Pruebas para el servicio de clima
 * 
 * Ejecutar: npm test -- weatherService.test.ts
 */

import { fetchWeather, getWeatherDescription } from "@/lib/weatherService";
import { weatherCache } from "@/lib/cacheService";
import axios from "axios";

// El servicio usa apiClient = axios.create(...), no axios.get directamente.
// Usamos una factory en jest.mock para interceptar la instancia creada.
jest.mock("axios", () => {
  const mockGet = jest.fn();
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({ get: mockGet })),
      isAxiosError: jest.fn(() => false),
    },
    create: jest.fn(() => ({ get: mockGet })),
    isAxiosError: jest.fn(() => false),
  };
});

describe("Servicio de Clima", () => {
  // Capturamos la referencia al mock de .get una sola vez después de que
  // weatherService.ts haya llamado a axios.create() al cargarse.
  let mockApiClientGet: jest.Mock;

  beforeAll(() => {
    mockApiClientGet = (axios.create as jest.Mock).mock.results[0].value.get;
  });

  beforeEach(() => {
    mockApiClientGet.mockReset(); // mockReset limpia call records Y la cola de mockResolvedValueOnce pendientes
    weatherCache.clear(); // asegurar aislamiento entre tests: sin caché residual
  });

  // ========================================================================
  // GRUPO 1: Pruebas Happy Path
  // ========================================================================

  describe("fetchWeather - Happy Path", () => {
    test("TC-01: Obtiene clima exitosamente para ciudad válida", async () => {
      // Mock respuesta de geocodificación
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Madrid",
              country: "España",
              latitude: 40.4168,
              longitude: -3.7038,
              timezone: "Europe/Madrid",
            },
          ],
        },
      });

      // Mock respuesta de clima
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 22,
            apparent_temperature: 20,
            relative_humidity_2m: 65,
            weather_code: 0,
            wind_speed_10m: 12,
          },
        },
      });

      const result = await fetchWeather("Madrid");

      expect(result.city).toBe("Madrid");
      expect(result.country).toBe("España");
      expect(result.temperature).toBe(22);
      expect(result.humidity).toBe(65);
      expect(result.description).toBe("Despejado");
    });

    test("TC-03: Obtiene clima de ciudades internacionales", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Tokyo",
              country: "Japón",
              latitude: 35.6762,
              longitude: 139.6503,
              timezone: "Asia/Tokyo",
            },
          ],
        },
      });

      mockApiClientGet.mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 15,
            apparent_temperature: 14,
            relative_humidity_2m: 55,
            weather_code: 3,
            wind_speed_10m: 8,
          },
        },
      });

      const result = await fetchWeather("Tokyo");

      expect(result.country).toBe("Japón");
      expect(result.city).toBe("Tokyo");
    });
  });

  // ========================================================================
  // GRUPO 2: Pruebas de Errores de Entrada
  // ========================================================================

  describe("fetchWeather - Errores de Entrada", () => {
    test("TC-06: Rechaza input vacío", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: { results: [] },
      });

      await expect(fetchWeather("")).rejects.toThrow();
    });

    test("TC-09: Maneja ciudades inexistentes", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: { results: [] },
      });

      // "XyzNoExiste" no contiene números para pasar la validación de entrada.
      // El servicio lanza: 'No se encontró la ciudad "XyzNoExiste". Verifica la ortografía.'
      await expect(fetchWeather("XyzNoExiste")).rejects.toThrow(
        'No se encontró la ciudad "XyzNoExiste"'
      );
    });

    test("TC-10: Rechaza strings numéricos como ciudades", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: { results: [] },
      });

      await expect(fetchWeather("12345")).rejects.toThrow();
    });
  });

  // ========================================================================
  // GRUPO 3: Pruebas de Validación de Datos
  // ========================================================================

  describe("fetchWeather - Validación de Datos", () => {

    test("TC-15: Valida rango de temperatura", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Madrid",
              country: "España",
              latitude: 40.4168,
              longitude: -3.7038,
              timezone: "Europe/Madrid",
            },
          ],
        },
      });

      mockApiClientGet.mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 45,
            apparent_temperature: 43,
            relative_humidity_2m: 45,
            weather_code: 0,
            wind_speed_10m: 5,
          },
        },
      });

      const result = await fetchWeather("Madrid");

      expect(result.temperature).toBeGreaterThan(-50);
      expect(result.temperature).toBeLessThan(60);
    });

    test("TC-16: Valida rango de humedad", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Madrid",
              country: "España",
              latitude: 40.4168,
              longitude: -3.7038,
              timezone: "Europe/Madrid",
            },
          ],
        },
      });

      mockApiClientGet.mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 22,
            apparent_temperature: 20,
            relative_humidity_2m: 75,
            weather_code: 0,
            wind_speed_10m: 10,
          },
        },
      });

      const result = await fetchWeather("Madrid");

      expect(result.humidity).toBeGreaterThanOrEqual(0);
      expect(result.humidity).toBeLessThanOrEqual(100);
    });

    test("TC-20: Valida coordenadas", async () => {
      mockApiClientGet.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: "Madrid",
              country: "España",
              latitude: 40.4168,
              longitude: -3.7038,
              timezone: "Europe/Madrid",
            },
          ],
        },
      });

      mockApiClientGet.mockResolvedValueOnce({
        data: {
          current: {
            temperature_2m: 22,
            apparent_temperature: 20,
            relative_humidity_2m: 65,
            weather_code: 0,
            wind_speed_10m: 12,
          },
        },
      });

      const result = await fetchWeather("Madrid");

      expect(result.latitude).toBeGreaterThanOrEqual(-90);
      expect(result.latitude).toBeLessThanOrEqual(90);
      expect(result.longitude).toBeGreaterThanOrEqual(-180);
      expect(result.longitude).toBeLessThanOrEqual(180);
    });
  });

  // ========================================================================
  // GRUPO 4: Pruebas de getWeatherDescription()
  // ========================================================================

  describe("getWeatherDescription", () => {
    test("TC-21: Traduce código 0", () => {
      expect(getWeatherDescription(0)).toBe("Despejado");
    });

    test("TC-22: Traduce código 99", () => {
      expect(getWeatherDescription(99)).toBe("Tormenta");
    });

    test("TC-23: Retorna Desconocido para código no mapeado", () => {
      expect(getWeatherDescription(999)).toBe("Desconocido");
    });

    test("TC-24: Todos los códigos principales están mapeados", () => {
      const codes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 85, 86, 99];
      codes.forEach((code) => {
        const description = getWeatherDescription(code);
        expect(description).not.toBe("Desconocido");
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================================================
  // GRUPO 5: Pruebas de Manejo de Errores
  // ========================================================================

  describe("fetchWeather - Manejo de Errores", () => {
    test("TC-31: Maneja respuesta malformada de API", async () => {
      mockApiClientGet.mockRejectedValueOnce(
        new Error("Network Error")
      );

      await expect(fetchWeather("Madrid")).rejects.toThrow();
    });

    test("Maneja error de axios", async () => {
      const axiosError = new Error("Request failed");
      mockApiClientGet.mockRejectedValueOnce(axiosError);

      await expect(fetchWeather("Madrid")).rejects.toThrow();
    });
  });
});
