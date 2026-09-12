import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { DateTime } from 'luxon'
import { cancelReservation, canCancel, findByCancellationToken, toPublicView } from '@/lib/reservations/cancel'
import { createReservation } from '@/lib/reservations/create'
import { getAvailability } from '@/lib/reservations/availability'
import { generateCancellationToken } from '@/lib/reservations/token'
import { signChatLink } from '@/lib/telegram/link'
import { prisma, resetReservations, resetBusinessHours } from '../helpers/db'
import { FakeCalendar, FakeTelegram } from '../helpers/fakes'

const MONDAY = '2027-05-10'
const OWNER_CHAT_ID = process.env.OWNER_TELEGRAM_CHAT_ID as string
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET as string
const CUSTOMER_CHAT_ID = '555000111'

let calendar: FakeCalendar
let telegram: FakeTelegram

beforeEach(async () => {
  await resetReservations()
  await resetBusinessHours()
  calendar = new FakeCalendar()
  telegram = new FakeTelegram()
})

afterAll(async () => {
  await resetReservations()
  await prisma.$disconnect()
})

async function createFuture() {
  const result = await createReservation(
    {
      firstName: 'Elvin',
      lastName: 'Məmmədov',
      phoneNumber: '+994501234567',
      date: MONDAY,
      time: '19:00',
      telegramToken: signChatLink(CUSTOMER_CHAT_ID, SECRET),
    } as Parameters<typeof createReservation>[0],
    { calendar, telegram },
  )
  if (!result.ok) throw new Error('Test üçün rezervasiya yaradıla bilmədi')
  telegram.sent = []
  return result.reservation
}

/** Verilmiş saat sonraya düşən rezervasiya sətri yaradır (ləğv müddəti testləri üçün). */
async function createInHours(hours: number) {
  const startsAt = DateTime.now().setZone('Asia/Baku').plus({ hours })
  return prisma.reservation.create({
    data: {
      reservationCode: `T${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`,
      firstName: 'Aysel',
      lastName: 'Quliyeva',
      phoneNumber: '+994551234567',
      reservationDate: new Date(`${startsAt.toFormat('yyyy-MM-dd')}T00:00:00.000Z`),
      startTime: startsAt.toFormat('HH:00'),
      endTime: startsAt.plus({ hours: 1 }).toFormat('HH:00'),
      timezone: 'Asia/Baku',
      telegramChatId: CUSTOMER_CHAT_ID,
      googleCalendarEventId: 'test-event-x',
      cancellationToken: generateCancellationToken(),
    },
  })
}

describe('cancelReservation', () => {
  it('24 saatdan çox vaxt qalanda ləğv edir', async () => {
    const reservation = await createFuture()

    const result = await cancelReservation(reservation.reservationCode, reservation.cancellationToken, {
      calendar,
      telegram,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reservation.status).toBe('cancelled')
    expect(result.reservation.cancelledAt).not.toBeNull()
  })

  it('Google Calendar tədbirini silir', async () => {
    const reservation = await createFuture()
    await cancelReservation(reservation.reservationCode, reservation.cancellationToken, { calendar, telegram })

    expect(calendar.deleted).toEqual(['test-event-1'])
  })

  it('müştəriyə və sahibkara bildiriş göndərir', async () => {
    const reservation = await createFuture()
    await cancelReservation(reservation.reservationCode, reservation.cancellationToken, { calendar, telegram })

    expect(telegram.messagesTo(CUSTOMER_CHAT_ID)[0].text).toContain('ləğv edildi')
    expect(telegram.messagesTo(OWNER_CHAT_ID)[0].text).toContain('ləğv edildi')
    expect(telegram.messagesTo(OWNER_CHAT_ID)[0].text).toContain(reservation.reservationCode)
  })

  it('ləğvdən sonra həmin saat yenidən boş görünür', async () => {
    const reservation = await createFuture()
    const before = await getAvailability(MONDAY, { calendar })
    expect(before.ok && before.slots).not.toContain('19:00')

    await cancelReservation(reservation.reservationCode, reservation.cancellationToken, { calendar, telegram })

    const after = await getAvailability(MONDAY, { calendar })
    expect(after.ok && after.slots).toContain('19:00')
  })

  it('24 saatdan az qalanda ləğvə icazə vermir', async () => {
    const reservation = await createInHours(12)

    const result = await cancelReservation(reservation.reservationCode, reservation.cancellationToken, {
      calendar,
      telegram,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('TOO_LATE')

    const row = await prisma.reservation.findUnique({ where: { id: reservation.id } })
    expect(row?.status).toBe('confirmed')
    expect(calendar.deleted).toEqual([])
    expect(telegram.sent).toEqual([])
  })

  it('26 saat qalanda ləğv edir', async () => {
    const reservation = await createInHours(26)

    const result = await cancelReservation(reservation.reservationCode, reservation.cancellationToken, {
      calendar,
      telegram,
    })

    expect(result.ok).toBe(true)
  })

  it('yanlış token ilə ləğvə icazə vermir', async () => {
    const reservation = await createFuture()

    const result = await cancelReservation(reservation.reservationCode, generateCancellationToken(), {
      calendar,
      telegram,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_TOKEN')

    const row = await prisma.reservation.findUnique({ where: { id: reservation.id } })
    expect(row?.status).toBe('confirmed')
  })

  it('mövcud olmayan kod üçün NOT_FOUND qaytarır', async () => {
    const result = await cancelReservation('ZZZZZZZZ', generateCancellationToken(), { calendar, telegram })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NOT_FOUND')
  })

  it('təkrar ləğvdə ALREADY_CANCELLED qaytarır', async () => {
    const reservation = await createFuture()
    await cancelReservation(reservation.reservationCode, reservation.cancellationToken, { calendar, telegram })

    const second = await cancelReservation(reservation.reservationCode, reservation.cancellationToken, {
      calendar,
      telegram,
    })

    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.code).toBe('ALREADY_CANCELLED')
  })

  it('təqvim silinməsi alınmasa da rezervasiyanı ləğv edir', async () => {
    const reservation = await createFuture()
    calendar.failOnDelete = true

    const result = await cancelReservation(reservation.reservationCode, reservation.cancellationToken, {
      calendar,
      telegram,
    })

    expect(result.ok).toBe(true)
  })
})

describe('canCancel', () => {
  const base = { reservationDate: new Date('2027-05-10T00:00:00.000Z'), startTime: '19:00', timezone: 'Asia/Baku' }

  it('tam 24 saat qalanda icazə verir', () => {
    // 2027-05-10 19:00 Bakı = 15:00 UTC; 24 saat əvvəl = 2027-05-09 15:00 UTC
    expect(canCancel(base, 24, new Date('2027-05-09T15:00:00.000Z'))).toBe(true)
  })

  it('23 saat 59 dəqiqə qalanda icazə vermir', () => {
    expect(canCancel(base, 24, new Date('2027-05-09T15:01:00.000Z'))).toBe(false)
  })

  it('konfiqurasiya olunmuş 48 saat qaydasını tətbiq edir', () => {
    expect(canCancel(base, 48, new Date('2027-05-09T15:00:00.000Z'))).toBe(false)
    expect(canCancel(base, 48, new Date('2027-05-08T15:00:00.000Z'))).toBe(true)
  })
})

describe('açıq məlumat', () => {
  it('ləğv tokenini cavabda göstərmir', async () => {
    const reservation = await createFuture()
    const view = toPublicView(reservation, 'Test Restoran', 'Bakı')

    expect(JSON.stringify(view)).not.toContain(reservation.cancellationToken)
    expect(view.reservationCode).toBe(reservation.reservationCode)
    expect(view.date).toBe(MONDAY)
  })

  it('token ilə rezervasiyanı tapır', async () => {
    const reservation = await createFuture()
    const found = await findByCancellationToken(reservation.cancellationToken)
    expect(found?.id).toBe(reservation.id)
  })
})
