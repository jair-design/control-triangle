import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { RequestHandler, Response } from 'express'
import { API_MESSAGES, BEARER_PATTERN, HTTP_STATUS } from '../constants/index.js'

interface AuthOptions {
  userPoolId: string
  clientId: string
}

function reject(res: Response): void {
  res
    .status(HTTP_STATUS.unauthorized)
    .set('WWW-Authenticate', 'Bearer')
    .json({ message: API_MESSAGES.unauthorized })
}

/**
 * Exige un access token de Cognito válido: firma (claves públicas del User Pool),
 * emisor, caducidad, tipo "access" y client_id. Las claves se descargan una vez y se cachean.
 */
export function requireAuth({ userPoolId, clientId }: AuthOptions): RequestHandler {
  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'access',
  })

  return async (req, res, next) => {
    const match = BEARER_PATTERN.exec(req.headers.authorization ?? '')
    if (!match) {
      reject(res)
      return
    }
    try {
      res.locals.auth = await verifier.verify(match[1])
      next()
    } catch {
      // Sin detalles: no se revela por qué falló el token.
      reject(res)
    }
  }
}
