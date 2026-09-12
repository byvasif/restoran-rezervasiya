import { google } from 'googleapis'
import { env } from '@/config/env'
import { saveCalendarConnection } from '@/lib/calendar/credentials'
import { oauthClient } from '@/lib/calendar/oauth'
import { logError, logInfo } from '@/lib/security/log'
import { verifyValue } from '@/lib/telegram/link'

export const dynamic = 'force-dynamic'

function page(title: string, body: string, ok: boolean): Response {
  return new Response(
    `<!doctype html><html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FFFDF9;color:#1C1A17}
  header{background:${ok ? '#4A0A17' : '#6E1023'};color:#FFFDF9;padding:32px 20px}
  main{max-width:560px;margin:0 auto;padding:28px 20px}
  h1{font:600 26px/1.2 Georgia,serif;margin:0}
  p{margin:0 0 14px}
  code{background:#F3EDE4;padding:2px 6px;border-radius:4px;font-size:14px}
</style></head><body>
<header><div style="max-width:560px;margin:0 auto"><h1>${title}</h1></div></header>
<main>${body}</main></body></html>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

/**
 * GET /api/google/callback — Google icazədən sonra bura qayıdır.
 *
 * Alınan kod refresh tokenə dəyişdirilir və token bazaya yazılır. Bundan sonra
 * rezervasiyalar sahibkarın təqviminə düşür; yenidən deploy lazım deyil.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const code = params.get('code')
  const state = params.get('state') ?? ''
  const error = params.get('error')

  if (error) {
    return page('Qoşulma tamamlanmadı', `<p>Google icazə vermədi: <code>${error}</code></p>
      <p>Qoşulma linkini yenidən açıb cəhd edə bilərsiniz.</p>`, false)
  }

  if (!env.SETUP_SECRET || verifyValue(state, env.SETUP_SECRET) !== 'google-connect') {
    return page('Link etibarlı deyil', '<p>Qoşulma linki köhnəlib. Yeni link ilə yenidən cəhd edin.</p>', false)
  }

  if (!code) {
    return page('Link etibarlı deyil', '<p>Google kod qaytarmadı. Yenidən cəhd edin.</p>', false)
  }

  try {
    const client = oauthClient()
    const { tokens } = await client.getToken(code)

    if (!tokens.refresh_token) {
      return page(
        'Token alınmadı',
        `<p>Google refresh token qaytarmadı. Bu, tətbiqə əvvəllər icazə verildiyi halda baş verir.</p>
         <p>Google hesabınızın <a href="https://myaccount.google.com/permissions">icazələr səhifəsində</a>
         bu tətbiqin girişini silib yenidən qoşulun.</p>`,
        false,
      )
    }

    client.setCredentials(tokens)

    // Hansı hesabın qoşulduğunu göstərmək üçün — sahibkar səhv hesabla
    // qoşulduğunu dərhal görsün.
    let email: string | null = null
    try {
      const info = await google.oauth2({ version: 'v2', auth: client }).userinfo.get()
      email = info.data.email ?? null
    } catch {
      email = null
    }

    await saveCalendarConnection({
      refreshToken: tokens.refresh_token,
      calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
      accountEmail: email,
    })

    logInfo('google.callback', 'Təqvim qoşuldu', { account: email ?? 'bilinmir' })

    return page(
      'Təqvim qoşuldu',
      `<p>Google Calendar uğurla bağlandı${email ? ` — <code>${email}</code>` : ''}.</p>
       <p>Bundan sonra hər yeni rezervasiya avtomatik olaraq bu təqvimə düşəcək,
       ləğv ediləndə isə tədbir təqvimdən silinəcək.</p>
       <p>Bu səhifəni bağlaya bilərsiniz.</p>`,
      true,
    )
  } catch (caught) {
    logError('google.callback', caught)
    return page(
      'Qoşulma alınmadı',
      '<p>Token mübadiləsi zamanı xəta baş verdi. Bir az sonra yenidən cəhd edin.</p>',
      false,
    )
  }
}
