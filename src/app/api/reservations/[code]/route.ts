import { NextResponse } from 'next/server'
import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { findByCode, toPublicView } from '@/lib/reservations/cancel'
import { clientKey, rateLimit } from '@/lib/security/rate-limit'
import { logError } from '@/lib/security/log'
import { reservationCodeSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

/** GET /api/reservations/:code — rezervasiyanın açıq məlumatları. */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  if (!rateLimit(clientKey(request, 'reservation-read'), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.' }, { status: 429 })
  }

  const { code } = await context.params
  const parsed = reservationCodeSchema.safeParse(code)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Rezervasiya kodu yanlışdır.' }, { status: 400 })
  }

  try {
    const reservation = await findByCode(parsed.data)
    if (!reservation) {
      return NextResponse.json({ error: 'Belə bir rezervasiya tapılmadı.' }, { status: 404 })
    }

    const settings = await getSettings()
    return NextResponse.json(toPublicView(reservation, settings.restaurantName, settings.restaurantAddress))
  } catch (error) {
    logError('api.reservations.read', error)
    return NextResponse.json({ error: 'Məlumatı yükləmək mümkün olmadı.' }, { status: 500 })
  }
}
