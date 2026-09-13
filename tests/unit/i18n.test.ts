import { describe, it, expect } from 'vitest'
import { DICTIONARIES, getDictionary, fill } from '@/i18n'
import { SUPPORTED_LOCALES, detectLocale, isLocale, localeFromTelegram, toLocale } from '@/i18n/locales'
import { getLegalContent } from '@/i18n/legal'
import { formatDateLong, weekdayName, weekdayShortName } from '@/i18n/format-date'
import { resolveLocale } from '@/lib/telegram/handlers'

/** Obyektin bütün açarlarını iç-içə yollarla toplayır. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return [`${prefix}[]`]
  if (value === null || typeof value !== 'object') return [prefix]

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('lüğətlərin tamlığı', () => {
  const reference = keyPaths(DICTIONARIES.az).sort()

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale} lüğətində bütün açarlar var`, () => {
      expect(keyPaths(DICTIONARIES[locale]).sort()).toEqual(reference)
    })

    it(`${locale} lüğətində boş mətn yoxdur`, () => {
      const empty: string[] = []
      const walk = (value: unknown, path: string) => {
        if (typeof value === 'string') {
          if (value.trim().length === 0) empty.push(path)
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => walk(item, `${path}[${index}]`))
        } else if (value && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
        }
      }
      walk(DICTIONARIES[locale], locale)
      expect(empty).toEqual([])
    })

    it(`${locale} üçün 12 ay və 7 həftə günü var`, () => {
      expect(DICTIONARIES[locale].date.months).toHaveLength(12)
      expect(DICTIONARIES[locale].date.weekdays).toHaveLength(7)
      expect(DICTIONARIES[locale].date.weekdaysShort).toHaveLength(7)
    })

    it(`${locale} hüquqi mətnləri doludur`, () => {
      const legal = getLegalContent(locale)
      expect(legal.privacy.sections.length).toBeGreaterThan(3)
      expect(legal.terms.sections.length).toBeGreaterThan(3)
    })
  }
})

describe('dil aşkarlanması', () => {
  it('Accept-Language başlığından ən yüksək keyfiyyətli dili seçir', () => {
    expect(detectLocale('tr-TR,tr;q=0.9,en;q=0.8')).toBe('tr')
    expect(detectLocale('en-US,en;q=0.9')).toBe('en')
    expect(detectLocale('az-AZ,az;q=0.9')).toBe('az')
  })

  it('dəstəklənməyən dildə azərbaycancaya düşür', () => {
    expect(detectLocale('fr-FR,fr;q=0.9')).toBe('az')
    expect(detectLocale(null)).toBe('az')
    expect(detectLocale('')).toBe('az')
  })

  it('sıralamada aşağıda olsa da dəstəklənən dili tapır', () => {
    expect(detectLocale('fr;q=0.9,en;q=0.5')).toBe('en')
  })

  it('etibarsız dəyəri default dilə endirir', () => {
    expect(toLocale('xx')).toBe('az')
    expect(toLocale(undefined)).toBe('az')
    expect(isLocale('tr')).toBe(true)
    expect(isLocale('de')).toBe(false)
  })
})

describe('Telegram dil kodu', () => {
  it('dəstəklənən dilləri tanıyır', () => {
    expect(localeFromTelegram('tr')).toBe('tr')
    expect(localeFromTelegram('en-GB')).toBe('en')
    expect(localeFromTelegram('az')).toBe('az')
  })

  it('rus dilində azərbaycancaya, digərlərində ingiliscəyə düşür', () => {
    expect(localeFromTelegram('ru')).toBe('az')
    expect(localeFromTelegram('de')).toBe('en')
    expect(localeFromTelegram(undefined)).toBe('az')
  })

  it('saxlanmış seçim avtomatik aşkarlamanı üstələyir', () => {
    expect(resolveLocale('en', 'tr')).toBe('en')
    expect(resolveLocale(null, 'tr')).toBe('tr')
    expect(resolveLocale(undefined, undefined)).toBe('az')
  })
})

describe('tarix formatı', () => {
  it('hər dildə öz sırası və ay adı ilə yazılır', () => {
    expect(formatDateLong('2027-05-10', 'az')).toBe('10 may 2027, Bazar ertəsi')
    expect(formatDateLong('2027-05-10', 'tr')).toBe('10 Mayıs 2027, Pazartesi')
    expect(formatDateLong('2027-05-10', 'en')).toBe('Monday, 10 May 2027')
  })

  it('həftə günü adları düzgündür', () => {
    expect(weekdayName(0, 'az')).toBe('Bazar')
    expect(weekdayName(0, 'tr')).toBe('Pazar')
    expect(weekdayName(0, 'en')).toBe('Sunday')
    expect(weekdayShortName(1, 'tr')).toBe('Pzt')
  })

  it('yanlış tarixi olduğu kimi qaytarır', () => {
    expect(formatDateLong('cəfəng', 'az')).toBe('cəfəng')
  })
})

describe('fill', () => {
  it('yerləri doldurur', () => {
    expect(fill('{minutes} dəqiqə', { minutes: 60 })).toBe('60 dəqiqə')
    expect(fill('{a} və {b}', { a: 'x', b: 'y' })).toBe('x və y')
  })

  it('dəyər verilməsə yeri toxunulmaz saxlayır', () => {
    expect(fill('{yoxdur}', {})).toBe('{yoxdur}')
  })

  it('lüğətdən gələn mətni doldurur', () => {
    const text = fill(getDictionary('en').booking.intro, { minutes: 90 })
    expect(text).toContain('90 minutes')
  })
})
