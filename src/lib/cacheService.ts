import { CONFIG } from "./config";
import { debugLog } from "./debugService";
import type { CacheStore, CacheEntry } from "@/types/openMeteo";

/**
 * CLAVE ÚNICA - Un solo registro en sessionStorage con todos los datos cacheados
 */
const CACHE_STORAGE_KEY = "weather_cache";


/**
 * FALLBACK EN MEMORIA - Para SSR y cuando sessionStorage no esté disponible
 */
const memoryCache = new Map<string, CacheEntry>();

/**
 * VERIFICAR DISPONIBILIDAD - De sessionStorage
 * 
 * @returns true si sessionStorage está disponible
 * @internal
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    if (typeof window === "undefined") return false;
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * CARGAR STORE - Obtener objeto completo de cache desde sessionStorage
 * 
 * @returns CacheStore con todos los registros
 * @internal
 */
function loadCacheStore(): CacheStore {
  const useSessionStorage = isSessionStorageAvailable();

  if (!useSessionStorage) {
    return Object.fromEntries(memoryCache.entries());
  }

  try {
    const stored = sessionStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CacheStore;
    }
  } catch (error) {
    debugLog("Error al leer cache de sessionStorage:", error);
  }

  return {};
}

/**
 * GUARDAR STORE - Almacenar objeto completo de cache en sessionStorage
 * 
 * @param store - CacheStore a guardar
 * @internal
 */
function saveCacheStore(store: CacheStore): void {
  const useSessionStorage = isSessionStorageAvailable();

  if (!useSessionStorage) {
    memoryCache.clear();
    Object.entries(store).forEach(([key, entry]) => {
      memoryCache.set(key, entry);
    });
    return;
  }

  try {
    sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    debugLog("Error al guardar cache en sessionStorage:", error);
    // Fallback a memoria
    memoryCache.clear();
    Object.entries(store).forEach(([key, entry]) => {
      memoryCache.set(key, entry);
    });
  }
}

/**
 * OBTENER ENTRADA - Con validación de TTL (1 hora)
 * 
 * Si el timestamp es mayor a 1 hora, retorna undefined para forzar nueva consulta
 * 
 * @param key - Clave del cache
 * @returns CacheEntry o undefined (si expiró o no existe)
 * @internal
 */
function getCacheEntry(key: string): CacheEntry | undefined {
  const store = loadCacheStore();
  const entry = store[key];

  if (!entry) {
    return undefined;
  }

  // Validar TTL: si pasó más de 1 hora, descartar
  const now = Date.now();
  const ageMs = now - entry.timestamp;

  if (ageMs > CONFIG.CACHE_TTL) {
    debugLog(`Cache expirado para "${key}" (${Math.floor(ageMs / 1000 / 60)} minutos)`);
    return undefined;
  }

  return entry;
}

/**
 * GUARDAR ENTRADA - Agregar o actualizar un registro en el cache
 * 
 * @param key - Clave del cache
 * @param entry - CacheEntry a guardar
 * @internal
 */
function setCacheEntry(key: string, entry: CacheEntry): void {
  const store = loadCacheStore();
  store[key] = entry;
  saveCacheStore(store);
}

/**
 * ELIMINAR ENTRADA - Borrar un registro específico del cache
 * 
 * @param key - Clave del cache
 * @internal
 */
function deleteCacheEntry(key: string): void {
  const store = loadCacheStore();
  delete store[key];
  saveCacheStore(store);
}

/**
 * CACHÉ - Objeto público que mantiene compatibilidad con Map API
 * 
 * Todos los datos se almacenan en una única clave "weather_cache" en sessionStorage
 */
export const weatherCache = {
  /**
   * obtener un registro del cache (con validación de TTL automática)
   */
  get: (key: string) => getCacheEntry(key),

  /**
   * guardar un registro en el cache
   */
  set: (key: string, entry: CacheEntry) => setCacheEntry(key, entry),

  /**
   * verificar si existe un registro válido (no expirado)
   */
  has: (key: string) => getCacheEntry(key) !== undefined,

  /**
   * eliminar un registro específico
   */
  delete: (key: string) => deleteCacheEntry(key),

  /**
   * limpiar todo el cache
   */
  clear: () => {
    const useSessionStorage = isSessionStorageAvailable();
    if (useSessionStorage) {
      try {
        sessionStorage.removeItem(CACHE_STORAGE_KEY);
      } catch (error) {
        debugLog("Error al limpiar sessionStorage:", error);
      }
    }
    memoryCache.clear();
  },

  /**
   * obtener todas las entradas del cache (solo las válidas no expiradas)
   */
  entries: () => {
    const store = loadCacheStore();
    const now = Date.now();
    const validEntries: Array<[string, CacheEntry]> = [];

    Object.entries(store).forEach(([key, entry]) => {
      // Solo incluir entradas no expiradas
      const ageMs = now - entry.timestamp;
      if (ageMs <= CONFIG.CACHE_TTL) {
        validEntries.push([key, entry]);
      }
    });

    return validEntries;
  },
};

/**
 * CACHE - Limpiar entradas expiradas
 * 
 * Elimina todos los registros con timestamp mayor a 1 hora (CONFIG.CACHE_TTL)
 * Esta función se llama proactivamente para limpiar espacio
 */
export function cleanExpiredCache(): void {
  const store = loadCacheStore();
  const now = Date.now();
  let cleanedCount = 0;

  Object.entries(store).forEach(([key, entry]) => {
    const ageMs = now - entry.timestamp;
    if (ageMs > CONFIG.CACHE_TTL) {
      delete store[key];
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    saveCacheStore(store);
    debugLog(`Cache limpiado: ${cleanedCount} entradas expiradas`);
  }
}

/**
 * LIMPIEZA - Para tests/cleanup
 * 
 * Borra completamente el cache
 * @internal
 */
export function __clearCache(): void {
  weatherCache.clear();
  debugLog("Cache limpiado manualmente");
}