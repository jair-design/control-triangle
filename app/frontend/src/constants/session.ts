// Al recargar con una sesión guardada se valida contra Cognito antes de mostrar la app.
// El aviso "Iniciando sesión…" solo aparece si esa validación tarda más que este tiempo:
// con una red normal no llega a verse, y se evita un parpadeo en cada recarga.
export const RESTORING_NOTICE_DELAY_MS = 600
