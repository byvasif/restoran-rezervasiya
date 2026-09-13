import { z } from 'zod'
import { isValidDateString, isValidTimeString } from '@/lib/time/timezone'
import { LOCALE_PHONE_REGION, SUPPORTED_LOCALES, type Locale } from '@/i18n/locales'
import { normalizePhone } from './phone'

/**
 * Xəta mesajları burada lüğət açarı kimi saxlanılır, hazır mətn kimi yox.
 * Tərcüməni API marşrutu edir — belə olanda eyni sxem üç dildə işləyir.
 */
export const VALIDATION_KEYS = {
  nameTooShort: 'nameTooShort',
  nameTooLong: 'nameTooLong',
  nameInvalid: 'nameInvalid',
  phoneRequired: 'phoneRequired',
  phoneInvalid: 'phoneInvalid',
  dateFormat: 'dateFormat',
  timeFormat: 'timeFormat',
  codeInvalid: 'codeInvalid',
  tokenInvalid: 'tokenInvalid',
} as const

export type ValidationKey = (typeof VALIDATION_KEYS)[keyof typeof VALIDATION_KEYS]

const personName = z
  .string()
  .trim()
  .min(2, VALIDATION_KEYS.nameTooShort)
  .max(50, VALIDATION_KEYS.nameTooLong)
  .regex(/^[\p{L}\p{M}\s'-]+$/u, VALIDATION_KEYS.nameInvalid)

export const dateSchema = z.string().refine(isValidDateString, VALIDATION_KEYS.dateFormat)
export const timeSchema = z.string().refine(isValidTimeString, VALIDATION_KEYS.timeFormat)

export const reservationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, VALIDATION_KEYS.codeInvalid)

export const cancellationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, VALIDATION_KEYS.tokenInvalid)

export const localeSchema = z.enum(SUPPORTED_LOCALES).optional()

/**
 * Telefon nömrəsinin default ölkəsi müştərinin dilindən asılıdır: türkcə
 * səhifədə yazılan `0555…` TR nömrəsi kimi oxunur. Beynəlxalq format (+994…)
 * hər dildə işləyir.
 */
export function buildCreateReservationSchema(locale: Locale) {
  const region = LOCALE_PHONE_REGION[locale]

  return z.object({
    firstName: personName,
    lastName: personName,
    phoneNumber: z
      .string()
      .trim()
      .min(1, VALIDATION_KEYS.phoneRequired)
      .transform((value, ctx) => {
        const normalized = normalizePhone(value, region)
        if (!normalized) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: VALIDATION_KEYS.phoneInvalid })
          return z.NEVER
        }
        return normalized
      }),
    date: dateSchema,
    time: timeSchema,
    locale: localeSchema,
    /** Telegram chat ID-sini daşıyan imzalı token (bot linkindən gəlir). */
    telegramToken: z.string().max(512).optional(),
    /** Təkrar göndərilən sorğuların duplicate rezervasiya yaratmaması üçün. */
    idempotencyKey: z.string().uuid().optional(),
  })
}

export type CreateReservationInput = z.infer<ReturnType<typeof buildCreateReservationSchema>>

export const cancelRequestSchema = z.object({
  token: cancellationTokenSchema,
})
