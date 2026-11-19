import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { EXIT_CODE_STARTUP_ERROR } from './constants/index.js'
import { closeDb, connectDb } from './db.js'

async function main() {
  const config = loadConfig()

  // Primero la base: si no hay conexión, no tiene sentido aceptar peticiones.
  await connectDb(config.mongodbUri)
  console.log('MongoDB conectado')

  const server = createApp(config).listen(config.port, () => {
    console.log(`Backend escuchando en http://localhost:${config.port}`)
  })

  // Cierre limpio: deja de aceptar peticiones y libera la conexión a la base.
  const shutdown = (signal: string) => {
    console.log(`${signal} recibida: cerrando…`)
    server.close(() => {
      closeDb()
        .catch((error: unknown) => console.error('Error al cerrar MongoDB:', error))
        .finally(() => process.exit(0))
    })
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((error: unknown) => {
  // Solo el mensaje: nunca se imprime la cadena de conexión, que lleva la contraseña.
  const message = error instanceof Error ? error.message : String(error)
  console.error(`No se pudo iniciar el backend: ${message}`)
  process.exit(EXIT_CODE_STARTUP_ERROR)
})
