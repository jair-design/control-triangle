// Puerto por defecto del servidor cuando no se define PORT.
export const DEFAULT_PORT = 3000

// Todos los endpoints del backend viven bajo este prefijo (el proxy de Vite lo reenvía).
export const API_PREFIX = '/api'

// Variables de entorno obligatorias, para mensajes de error claros al arrancar.
export const ENV_MONGODB_URI = 'MONGODB_URI'

// Tiempo máximo para elegir un servidor de MongoDB al conectar (arranque).
export const DB_CONNECT_TIMEOUT_MS = 5000

// Tiempo máximo del ping del health check, para que el endpoint nunca se quede colgado.
export const DB_PING_TIMEOUT_MS = 2000

export const EXIT_CODE_STARTUP_ERROR = 1
