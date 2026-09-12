import { describe, it, expect } from 'vitest'
import { buildEventInput } from '@/lib/calendar/calendar-port'
import { toUtcInstant } from '@/lib/time/timezone'

const reservation = {
  firstName: 'Elvin',
  lastName: 'Məmmədov',
  phoneNumber: '+994501234567',
  date: '2027-05-10',
  startTime: '19:00',
  endTime: '20:00',
  telegramUsername: 'elvin_m',
  telegramChatId: '123456',
  reservationCode: 'AB12CD34',
  status: 'confirmed',
}

const settings = { restaurantAddress: 'Bakı, Nizami küçəsi 10', timezone: 'Asia/Baku' }

describe('buildEventInput', () => {
  it('başlığı spesifikasiyadakı formatda qurur', () => {
    const event = buildEventInput(reservation, settings, toUtcInstant)
    expect(event.summary).toBe('Restoran rezervasiyası — Elvin Məmmədov')
  })

  it('təsvirdə bütün tələb olunan sahələri göstərir', () => {
    const event = buildEventInput(reservation, settings, toUtcInstant)
    expect(event.description).toContain('Müştəri: Elvin Məmmədov')
    expect(event.description).toContain('Telefon: +994501234567')
    expect(event.description).toContain('Tarix: 2027-05-10')
    expect(event.description).toContain('Saat: 19:00 – 20:00')
    expect(event.description).toContain('Telegram: @elvin_m')
    expect(event.description).toContain('Rezervasiya kodu: AB12CD34')
    expect(event.description).toContain('Status: confirmed')
  })

  it('istifadəçi adı yoxdursa Telegram ID göstərir', () => {
    const event = buildEventInput({ ...reservation, telegramUsername: null }, settings, toUtcInstant)
    expect(event.description).toContain('Telegram: 123456')
  })

  it('məkan sahəsində restoran ünvanını göstərir', () => {
    expect(buildEventInput(reservation, settings, toUtcInstant).location).toBe('Bakı, Nizami küçəsi 10')
  })

  it('60 dəqiqəlik aralığı UTC anına çevirir', () => {
    const event = buildEventInput(reservation, settings, toUtcInstant)
    expect(event.start.toISOString()).toBe('2027-05-10T15:00:00.000Z')
    expect(event.end.toISOString()).toBe('2027-05-10T16:00:00.000Z')
    expect(event.end.getTime() - event.start.getTime()).toBe(60 * 60 * 1000)
  })
})
