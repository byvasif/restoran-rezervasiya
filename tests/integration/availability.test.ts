import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import { getAvailability, busyToLocalIntervals } from '@/lib/reservations/availability'
import { prisma, resetReservations, resetBusinessHours } from '../helpers/db'
import { FakeCalendar } from '../helpers/fakes'

// 2027-05-10 = Bazar ertəsi, 2027-05-09 = Bazar (bağlı gün qrafikdə)
const MONDAY = '2027-05-10'
const SUNDAY = '2027-05-09'

let calendar: FakeCalendar

beforeEach(async () => {
  await resetReservations()
  await resetBusinessHours()
  calendar = new FakeCalendar()
})

afterAll(async () => {
  await resetReservations()
  await prisma.$disconnect()
})

describe('getAvailability', () => {
  it('iş günü üçün bütün iş saatlarını qaytarır', async () => {
    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.closed).toBe(false)
    expect(result.slots).toEqual([
      '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
      '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    ])
    expect(result.durationMinutes).toBe(60)
  })

  it('bağlı həftə günü üçün boş siyahı və səbəb qaytarır', async () => {
    const result = await getAvailability(SUNDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.closed).toBe(true)
    expect(result.slots).toEqual([])
    expect(result.reason).toContain('işləmir')
  })

  it('xüsusi bağlı gündə səbəbi göstərir', async () => {
    await prisma.closedDate.create({
      data: { closedDate: new Date(`${MONDAY}T00:00:00.000Z`), reason: 'Texniki fasilə' },
    })

    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.closed).toBe(true)
    expect(result.reason).toBe('Texniki fasilə')
  })

  it('keçmiş tarixi rədd edir', async () => {
    const result = await getAvailability('2020-01-01', { calendar })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('PAST_DATE')
  })

  it('yanlış tarix formatını rədd edir', async () => {
    const result = await getAvailability('10.05.2027', { calendar })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('INVALID_DATE')
  })

  it('bazada tutulmuş saatı göstərmir', async () => {
    await prisma.reservation.create({
      data: {
        reservationCode: 'TEST0001',
        firstName: 'Elvin',
        lastName: 'Məmmədov',
        phoneNumber: '+994501234567',
        reservationDate: new Date(`${MONDAY}T00:00:00.000Z`),
        startTime: '19:00',
        endTime: '20:00',
        timezone: 'Asia/Baku',
        cancellationToken: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
      },
    })

    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots).not.toContain('19:00')
    expect(result.slots).toContain('18:00')
  })

  it('fasilə saatlarını göstərmir', async () => {
    await prisma.businessHours.update({
      where: { weekday: 1 },
      data: { breakStart: '15:00', breakEnd: '16:00' },
    })

    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots).not.toContain('15:00')
    expect(result.slots).toContain('16:00')
  })

  it('Google Calendar-da məşğul olan saatı göstərmir', async () => {
    // 2027-05-10 13:00–14:00 Bakı vaxtı = 09:00–10:00 UTC
    calendar.busy = [{ start: new Date('2027-05-10T09:00:00.000Z'), end: new Date('2027-05-10T10:00:00.000Z') }]

    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots).not.toContain('13:00')
    expect(result.slots).toContain('14:00')
  })

  it('Google Calendar xətası siyahını dağıtmır (baza əsaslı nəticə qayıdır)', async () => {
    calendar.failOnBusy = true

    const result = await getAvailability(MONDAY, { calendar })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.slots.length).toBe(12)
  })
})

describe('busyToLocalIntervals', () => {
  it('UTC aralığını Bakı divar saatına çevirir', () => {
    const intervals = busyToLocalIntervals(
      [{ start: new Date('2027-05-10T09:00:00.000Z'), end: new Date('2027-05-10T10:00:00.000Z') }],
      MONDAY,
      'Asia/Baku',
    )
    expect(intervals).toEqual([{ start: '13:00', end: '14:00' }])
  })

  it('bütün günü tutan tədbiri gün hüdudlarına kəsir', () => {
    const intervals = busyToLocalIntervals(
      [{ start: new Date('2027-05-08T00:00:00.000Z'), end: new Date('2027-05-12T00:00:00.000Z') }],
      MONDAY,
      'Asia/Baku',
    )
    expect(intervals).toEqual([{ start: '00:00', end: '24:00' }])
  })

  it('başqa günün tədbirini nəzərə almır', () => {
    const intervals = busyToLocalIntervals(
      [{ start: new Date('2027-06-01T09:00:00.000Z'), end: new Date('2027-06-01T10:00:00.000Z') }],
      MONDAY,
      'Asia/Baku',
    )
    expect(intervals).toEqual([])
  })
})
