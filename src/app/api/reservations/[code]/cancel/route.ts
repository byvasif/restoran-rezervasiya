import { NextResponse } from 'next/server'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { getCalendar } from '@/lib/calendar'
import { getTelegram } from '@/lib/telegram/client'
import { cancelReservation } from '@/lib/reservations/cancel'
import { messages } from '@/lib/telegram/messages.az'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { cancelRequestSchema, reservationCodeSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

/** POST /api/reservations/:code/cancel — rezervasiyanı ləğv edir. */
export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  if (!rateLimit(clientKey(request, 'reservation-cancel'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.' }, { status: 429 })
  }

  const { code } = await context.params
  const parsedCode = reservationCodeSchema.safeParse(code)
  if (!parsedCode.success) {
    return NextResponse.json({ error: 'Rezervasiya kodu yanlışdır.' }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Sorğu məlumatı oxunmadı.' }, { status: 400 })
  }

  const parsedBody = cancelRequestSchema.safeParse(payload)
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Ləğv linki yanlışdır.' }, { status: 400 })
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

    const failures: Record<string, { status: number; message: string }> = {
      NOT_FOUND: { status: 404, message: 'Belə bir rezervasiya tapılmadı.' },
      INVALID_TOKEN: { status: 403, message: 'Bu ləğv linki etibarlı deyil.' },
      ALREADY_CANCELLED: { status: 409, message: 'Bu rezervasiya artıq ləğv edilib.' },
      TOO_LATE: { status: 409, message: messages.cancelTooLate(settings.cancellationDeadlineHours) },
    }

    const failure = failures[result.code]
    return NextResponse.json({ error: failure.message, code: result.code }, { status: failure.status })
  } catch (error) {
    logError('api.reservations.cancel', error)
    return NextResponse.json({ error: 'Ləğv etmək mümkün olmadı. Bir az sonra yenidən cəhd edin.' }, { status: 500 })
  }
}
