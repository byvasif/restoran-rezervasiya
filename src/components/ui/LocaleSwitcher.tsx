'use client'

import { usePathname } from 'next/navigation'
import { LOCALE_SHORT_NAMES, LOCALE_NAMES, SUPPORTED_LOCALES, isLocale, type Locale } from '@/i18n/locales'

/**
 * Dil dəyişdiricisi. Ünvandakı ilk seqmenti əvəz edir, beləcə müştəri
 * baxdığı səhifədə qalır və paylaşdığı link də həmin dildə açılır.
 */
export function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() || '/'

  function hrefFor(locale: Locale): string {
    const segments = pathname.split('/')
    if (isLocale(segments[1])) {
      segments[1] = locale
      return segments.join('/') || '/'
    }
    return `/${locale}${pathname === '/' ? '' : pathname}`
  }

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === current
        return (
          <a
            key={locale}
            href={hrefFor(locale)}
            hrefLang={locale}
            aria-current={isActive ? 'true' : undefined}
            title={LOCALE_NAMES[locale]}
            className={`rounded px-2 py-1 text-[13px] tracking-wide transition-colors ${
              isActive ? 'bg-paper/20 text-paper' : 'text-nar-100/70 hover:text-paper'
            }`}
          >
            {LOCALE_SHORT_NAMES[locale]}
          </a>
        )
      })}
    </nav>
  )
}
