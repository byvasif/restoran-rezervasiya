import { describe, it, expect } from 'vitest'
import { parseEnv } from '@/config/env'

const base = {
  DATABASE_URL: 'postgresql://localhost:5432/test',
  TELEGRAM_BOT_TOKEN: 'bot-token',
  TELEGRAM_WEBHOOK_SECRET: 's'.repeat(20),
  OWNER_TELEGRAM_CHAT_ID: '123456',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3200/oauth/callback',
  GOOGLE_CALENDAR_ID: 'primary',
  GOOGLE_REFRESH_TOKEN: 'refresh-token',
  APP_BASE_URL: 'http://localhost:3200',
} as unknown as NodeJS.ProcessEnv

describe('parseEnv', () => {
  it('defolt vaxt zonasını, müddəti və ləğv müddətini tətbiq edir', () => {
    const env = parseEnv(base)
    expect(env.TIMEZONE).toBe('Asia/Baku')
    expect(env.BOOKING_DURATION_MINUTES).toBe(60)
    expect(env.CANCELLATION_DEADLINE_HOURS).toBe(24)
  })

  it('mətn dəyəri rəqəmə çevirir', () => {
    const env = parseEnv({ ...base, BOOKING_DURATION_MINUTES: '90' } as NodeJS.ProcessEnv)
    expect(env.BOOKING_DURATION_MINUTES).toBe(90)
  })

  it('çatışmayan məxfi dəyərdə xəta atır', () => {
    expect(() => parseEnv({} as NodeJS.ProcessEnv)).toThrow(/Environment konfiqurasiyası yanlışdır/)
  })

  it('qısa webhook secret-i qəbul etmir', () => {
    expect(() => parseEnv({ ...base, TELEGRAM_WEBHOOK_SECRET: 'qisa' } as NodeJS.ProcessEnv)).toThrow()
  })
})
