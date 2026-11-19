import {
  API_BASE_PATH,
  API_ERROR_TEXT,
  HTTP_STATUS,
  NETWORK_ERROR_STATUS,
} from '../constants'

/** Error de una petición a la API, con el mensaje ya listo para mostrar al usuario. */
export class ApiError extends Error {
  readonly status: number
  // Detalle por campo que devuelve el backend en los 400 (p. ej. { title: "…" }).
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface ApiRequestOptions {
  method: string
  accessToken: string
  body?: unknown
  // Mensaje genérico para los errores del servidor de esta operación.
  failureMessage: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toFieldErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

export async function apiRequest<T>(
  path: string,
  { method, accessToken, body, failureMessage }: ApiRequestOptions,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_STATUS, API_ERROR_TEXT.network)
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === HTTP_STATUS.unauthorized) {
      throw new ApiError(response.status, API_ERROR_TEXT.unauthorized)
    }
    if (response.status === HTTP_STATUS.badRequest && isRecord(data)) {
      const message =
        typeof data.message === 'string' ? data.message : API_ERROR_TEXT.validation
      throw new ApiError(response.status, message, toFieldErrors(data.errors))
    }
    // El 404 ("La tarea no existe") y el 409 traen un mensaje pensado para el usuario.
    const hasUserMessage =
      response.status === HTTP_STATUS.notFound || response.status === HTTP_STATUS.conflict
    if (hasUserMessage && isRecord(data) && typeof data.message === 'string') {
      throw new ApiError(response.status, data.message)
    }
    throw new ApiError(response.status, failureMessage)
  }

  return data as T
}
