import axios from "axios";

/**
 * ERROR HELPER - Extensión de Error con contexto
 * @internal
 */
export class ApiError extends Error {
  code?: string;
  status?: number;
  context: string;

  constructor(message: string, { context, status, code }: Omit<ApiError, "message" | "name">) {
    super(message);
    this.name = "ApiError";
    this.context = context;
    this.status = status;
    this.code = code;
  }
}

/**
 * MANEJO DE ERRORES - Clasificación y transform
 * Convierte errores de Axios en mensajes claros y accionables
 */
export function createApiError(error: unknown, context: string) : never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code = error.code;

    // Timeout
    if (code === "ECONNABORTED") {
      throw new ApiError(
        "La solicitud tardó demasiado tiempo. Intenta nuevamente.",
        { 
          context: `${context}:timeout`,
          status: 408,
          code: "TIMEOUT",
        }
      );
    }

    // Conectividad
    if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ECONNRESET") {
      throw new ApiError(
        "No se pudo conectar al servicio. Verifica tu conexión.",
        { 
          context: `${context}:connectivity`,
          status: 503,
          code: "CONNECTIVITY_ERROR",
        }
      );
    }

    // Rate limiting
    if (status === 429) {
      throw new ApiError(
        "Demasiadas solicitudes. Intenta más tarde.",
        { 
          context: `${context}:rate_limit`,
          status: 429,
          code: "RATE_LIMITED",
        }
      );
    }

    // Bad request
    if (status === 400) {
      throw new ApiError(
        "Solicitud inválida. Verifica los parámetros.",
        { 
          context: `${context}:bad_request`,
          status: 400,
          code: "BAD_REQUEST",
        }
      );
    }

    // Servidor error
    if (status === 500 || status === 503) {
      throw new ApiError(
        "El servicio no está disponible. Intenta más tarde.",
        { 
          context: `${context}:server_error`,
          status: status || 500,
          code: "SERVER_ERROR",
        }
      );
    }

    // Error genérico de Axios
    throw new ApiError(
      "Error en la conexión. Intenta más tarde.",
      { 
        context: `${context}:network_error`,
        status: status || 500,
        code: code || "UNKNOWN_ERROR",
      }
    );
  }

  // Error genérico
  throw new ApiError(
    "Error inesperado. Intenta más tarde.",
    { 
      context: `${context}:unknown_error`,
      status: 500,
      code: "UNKNOWN",
    }
  );
}