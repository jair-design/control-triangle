import type { ErrorRequestHandler, RequestHandler } from 'express'
import mongoose from 'mongoose'
import { API_MESSAGES, HTTP_STATUS } from '../constants/index.js'
import { HttpError } from '../errors.js'

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(HTTP_STATUS.notFound).json({ message: API_MESSAGES.notFound })
}

function bodyParserType(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return String((error as { type: unknown }).type)
  }
  return null
}

// Express reconoce un manejador de errores por sus 4 parámetros.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ message: error.message, ...(error.fieldErrors && { errors: error.fieldErrors }) })
    return
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [field, detail.message]),
    )
    res.status(HTTP_STATUS.badRequest).json({ message: API_MESSAGES.validation, errors })
    return
  }

  const parserType = bodyParserType(error)
  if (parserType === 'entity.parse.failed') {
    res.status(HTTP_STATUS.badRequest).json({ message: API_MESSAGES.invalidJson })
    return
  }
  if (parserType === 'entity.too.large') {
    res.status(HTTP_STATUS.payloadTooLarge).json({ message: API_MESSAGES.bodyTooLarge })
    return
  }

  // Detalle solo en el log del servidor; al cliente nunca se le exponen datos internos.
  console.error('Error no controlado:', error instanceof Error ? error.stack : error)
  res.status(HTTP_STATUS.serverError).json({ message: API_MESSAGES.serverError })
}
