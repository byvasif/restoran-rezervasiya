import { NextResponse } from 'next/server'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { findByCode, toPublicView } from '@/lib/reservations/cancel'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { reservationCodeSchema } from '@/lib/validation/schemas'
import { resolveRequestLocale } from '@/lib/http/locale'
import { getDictionary } from '@/i18n'

export const dynamic = 'force-dynamic'

/** GET /api/reservations/:code — rezervasiyanın açıq məlumatları. */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const dictionary = getDictionary(resolveRequestLocale(request))

  if (!rateLimit(clientKey(request, 'reservation-read'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: dictionary.api.rateLimited }, { status: 429 })
  }

  const { code } = await context.params
  const parsed = reservationCodeSchema.safeParse(code)
  if (!parsed.success) {
    return NextResponse.json({ error: dictionary.api.invalidCode }, { status: 400 })
  }

  try {
    const reservation = await findByCode(parsed.data)
    if (!reservation) {
      return NextResponse.json({ error: dictionary.api.notFound }, { status: 404 })
    }

    const settings = await getSettings()
    return NextResponse.json(toPublicView(reservation, settings.restaurantName, settings.restaurantAddress))
  } catch (error) {
    logError('api.reservations.read', error)
    return NextResponse.json({ error: dictionary.api.readFailed }, { status: 500 })
  }
}
