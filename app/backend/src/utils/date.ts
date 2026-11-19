const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** Comprueba que sea una fecha real en formato AAAA-MM-DD (rechaza "2026-13-45" o "2026-02-30"). */
export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}
