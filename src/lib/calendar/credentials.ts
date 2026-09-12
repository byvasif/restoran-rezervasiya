import { env } from '@/config/env'
import { prisma } from '@/lib/db/prisma'

/**
 * Google Calendar kimlik məlumatları.
 *
 * `client_id` və `client_secret` tətbiqin özünə aiddir və environment-də qalır.
 * Refresh token isə **sahibkarın hesabına** aiddir — o, brauzerdən qoşulur və
 * bazada saxlanılır. Beləliklə tokeni yeniləmək üçün nə terminal, nə də yenidən
 * deploy lazım olur; env-dəki dəyər yalnız ehtiyat variantdır.
 */
export interface CalendarCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
  calendarId: string
}

export interface CalendarConnection {
  connected: boolean
  source: 'database' | 'environment' | null
  connectedAt: Date | null
  accountEmail: string | null
  calendarId: string | null
}

export async function loadCalendarCredentials(): Promise<CalendarCredentials | null> {
  const settings = await prisma.businessSettings.findFirst({ orderBy: { createdAt: 'asc' } })

  const refreshToken = settings?.googleRefreshToken || env.GOOGLE_REFRESH_TOKEN
  const calendarId = settings?.googleCalendarId || env.GOOGLE_CALENDAR_ID || 'primary'

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !refreshToken) return null

  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken,
    calendarId,
  }
}

/** Təqvimin qoşulub-qoşulmadığını və mənbəyini bildirir (sağlamlıq yoxlanışı üçün). */
export async function getCalendarConnection(): Promise<CalendarConnection> {
  const settings = await prisma.businessSettings.findFirst({ orderBy: { createdAt: 'asc' } })

  if (settings?.googleRefreshToken) {
    return {
      connected: true,
      source: 'database',
      connectedAt: settings.googleConnectedAt,
      accountEmail: settings.googleAccountEmail,
      calendarId: settings.googleCalendarId ?? env.GOOGLE_CALENDAR_ID,
    }
  }

  if (env.GOOGLE_REFRESH_TOKEN) {
    return {
      connected: true,
      source: 'environment',
      connectedAt: null,
      accountEmail: null,
      calendarId: env.GOOGLE_CALENDAR_ID,
    }
  }

  return { connected: false, source: null, connectedAt: null, accountEmail: null, calendarId: null }
}

/** Sahibkar təqvimi qoşduqdan sonra tokeni saxlayır. */
export async function saveCalendarConnection(input: {
  refreshToken: string
  calendarId: string
  accountEmail: string | null
}): Promise<void> {
  const settings = await prisma.businessSettings.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!settings) throw new Error('business_settings sətri tapılmadı — əvvəlcə seed işlədin')

  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: {
      googleRefreshToken: input.refreshToken,
      googleCalendarId: input.calendarId,
      googleAccountEmail: input.accountEmail,
      googleConnectedAt: new Date(),
    },
  })
}
