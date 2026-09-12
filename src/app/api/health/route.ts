import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getCalendarConnection } from '@/lib/calendar/credentials'
import { logError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

/** Sistemin və baza bağlantısının işlək olduğunu yoxlayır. */
export async function GET() {
  let database: 'up' | 'down' = 'up'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    database = 'down'
    logError('health.database', error)
  }

  let calendar: Record<string, unknown> = { connected: false }
  try {
    const connection = await getCalendarConnection()
    calendar = {
      connected: connection.connected,
      source: connection.source,
      account: connection.accountEmail,
      calendarId: connection.calendarId,
      connectedAt: connection.connectedAt,
    }
  } catch (error) {
    logError('health.calendar', error)
  }

  const body = {
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    calendar,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, { status: database === 'up' ? 200 : 503 })
}
