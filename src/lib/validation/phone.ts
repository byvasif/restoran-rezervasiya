import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Telefon nömrəsini E.164 formasına gətirir (default region: Azərbaycan).
 * Yanlış nömrə üçün `null` qaytarır — çağıran tərəf bunu istifadəçiyə
 * anlaşılan mesajla bildirir.
 */
export function normalizePhone(raw: string, defaultCountry: 'AZ' | 'TR' = 'AZ'): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null

  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)
  if (!parsed || !parsed.isValid()) return null
  return parsed.number
}

/** `+994501234567` → `+994 50 123 45 67` (yalnız göstərmək üçün). */
export function formatPhoneForDisplay(phone: string): string {
  const parsed = parsePhoneNumberFromString(phone)
  return parsed ? parsed.formatInternational() : phone
}
