import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import { prisma, resetReservations } from '../helpers/db'

function reservationData(overrides: Record<string, unknown> = {}) {
  return {
    reservationCode: randomUUID().slice(0, 8).toUpperCase(),
    firstName: 'Elvin',
    lastName: 'Məmmədov',
    phoneNumber: '+994501234567',
    reservationDate: new Date('2027-05-10T00:00:00.000Z'),
    startTime: '19:00',
    endTime: '20:00',
    timezone: 'Asia/Baku',
    cancellationToken: randomUUID() + randomUUID(),
    ...overrides,
  }
}

describe('reservations sxemi', () => {
  beforeEach(async () => {
    await resetReservations()
  })

  afterAll(async () => {
    await resetReservations()
    await prisma.$disconnect()
  })

  it('eyni tarix və saata ikinci TƏSDİQLƏNMİŞ rezervasiyaya icazə vermir', async () => {
    await prisma.reservation.create({ data: reservationData() })

    await expect(prisma.reservation.create({ data: reservationData() })).rejects.toMatchObject({
      code: 'P2002',
    })
  })

  it('ləğv edilmiş rezervasiya slotu tutmur', async () => {
    await prisma.reservation.create({ data: reservationData({ status: 'cancelled', cancelledAt: new Date() }) })

    const second = await prisma.reservation.create({ data: reservationData() })
    expect(second.status).toBe('confirmed')
  })

  it('uğursuz (failed) rezervasiya slotu tutmur', async () => {
    await prisma.reservation.create({ data: reservationData({ status: 'failed' }) })

    const second = await prisma.reservation.create({ data: reservationData() })
    expect(second.status).toBe('confirmed')
  })

  it('fərqli saatlar üçün eyni gündə rezervasiyalara icazə verir', async () => {
    await prisma.reservation.create({ data: reservationData({ startTime: '19:00', endTime: '20:00' }) })
    const second = await prisma.reservation.create({ data: reservationData({ startTime: '20:00', endTime: '21:00' }) })
    expect(second.startTime).toBe('20:00')
  })

  it('təkrarlanan idempotency_key-ə icazə vermir', async () => {
    const key = randomUUID()
    await prisma.reservation.create({ data: reservationData({ idempotencyKey: key }) })

    await expect(
      prisma.reservation.create({ data: reservationData({ idempotencyKey: key, startTime: '21:00', endTime: '22:00' }) }),
    ).rejects.toMatchObject({ code: 'P2002' })
  })
})
