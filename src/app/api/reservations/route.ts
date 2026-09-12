import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getSettings } from '@/config/business'
import { getCalendar } from '@/lib/calendar'
import { getTelegram } from '@/lib/telegram/client'
import { createReservation } from '@/lib/reservations/create'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { createReservationSchema } from '@/lib/validation/schemas'
import { dbDateToDateString } from '@/lib/time/timezone'

export const dynamic = 'force-dynamic'

const FAILURE_MESSAGES: Record<string, { status: number; message: string }> = {
  INVALID_SLOT: {
    status: 409,
    message: 'Seçilmiş vaxt artıq əlçatan deyil. Zəhmət olmasa başqa saat seçin.',
  },
  SLOT_TAKEN: {
    status: 409,
    message: 'Bu vaxt yenicə başqa müştəri tərəfindən tutuldu. Zəhmət olmasa başqa saat seçin.',
  },
  CALENDAR_FAILED: {
    status: 502,
    message: 'Rezervasiyanı tamamlamaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
  },
}

/** POST /api/reservations — yeni rezervasiya yaradır. */
export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, 'reservations'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Sorğu məlumatı oxunmadı.' }, { status: 400 })
  }

  const parsed = createReservationSchema.safeParse(payload)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fields[key]) fields[key] = issue.message
    }
    return NextResponse.json({ error: 'Daxil edilmiş məlumatlar düzgün deyil.', fields }, { status: 400 })
  }

  try {
    const result = await createReservation(parsed.data, { calendar: getCalendar(), telegram: getTelegram() })

    if (!result.ok) {
      const failure = FAILURE_MESSAGES[result.code]
      return NextResponse.json({ error: failure.message, code: result.code }, { status: failure.status })
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
        cancelUrl: result.cancelUrl,
        cancellationDeadlineHours: settings.cancellationDeadlineHours,
      },
      { status: 201 },
    )
  } catch (error) {
    logError('api.reservations.create', error)
    return NextResponse.json(
      { error: 'Rezervasiyanı yaratmaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.' },
      { status: 500 },
    )
  }
}
