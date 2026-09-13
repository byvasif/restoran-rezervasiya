import { detectLocale, toLocale, isLocale, type Locale } from '@/i18n/locales'

/**
 * Sorğunun dilini müəyyən edir.
 *
 * Prioritet: açıq `?lang=` parametri → sorğu gövdəsindəki `locale` → brauzerin
 * `Accept-Language` başlığı → Azərbaycanca. Beləcə eyni endpoint həm veb
 * səhifəyə, həm də başqa klientə düzgün dildə cavab verir.
 */
export function resolveRequestLocale(request: Request, body?: unknown): Locale {
  const fromQuery = new URL(request.url).searchParams.get('lang')
  if (isLocale(fromQuery)) return fromQuery

  if (body && typeof body === 'object' && 'locale' in body) {
    const fromBody = (body as { locale?: unknown }).locale
    if (isLocale(fromBody)) return fromBody
  }

  const cookie = request.headers.get('cookie')
  const match = cookie?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  if (match && isLocale(match[1])) return match[1]

  return toLocale(detectLocale(request.headers.get('accept-language')))
}
