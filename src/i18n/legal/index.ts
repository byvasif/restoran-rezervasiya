import { DEFAULT_LOCALE, type Locale } from '../locales'
import { legalAz, type LegalContent } from './az'
import { legalTr } from './tr'
import { legalEn } from './en'

const LEGAL: Record<Locale, LegalContent> = { az: legalAz, tr: legalTr, en: legalEn }

export function getLegalContent(locale: Locale = DEFAULT_LOCALE): LegalContent {
  return LEGAL[locale] ?? LEGAL[DEFAULT_LOCALE]
}

export type { LegalContent, LegalDocument, LegalSection } from './az'
