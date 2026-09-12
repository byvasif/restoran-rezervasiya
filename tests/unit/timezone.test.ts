import { describe, it, expect } from 'vitest'
import {
  toUtcInstant,
  weekdayOf,
  isValidDateString,
  isValidTimeString,
  isPastDate,
  timeToMinutes,
  minutesToTime,
  addMinutes,
  dateStringToDbDate,
  dbDateToDateString,
  todayInZone,
} from '@/lib/time/timezone'

describe('toUtcInstant', () => {
  it('Asia/Baku divar saatını UTC anına çevirir (UTC+4)', () => {
    // Bakı yay vaxtı tətbiq etmir: il boyu UTC+4.
    expect(toUtcInstant('2027-05-10', '19:00', 'Asia/Baku').toISOString()).toBe('2027-05-10T15:00:00.000Z')
    expect(toUtcInstant('2027-01-10', '19:00', 'Asia/Baku').toISOString()).toBe('2027-01-10T15:00:00.000Z')
  })

  it('başqa zonada fərqli nəticə verir', () => {
    expect(toUtcInstant('2027-05-10', '19:00', 'UTC').toISOString()).toBe('2027-05-10T19:00:00.000Z')
  })

  it('yanlış tarixdə xəta atır', () => {
    expect(() => toUtcInstant('2027-13-45', '19:00', 'Asia/Baku')).toThrow()
  })
})

describe('weekdayOf', () => {
  it('Bazar üçün 0 qaytarır', () => {
    expect(weekdayOf('2027-05-09', 'Asia/Baku')).toBe(0)
  })

  it('Bazar ertəsi üçün 1 qaytarır', () => {
    expect(weekdayOf('2027-05-10', 'Asia/Baku')).toBe(1)
  })

  it('Şənbə üçün 6 qaytarır', () => {
    expect(weekdayOf('2027-05-15', 'Asia/Baku')).toBe(6)
  })
})

describe('doğrulama', () => {
  it('tarix formatını yoxlayır', () => {
    expect(isValidDateString('2027-05-10')).toBe(true)
    expect(isValidDateString('10.05.2027')).toBe(false)
    expect(isValidDateString('2027-02-30')).toBe(false)
  })

  it('saat formatını yoxlayır', () => {
    expect(isValidTimeString('19:00')).toBe(true)
    expect(isValidTimeString('24:00')).toBe(false)
    expect(isValidTimeString('9:00')).toBe(false)
  })

  it('keçmiş tarixi müəyyən edir', () => {
    expect(isPastDate('2020-01-01', 'Asia/Baku')).toBe(true)
    expect(isPastDate(todayInZone('Asia/Baku'), 'Asia/Baku')).toBe(false)
  })
})

describe('vaxt hesablamaları', () => {
  it('saat ↔ dəqiqə çevirir', () => {
    expect(timeToMinutes('19:30')).toBe(1170)
    expect(minutesToTime(1170)).toBe('19:30')
    expect(addMinutes('21:00', 60)).toBe('22:00')
  })

  it('baza tarixi ilə sətir arasında çevirir', () => {
    expect(dateStringToDbDate('2027-05-10').toISOString()).toBe('2027-05-10T00:00:00.000Z')
    expect(dbDateToDateString(new Date('2027-05-10T00:00:00.000Z'))).toBe('2027-05-10')
  })
})
