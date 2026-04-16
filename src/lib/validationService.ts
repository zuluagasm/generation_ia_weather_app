import { ApiError } from "./errorService";
import { CONFIG } from "./config";

/**
 * VALIDACIÓN - Entrada de ciudad
 * 
 * Valida:
 * - Tipo de dato (debe ser string)
 * - No esté vacío después de trimear
 * - No exceda la longitud máxima
 * - No contenga ningún número (0-9)
 * 
 * @throws ApiError si la entrada es inválida
 */
export function validateCityInput(city: unknown): string {
  // Verificar tipo
  if (typeof city !== "string") {
    throw new ApiError(
      "La ciudad debe ser un texto válido",
      { context: "validation:input_type" }
    );
  }

  // Trimear y validar longitud
  const trimmedCity = city.trim();
  
  if (trimmedCity.length === 0) {
    throw new ApiError(
      "Por favor ingresa un nombre de ciudad",
      { context: "validation:empty_input" }
    );
  }

  if (trimmedCity.length > CONFIG.MAX_CITY_LENGTH) {
    throw new ApiError(
      `El nombre de la ciudad no puede exceder ${CONFIG.MAX_CITY_LENGTH} caracteres`,
      { context: "validation:input_too_long" }
    );
  }

  // Validar que no contenga números
  if (/\d/.test(trimmedCity)) {
    throw new ApiError(
      "El nombre de la ciudad no puede contener números",
      { context: "validation:contains_numbers" }
    );
  }

  return trimmedCity;
}


/**
 * VALIDACIÓN - Coordenadas geográficas
 * @throws ApiError si las coordenadas son inválidas
 */
export function validateCoordinates(latitude: unknown, longitude: unknown): { latitude: number; longitude: number } {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new ApiError(
      "Coordenadas inválidas: deben ser números",
      { context: "validation:invalid_coordinates_type" }
    );
  }

  // Validar rangos WGS84
  if (latitude < -90 || latitude > 90) {
    throw new ApiError(
      "Latitud fuera de rango: debe estar entre -90 y 90",
      { context: "validation:latitude_out_of_range" }
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new ApiError(
      "Longitud fuera de rango: debe estar entre -180 y 180",
      { context: "validation:longitude_out_of_range" }
    );
  }

  return { latitude, longitude };
}