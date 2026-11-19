/** Error con el código HTTP con el que debe responder la API. */
export class HttpError extends Error {
  readonly status: number
  // Detalle por campo (p. ej. { title: "El título es obligatorio" }), si aplica.
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}
