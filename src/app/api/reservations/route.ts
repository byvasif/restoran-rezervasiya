import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getSettings } from '@/config/business'
import { getCalendar } from '@/lib/calendar'
import { getTelegram } from '@/lib/telegram/client'
import { createReservation, type CreateFailureCode } from '@/lib/reservations/create'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { buildCreateReservationSchema } from '@/lib/validation/schemas'
import { dbDateToDateString } from '@/lib/time/timezone'
import { resolveRequestLocale } from '@/lib/http/locale'
import { fill, getDictionary, type Dictionary } from '@/i18n'

export const dynamic = 'force-dynamic'

const FAILURE_STATUS: Record<CreateFailureCode, number> = {
  INVALID_SLOT: 409,
  SLOT_TAKEN: 409,
  CALENDAR_FAILED: 502,
}

function failureMessage(code: CreateFailureCode, dictionary: Dictionary): string {
  if (code === 'INVALID_SLOT') return dictionary.api.invalidSlot
  if (code === 'SLOT_TAKEN') return dictionary.api.slotTaken
  return dictionary.api.calendarFailed
}

/** Doğrulama sxemi açar qaytarır, mətn burada seçilmiş dildə qurulur. */
function translateValidation(key: string, dictionary: Dictionary): string {
  const messages: Record<string, string> = {
    ...dictionary.validation,
    phoneInvalid: fill(dictionary.validation.phoneInvalid, { example: dictionary.date.phoneExample }),
  }
  return messages[key] ?? dictionary.api.invalidInput
}

/** POST /api/reservations — yeni rezervasiya yaradır. */
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    const dictionary = getDictionary(resolveRequestLocale(request))
    return NextResponse.json({ error: dictionary.api.unreadableBody }, { status: 400 })
  }

  const locale = resolveRequestLocale(request, payload)
  const dictionary = getDictionary(locale)

  if (!rateLimit(clientKey(request, 'reservations'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: dictionary.api.rateLimited }, { status: 429 })
  }

  const parsed = buildCreateReservationSchema(locale).safeParse(payload)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fields[key]) fields[key] = translateValidation(issue.message, dictionary)
    }
    return NextResponse.json({ error: dictionary.api.invalidInput, fields }, { status: 400 })
  }

  try {
    const result = await createReservation(
      { ...parsed.data, locale },
      { calendar: getCalendar(), telegram: getTelegram() },
    )

    if (!result.ok) {
      return NextResponse.json(
        { error: failureMessage(result.code, dictionary), code: result.code },
        { status: FAILURE_STATUS[result.code] },
      )
    }

    const settings = await getSettings()
    const { reservation } = result

    return NextResponse.json(
      {
        reservationCode: reservation.reservationCode,
        restaurantName: settings.restaurantName,
        restaurantAddress: settings.restaurantAddress,
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        date: dbDateToDateString(reservation.reservationDate),
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        locale: reservation.locale,
        cancelUrl: result.cancelUrl,
        cancellationDeadlineHours: settings.cancellationDeadlineHours,
      },
      { status: 201 },
    )
  } catch (error) {
    logError('api.reservations.create', error)
    return NextResponse.json({ error: dictionary.api.createFailed }, { status: 500 })
  }
}
