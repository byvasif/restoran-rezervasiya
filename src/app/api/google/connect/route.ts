import { NextResponse } from 'next/server'
import { env } from '@/config/env'
import { consentUrl } from '@/lib/calendar/oauth'
import { signValue } from '@/lib/telegram/link'
import { safeCompare } from '@/lib/telegram/verify'
import { logWarn } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

/** Qoşulma linki 15 dəqiqə etibarlıdır. */
const STATE_TTL_MS = 15 * 60 * 1000

/**
 * GET /api/google/connect?key=<SETUP_SECRET>
 *
 * Sahibkarı Google icazə səhifəsinə yönləndirir. Açar olmadan giriş yoxdur —
 * əks halda yad şəxs öz təqvimini sistemə bağlaya bilərdi.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? ''

  if (!env.SETUP_SECRET) {
    return NextResponse.json(
      { error: 'Qoşulma linki bağlıdır: serverdə SETUP_SECRET təyin edilməyib.' },
      { status: 503 },
    )
  }

  if (!safeCompare(key, env.SETUP_SECRET)) {
    logWarn('google.connect', 'Yanlış açarla qoşulma cəhdi rədd edildi')
    return NextResponse.json({ error: 'Bu link etibarlı deyil.' }, { status: 403 })
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google tətbiq açarları (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) təyin edilməyib.' },
      { status: 503 },
    )
  }

  // State imzalanır ki, geri qayıdan sorğunun məhz bu axından gəldiyi bilinsin.
  return NextResponse.redirect(consentUrl(signValue('google-connect', env.SETUP_SECRET, STATE_TTL_MS)))
}
