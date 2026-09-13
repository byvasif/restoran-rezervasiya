import { az, type Dictionary } from './dictionaries/az'
import { tr } from './dictionaries/tr'
import { en } from './dictionaries/en'
import { DEFAULT_LOCALE, type Locale } from './locales'

const DICTIONARIES: Record<Locale, Dictionary> = { az, tr, en }

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

export { DICTIONARIES }
export type { Dictionary }
export * from './locales'
export * from './fill'
