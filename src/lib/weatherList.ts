
/**
 * MAPEO DE CÓDIGOS DE CLIMA - Constante global
 * Fuente: https://www.open-meteo.com/en/docs
 */
export const WEATHER_CODE_MAP = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Lluvia ligera",
  53: "Lluvia moderada",
  55: "Lluvia intensa",
  61: "Lluvia",
  63: "Lluvia fuerte",
  65: "Lluvia muy fuerte",
  71: "Nieve ligera",
  73: "Nieve",
  75: "Nieve fuerte",
  80: "Chubascos",
  81: "Chubascos fuertes",
  82: "Chubascos muy fuertes",
  85: "Nieve moderada",
  86: "Nieve fuerte",
  99: "Tormenta",
} as const satisfies Record<number, string>;