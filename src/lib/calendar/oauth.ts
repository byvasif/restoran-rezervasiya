import { google } from 'googleapis'
import { env } from '@/config/env'

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

/** Google-un icazədən sonra qayıtdığı ünvan — tətbiqin öz domenidir. */
export function callbackUrl(): string {
  return `${env.APP_BASE_URL.replace(/\/$/, '')}/api/google/callback`
}

export function oauthClient() {
  return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, callbackUrl())
}

/**
 * `prompt: 'consent'` olmadan Google təkrar qoşulmada refresh token qaytarmır —
 * ona görə hər dəfə açıq şəkildə tələb edilir.
 */
export function consentUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [CALENDAR_SCOPE, 'https://www.googleapis.com/auth/userinfo.email'],
    state,
  })
}
