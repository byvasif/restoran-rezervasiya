import { z } from 'zod'
import { isValidDateString, isValidTimeString } from '@/lib/time/timezone'
import { normalizePhone } from './phone'

/** Sadə mətn sahələri: kənar boşluqlar silinir, idarəedici simvollar atılır. */
const personName = z
  .string()
  .trim()
  .min(2, 'Ən azı 2 simvol olmalıdır')
  .max(50, 'Ən çox 50 simvol ola bilər')
  .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Yalnız hərflər, boşluq, apostrof və defis istifadə edilə bilər')

export const dateSchema = z.string().refine(isValidDateString, 'Tarix `YYYY-MM-DD` formatında olmalıdır')
export const timeSchema = z.string().refine(isValidTimeString, 'Saat `HH:MM` formatında olmalıdır')

export const reservationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, 'Rezervasiya kodu yanlışdır')

export const cancellationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Ləğv tokeni yanlışdır')

export const createReservationSchema = z.object({
  firstName: personName,
  lastName: personName,
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Telefon nömrəsi tələb olunur')
    .transform((value, ctx) => {
      const normalized = normalizePhone(value)
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Telefon nömrəsi düzgün deyil. Nümunə: +994 50 123 45 67',
        })
        return z.NEVER
      }
      return normalized
    }),
  date: dateSchema,
  time: timeSchema,
  /** Telegram chat ID-sini daşıyan imzalı token (bot linkindən gəlir). */
  telegramToken: z.string().max(512).optional(),
  /** Təkrar göndərilən sorğuların duplicate rezervasiya yaratmaması üçün. */
  idempotencyKey: z.string().uuid().optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const cancelRequestSchema = z.object({
  token: cancellationTokenSchema,
})
