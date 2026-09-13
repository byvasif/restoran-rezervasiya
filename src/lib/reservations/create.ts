import { Prisma, type Reservation } from '@prisma/client'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { buildEventInput, type CalendarPort } from '@/lib/calendar/calendar-port'
import { prisma } from '@/lib/db/prisma'
import { logError, logInfo, maskName, maskPhone } from '@/lib/security/log'
import { verifyChatLink } from '@/lib/telegram/link'
import { getCustomerMessages, ownerMessages, type ReservationMessageData } from '@/lib/telegram/messages'
import { DEFAULT_LOCALE, toLocale, type Locale } from '@/i18n/locales'
import type { TelegramPort } from '@/lib/telegram/telegram-port'
import { addMinutes, dateStringToDbDate, toUtcInstant } from '@/lib/time/timezone'
import type { CreateReservationInput } from '@/lib/validation/schemas'
import { isSlotAvailable } from './availability'
import { generateReservationCode } from './code'
import { generateCancellationToken } from './token'

export interface ReservationDeps {
  calendar: CalendarPort
  telegram: TelegramPort
}

export type CreateFailureCode = 'INVALID_SLOT' | 'SLOT_TAKEN' | 'CALENDAR_FAILED'

export type CreateResult =
  | { ok: true; reservation: Reservation; cancelUrl: string }
  | { ok: false; code: CreateFailureCode }

export function buildCancelUrl(token: string, locale: Locale = DEFAULT_LOCALE): string {
  return `${env.APP_BASE_URL.replace(/\/$/, '')}/${locale}/legv/${token}`
}

/**
 * Rezervasiya yaradır.
 *
 * Ardıcıllıq: server tərəfdə vaxtın yenidən yoxlanması → bazada `confirmed`
 * sətrin yazılması (partial unique index ikinci eyni sorğunu rədd edir) →
 * Google Calendar tədbiri → Telegram bildirişləri.
 *
 * Təqvim tədbiri yaradıla bilməsə rezervasiya `failed` statusuna keçir və slot
 * dərhal yenidən boş görünür — belə halda müştəri yenidən cəhd edə bilər.
 */
export async function createReservation(
  input: CreateReservationInput,
  deps: ReservationDeps,
): Promise<CreateResult> {
  const settings = await getSettings()
  const locale = toLocale(input.locale)

  // Təkrar göndərilən sorğu: eyni açarla artıq yaradılmış rezervasiya qaytarılır.
  if (input.idempotencyKey) {
    const existing = await prisma.reservation.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
    if (existing) {
      return existing.status === 'confirmed'
        ? {
            ok: true,
            reservation: existing,
            cancelUrl: buildCancelUrl(existing.cancellationToken, toLocale(existing.locale)),
          }
        : { ok: false, code: 'CALENDAR_FAILED' }
    }
  }

  if (!(await isSlotAvailable(input.date, input.time, { calendar: deps.calendar }))) {
    return { ok: false, code: 'INVALID_SLOT' }
  }

  const telegramChatId = input.telegramToken
    ? verifyChatLink(input.telegramToken, env.TELEGRAM_WEBHOOK_SECRET)
    : null

  const endTime = addMinutes(input.time, settings.bookingDurationMinutes)

  let reservation: Reservation
  try {
    reservation = await prisma.$transaction(async (tx) => {
      const user = telegramChatId
        ? await tx.user.upsert({
            where: { telegramUserId: telegramChatId },
            create: {
              telegramUserId: telegramChatId,
              telegramChatId,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
            },
            update: {
              telegramChatId,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
            },
          })
        : null

      return tx.reservation.create({
        data: {
          reservationCode: generateReservationCode(),
          userId: user?.id ?? null,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          reservationDate: dateStringToDbDate(input.date),
          startTime: input.time,
          endTime,
          timezone: settings.timezone,
          locale,
          status: 'confirmed',
          telegramChatId,
          telegramUsername: user?.telegramUsername ?? null,
          cancellationToken: generateCancellationToken(),
          idempotencyKey: input.idempotencyKey ?? null,
        },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | string | undefined) ?? ''
      // Eyni idempotency açarı ilə paralel sorğu — mövcud rezervasiyanı qaytarırıq.
      if (String(target).includes('idempotency') && input.idempotencyKey) {
        const existing = await prisma.reservation.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
        if (existing && existing.status === 'confirmed') {
          return {
            ok: true,
            reservation: existing,
            cancelUrl: buildCancelUrl(existing.cancellationToken, toLocale(existing.locale)),
          }
        }
      }
      logInfo('reservations.create', 'Slot paralel sorğu ilə tutuldu', { date: input.date, time: input.time })
      return { ok: false, code: 'SLOT_TAKEN' }
    }
    throw error
  }

  const eventData = {
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    phoneNumber: reservation.phoneNumber,
    date: input.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    telegramUsername: reservation.telegramUsername,
    telegramChatId: reservation.telegramChatId,
    reservationCode: reservation.reservationCode,
    status: reservation.status,
  }

  let eventId: string
  try {
    eventId = await deps.calendar.createEvent(
      buildEventInput(eventData, { restaurantAddress: settings.restaurantAddress, timezone: settings.timezone }, toUtcInstant),
    )
  } catch (error) {
    logError('reservations.calendar', error, { reservationCode: reservation.reservationCode })
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'failed' } })
    return { ok: false, code: 'CALENDAR_FAILED' }
  }

  const saved = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { googleCalendarEventId: eventId },
  })

  const cancelUrl = buildCancelUrl(saved.cancellationToken, locale)

  await notify(
    deps.telegram,
    { restaurantName: settings.restaurantName, ...eventData, calendarEventCreated: true },
    { cancelUrl, deadlineHours: settings.cancellationDeadlineHours, locale, customerChatId: saved.telegramChatId },
  )

  logInfo('reservations.create', 'Rezervasiya yaradıldı', {
    reservationCode: saved.reservationCode,
    date: input.date,
    time: input.time,
    customer: `${maskName(saved.firstName)} ${maskName(saved.lastName)}`,
    phone: maskPhone(saved.phoneNumber),
  })

  return { ok: true, reservation: saved, cancelUrl }
}

/**
 * Telegram bildirişləri. Buradakı xəta rezervasiyanı pozmur — yalnız loglanır.
 * Müştəri öz dilində, sahibkar isə həmişə Azərbaycanca mesaj alır.
 */
async function notify(
  telegram: TelegramPort,
  data: ReservationMessageData,
  options: { cancelUrl: string; deadlineHours: number; locale: Locale; customerChatId: string | null },
): Promise<void> {
  if (options.customerChatId) {
    try {
      const message = getCustomerMessages(options.locale).confirmation(
        data,
        options.cancelUrl,
        options.deadlineHours,
      )
      await telegram.sendMessage(options.customerChatId, message.text, message.keyboard)
    } catch (error) {
      logError('reservations.notify.customer', error, { reservationCode: data.reservationCode })
    }
  }

  try {
    await telegram.sendMessage(
      env.OWNER_TELEGRAM_CHAT_ID,
      ownerMessages.newReservation(data, options.locale),
    )
  } catch (error) {
    logError('reservations.notify.owner', error, { reservationCode: data.reservationCode })
  }
}
