export const SUPPORTED_LOCALES = ['az', 'tr', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'az'

/** Dil dəyişdiricisində göstərilən adlar — hər dil öz adı ilə yazılır. */
export const LOCALE_NAMES: Record<Locale, string> = {
  az: 'Azərbaycanca',
  tr: 'Türkçe',
  en: 'English',
}

export const LOCALE_SHORT_NAMES: Record<Locale, string> = {
  az: 'AZ',
  tr: 'TR',
  en: 'EN',
}

/** Telefon nömrələri üçün default ölkə — beynəlxalq format (+994…) həmişə işləyir. */
export const LOCALE_PHONE_REGION: Record<Locale, 'AZ' | 'TR'> = {
  az: 'AZ',
  tr: 'TR',
  // Restoran Bakıdadır: ingilis dilində gələn qonaq da çox vaxt yerli nömrə yazır.
  en: 'AZ',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/** Etibarsız dəyəri default dilə endirir. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * `Accept-Language` başlığından ən uyğun dili seçir.
 * Nümunə: "tr-TR,tr;q=0.9,en;q=0.8" → `tr`.
 */
export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='))
      return { tag: tag.trim().toLowerCase(), quality: quality ? Number(quality.slice(2)) : 1 }
    })
    .filter((entry) => entry.tag.length > 0 && Number.isFinite(entry.quality))
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (isLocale(base)) return base
  }

  return DEFAULT_LOCALE
}

/**
 * Telegram-ın göndərdiyi dil kodunu dəstəklənən dilə uyğunlaşdırır.
 * Tanınmayan dillər ingiliscəyə düşür — həmin istifadəçi üçün ən ehtimallı seçim.
 */
export function localeFromTelegram(languageCode: string | null | undefined): Locale {
  if (!languageCode) return DEFAULT_LOCALE
  const base = languageCode.toLowerCase().split('-')[0]
  if (isLocale(base)) return base
  return base === 'ru' || base === 'az' ? DEFAULT_LOCALE : 'en'
}
