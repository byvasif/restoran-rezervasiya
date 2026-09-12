import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getCalendar } from '@/lib/calendar'
import { getAvailability } from '@/lib/reservations/availability'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

/** GET /api/availability?date=YYYY-MM-DD — seçilmiş tarix üçün boş saatlar. */
export async function GET(request: Request) {
  if (!rateLimit(clientKey(request, 'availability'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.' }, { status: 429 })
  }

  const date = new URL(request.url).searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'Tarix göstərilməyib.' }, { status: 400 })
  }

  try {
    const result = await getAvailability(date, { calendar: getCalendar() })
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      date: result.date,
      slots: result.slots,
      closed: result.closed,
      reason: result.reason,
      durationMinutes: result.durationMinutes,
    })
  } catch (error) {
    logError('api.availability', error, { date })
    return NextResponse.json({ error: 'Saatları yükləmək mümkün olmadı. Bir az sonra yenidən cəhd edin.' }, { status: 500 })
  }
}
