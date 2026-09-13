import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, detectLocale, isLocale } from '@/i18n/locales'

/** Müştərinin əl ilə seçdiyi dil bu kukidə qalır. */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

const LOCALE_HEADER = 'x-locale'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Dil prefiksi olmayan ünvanı uyğun dilə yönləndirir və seçilmiş dili
 * `x-locale` başlığı ilə server komponentlərinə ötürür.
 *
 * Prioritet: URL prefiksi → kuki (əl ilə seçim) → brauzerin `Accept-Language`
 * başlığı → Azərbaycanca.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const segments = pathname.split('/')
  const first = segments[1]

  if (isLocale(first)) {
    const response = NextResponse.next({
      request: { headers: withLocaleHeader(request, first) },
    })
    // Ünvandakı dil sonrakı ziyarətlər üçün yadda saxlanılır.
    if (request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, { maxAge: COOKIE_MAX_AGE, path: '/', sameSite: 'lax' })
    }
    return response
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : detectLocale(request.headers.get('accept-language')) || DEFAULT_LOCALE

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

function withLocaleHeader(request: NextRequest, locale: string): Headers {
  const headers = new Headers(request.headers)
  headers.set(LOCALE_HEADER, locale)
  return headers
}

export const config = {
  /**
   * API marşrutları, Next daxili fayllar və statik fayllar kənarda qalır —
   * onların ünvanları dil prefiksi almır.
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

export { SUPPORTED_LOCALES }
