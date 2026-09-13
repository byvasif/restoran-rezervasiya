import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { getCalendar } from '@/lib/calendar'
import { getAvailability } from '@/lib/reservations/availability'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { resolveRequestLocale } from '@/lib/http/locale'
import { getDictionary } from '@/i18n'

export const dynamic = 'force-dynamic'

/** GET /api/availability?date=YYYY-MM-DD&lang=az — seçilmiş tarix üçün boş saatlar. */
export async function GET(request: Request) {
  const locale = resolveRequestLocale(request)
  const dictionary = getDictionary(locale)

  if (!rateLimit(clientKey(request, 'availability'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: dictionary.api.rateLimited }, { status: 429 })
  }

  const date = new URL(request.url).searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: dictionary.api.missingDate }, { status: 400 })
  }

  try {
    const result = await getAvailability(date, { calendar: getCalendar() })
    if (!result.ok) {
      const message = result.code === 'PAST_DATE' ? dictionary.api.pastDate : dictionary.api.invalidDate
      return NextResponse.json({ error: message, code: result.code }, { status: 400 })
    }

    return NextResponse.json({
      date: result.date,
      slots: result.slots,
      closed: result.closed,
      reason: result.closed ? translateClosedReason(result, dictionary) : undefined,
      durationMinutes: result.durationMinutes,
    })
  } catch (error) {
    logError('api.availability', error, { date })
    return NextResponse.json({ error: dictionary.api.availabilityFailed }, { status: 500 })
  }
}

/**
 * Bağlı gün səbəbi: qrafikə görə bağlıdırsa tərcümə olunur, sahibkarın yazdığı
 * xüsusi səbəb (məsələn "Texniki fasilə") isə olduğu kimi qalır.
 */
function translateClosedReason(
  result: { closedCode?: 'WEEKDAY' | 'DATE'; reason?: string },
  dictionary: ReturnType<typeof getDictionary>,
): string {
  if (result.closedCode === 'WEEKDAY') return dictionary.api.closedWeekday
  return result.reason ?? dictionary.api.closedDate
}
