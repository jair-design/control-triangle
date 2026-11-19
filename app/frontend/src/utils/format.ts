import {
  DATE_FORMAT_OPTIONS,
  DATE_LOCALE,
  MAX_AVATAR_INITIALS,
} from '../constants'

/** "2026-11-12" → "12 nov". Se interpreta como fecha local para evitar el desfase por zona horaria. */
export function formatShortDate(isoDate: string): string | null {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMAT_OPTIONS)
    .format(new Date(year, month - 1, day))
    .replace('.', '')
}

/** "Ana Pérez" → "AP". */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, MAX_AVATAR_INITIALS)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
