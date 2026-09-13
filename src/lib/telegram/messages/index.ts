import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'
import { customerAz } from './customer-az'
import { customerTr } from './customer-tr'
import { customerEn } from './customer-en'
import type { CustomerMessages } from './types'

const CUSTOMER: Record<Locale, CustomerMessages> = {
  az: customerAz,
  tr: customerTr,
  en: customerEn,
}

export function getCustomerMessages(locale: Locale = DEFAULT_LOCALE): CustomerMessages {
  return CUSTOMER[locale] ?? CUSTOMER[DEFAULT_LOCALE]
}

export { ownerMessages } from './owner'
export { escapeHtml, LANGUAGE_KEYBOARD } from './types'
export type { CustomerMessages, ReservationMessageData, ActiveReservationLine, Reply } from './types'
