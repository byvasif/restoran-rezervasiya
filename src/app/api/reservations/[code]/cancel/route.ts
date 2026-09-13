import { NextResponse } from 'next/server'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { getCalendar } from '@/lib/calendar'
import { getTelegram } from '@/lib/telegram/client'
import { cancelReservation, type CancelFailureCode } from '@/lib/reservations/cancel'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { cancelRequestSchema, reservationCodeSchema } from '@/lib/validation/schemas'
import { resolveRequestLocale } from '@/lib/http/locale'
import { fill, getDictionary, type Dictionary } from '@/i18n'

export const dynamic = 'force-dynamic'

function failure(
  code: CancelFailureCode,
  dictionary: Dictionary,
  deadlineHours: number,
): { status: number; message: string } {
  switch (code) {
    case 'NOT_FOUND':
      return { status: 404, message: dictionary.api.notFound }
    case 'INVALID_TOKEN':
      return { status: 403, message: dictionary.api.invalidCancelToken }
    case 'ALREADY_CANCELLED':
      return { status: 409, message: dictionary.api.alreadyCancelled }
    case 'TOO_LATE':
      return { status: 409, message: fill(dictionary.cancel.tooLate, { hours: deadlineHours }) }
  }
}

/** POST /api/reservations/:code/cancel — rezervasiyanı ləğv edir. */
export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const dictionary = getDictionary(resolveRequestLocale(request))

  if (!rateLimit(clientKey(request, 'reservation-cancel'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: dictionary.api.rateLimited }, { status: 429 })
  }

  const { code } = await context.params
  const parsedCode = reservationCodeSchema.safeParse(code)
  if (!parsedCode.success) {
    return NextResponse.json({ error: dictionary.api.invalidCode }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: dictionary.api.unreadableBody }, { status: 400 })
  }

  const parsedBody = cancelRequestSchema.safeParse(payload)
  if (!parsedBody.success) {
    return NextResponse.json({ error: dictionary.api.invalidCancelToken }, { status: 400 })
  }

  try {
    const settings = await getSettings()
    const result = await cancelReservation(parsedCode.data, parsedBody.data.token, {
      calendar: getCalendar(),
      telegram: getTelegram(),
    })

    if (result.ok) {
      return NextResponse.json({ status: 'cancelled', reservationCode: result.reservation.reservationCode })
    }

    const { status, message } = failure(result.code, dictionary, settings.cancellationDeadlineHours)
    return NextResponse.json({ error: message, code: result.code }, { status })
  } catch (error) {
    logError('api.reservations.cancel', error)
    return NextResponse.json({ error: dictionary.api.cancelFailed }, { status: 500 })
  }
}
