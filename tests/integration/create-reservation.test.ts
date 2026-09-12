import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import { createReservation } from '@/lib/reservations/create'
import { getAvailability } from '@/lib/reservations/availability'
import { signChatLink } from '@/lib/telegram/link'
import { prisma, resetReservations, resetBusinessHours } from '../helpers/db'
import { FakeCalendar, FakeTelegram } from '../helpers/fakes'

const MONDAY = '2027-05-10'
const OWNER_CHAT_ID = process.env.OWNER_TELEGRAM_CHAT_ID as string
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET as string
const CUSTOMER_CHAT_ID = '555000111'

let calendar: FakeCalendar
let telegram: FakeTelegram

function input(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Elvin',
    lastName: 'Məmmədov',
    phoneNumber: '+994501234567',
    date: MONDAY,
    time: '19:00',
    telegramToken: signChatLink(CUSTOMER_CHAT_ID, SECRET),
    ...overrides,
  } as Parameters<typeof createReservation>[0]
}

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

describe('createReservation', () => {
  it('60 dəqiqəlik rezervasiya yaradır', async () => {
    const result = await createReservation(input(), { calendar, telegram })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reservation.startTime).toBe('19:00')
    expect(result.reservation.endTime).toBe('20:00')
    expect(result.reservation.status).toBe('confirmed')
    expect(result.reservation.reservationCode).toMatch(/^[A-Z2-9]{8}$/)
    expect(result.reservation.cancellationToken).toMatch(/^[a-f0-9]{64}$/)
  })

  it('Google Calendar tədbirini yaradır və ID-ni saxlayır', async () => {
    const result = await createReservation(input(), { calendar, telegram })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(calendar.created).toHaveLength(1)
    expect(calendar.created[0].summary).toBe('Restoran rezervasiyası — Elvin Məmmədov')
    expect(calendar.created[0].description).toContain('+994501234567')
    expect(calendar.created[0].start.toISOString()).toBe('2027-05-10T15:00:00.000Z')
    expect(calendar.created[0].end.toISOString()).toBe('2027-05-10T16:00:00.000Z')
    expect(result.reservation.googleCalendarEventId).toBe('test-event-1')
  })

  it('müştəriyə Telegram təsdiqi göndərir', async () => {
    const result = await createReservation(input(), { calendar, telegram })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const customerMessages = telegram.messagesTo(CUSTOMER_CHAT_ID)
    expect(customerMessages).toHaveLength(1)
    expect(customerMessages[0].text).toContain('təsdiqləndi')
    expect(customerMessages[0].text).toContain(result.reservation.reservationCode)
    expect(customerMessages[0].keyboard?.[0][0].url).toContain('/legv/')
  })

  it('sahibkara ayrıca Telegram bildirişi göndərir', async () => {
    await createReservation(input(), { calendar, telegram })

    const ownerMessages = telegram.messagesTo(OWNER_CHAT_ID)
    expect(ownerMessages).toHaveLength(1)
    expect(ownerMessages[0].text).toContain('Yeni rezervasiya')
    expect(ownerMessages[0].text).toContain('+994501234567')
    expect(ownerMessages[0].text).toContain('tədbir yaradıldı')
  })

  it('imzasız sorğuda müştəriyə mesaj göndərmir, sahibkara göndərir', async () => {
    await createReservation(input({ telegramToken: undefined }), { calendar, telegram })

    expect(telegram.messagesTo(CUSTOMER_CHAT_ID)).toHaveLength(0)
    expect(telegram.messagesTo(OWNER_CHAT_ID)).toHaveLength(1)
  })

  it('saxta Telegram tokenini qəbul etmir', async () => {
    const result = await createReservation(
      input({ telegramToken: signChatLink(CUSTOMER_CHAT_ID, 'basqa-secret-xxxxxxxxxx') }),
      { calendar, telegram },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reservation.telegramChatId).toBeNull()
    expect(telegram.messagesTo(CUSTOMER_CHAT_ID)).toHaveLength(0)
  })

  it('iş saatlarından kənar vaxtı qəbul etmir', async () => {
    const result = await createReservation(input({ time: '23:00' }), { calendar, telegram })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_SLOT')
  })

  it('bağlı gün üçün rezervasiya yaratmır', async () => {
    const result = await createReservation(input({ date: '2027-05-09' }), { calendar, telegram })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_SLOT')
  })

  it('keçmiş tarix üçün rezervasiya yaratmır', async () => {
    const result = await createReservation(input({ date: '2020-01-01' }), { calendar, telegram })
    expect(result.ok).toBe(false)
  })

  it('Google Calendar xətasında rezervasiyanı failed edir və slotu azad edir', async () => {
    calendar.failOnCreate = true

    const result = await createReservation(input(), { calendar, telegram })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('CALENDAR_FAILED')

    const row = await prisma.reservation.findFirst()
    expect(row?.status).toBe('failed')

    const availability = await getAvailability(MONDAY, { calendar: new FakeCalendar() })
    expect(availability.ok && availability.slots).toContain('19:00')
  })

  it('Telegram xətası rezervasiyanı pozmur', async () => {
    telegram.failOnSend = true

    const result = await createReservation(input(), { calendar, telegram })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.reservation.status).toBe('confirmed')
  })

  it('eyni idempotency açarı ilə ikinci sorğu yeni rezervasiya yaratmır', async () => {
    const key = randomUUID()
    const first = await createReservation(input({ idempotencyKey: key }), { calendar, telegram })
    const second = await createReservation(input({ idempotencyKey: key }), { calendar, telegram })

    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return
    expect(second.reservation.id).toBe(first.reservation.id)
    expect(await prisma.reservation.count()).toBe(1)
    expect(calendar.created).toHaveLength(1)
  })

  it('rezervasiyadan sonra həmin saat boş siyahıda görünmür', async () => {
    await createReservation(input(), { calendar, telegram })

    const availability = await getAvailability(MONDAY, { calendar })
    expect(availability.ok && availability.slots).not.toContain('19:00')
  })
})

describe('eyni vaxta iki rezervasiya', () => {
  it('paralel sorğulardan yalnız biri uğurlu olur (baza səviyyəsində)', async () => {
    // Təqvim sorğusunu gecikdirməklə hər iki sorğunun ilkin yoxlamanı eyni
    // anda keçməsini təmin edirik — nəticəni yalnız unikal indeks həll edir.
    calendar.busyDelayMs = 120

    const results = await Promise.all([
      createReservation(input(), { calendar, telegram }),
      createReservation(input(), { calendar, telegram }),
    ])

    const succeeded = results.filter((result) => result.ok)
    const failed = results.filter((result) => !result.ok)

    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect(failed[0].ok === false && failed[0].code).toBe('SLOT_TAKEN')
    expect(await prisma.reservation.count({ where: { status: 'confirmed' } })).toBe(1)
    expect(calendar.created).toHaveLength(1)
  })

  it('ardıcıl ikinci sorğu vaxtın tutulduğunu bildirir', async () => {
    await createReservation(input(), { calendar, telegram })
    const second = await createReservation(input(), { calendar, telegram })

    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.code).toBe('INVALID_SLOT')
  })
})
