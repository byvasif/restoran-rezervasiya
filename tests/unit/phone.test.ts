import { describe, it, expect } from 'vitest'
import { normalizePhone, formatPhoneForDisplay } from '@/lib/validation/phone'
import { buildCreateReservationSchema } from '@/lib/validation/schemas'
import { maskPhone, maskName } from '@/lib/security/log'

describe('normalizePhone', () => {
  it('yerli formatı E.164-ə çevirir', () => {
    expect(normalizePhone('0501234567')).toBe('+994501234567')
  })

  it('boşluqlu beynəlxalq formatı qəbul edir', () => {
    expect(normalizePhone('+994 50 123 45 67')).toBe('+994501234567')
  })

  it('defis və mötərizəli formatı qəbul edir', () => {
    expect(normalizePhone('(050) 123-45-67')).toBe('+994501234567')
  })

  it('qısa nömrəni qəbul etmir', () => {
    expect(normalizePhone('123')).toBeNull()
  })

  it('hərflərdən ibarət dəyəri qəbul etmir', () => {
    expect(normalizePhone('salam')).toBeNull()
  })

  it('boş sətri qəbul etmir', () => {
    expect(normalizePhone('   ')).toBeNull()
  })

  it('göstərmək üçün formatlayır', () => {
    expect(formatPhoneForDisplay('+994501234567')).toBe('+994 50 123 45 67')
  })
})

const createReservationSchema = buildCreateReservationSchema('az')

describe('createReservationSchema', () => {
  const valid = {
    firstName: 'Elvin',
    lastName: 'Məmmədov',
    phoneNumber: '0501234567',
    date: '2027-05-10',
    time: '19:00',
  }

  it('düzgün məlumatı qəbul edir və telefonu normallaşdırır', () => {
    const parsed = createReservationSchema.parse(valid)
    expect(parsed.phoneNumber).toBe('+994501234567')
    expect(parsed.lastName).toBe('Məmmədov')
  })

  it('yanlış telefonu rədd edir', () => {
    const result = createReservationSchema.safeParse({ ...valid, phoneNumber: '12' })
    expect(result.success).toBe(false)
  })

  it('rəqəmli adı rədd edir', () => {
    expect(createReservationSchema.safeParse({ ...valid, firstName: 'Elvin123' }).success).toBe(false)
  })

  it('HTML teqi olan adı rədd edir (XSS)', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, firstName: '<script>alert(1)</script>' }).success,
    ).toBe(false)
  })

  it('yanlış tarix formatını rədd edir', () => {
    expect(createReservationSchema.safeParse({ ...valid, date: '10.05.2027' }).success).toBe(false)
  })

  it('yanlış saat formatını rədd edir', () => {
    expect(createReservationSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false)
  })
})

describe('log maskalama', () => {
  it('telefonun yalnız kiçik hissəsini göstərir', () => {
    const masked = maskPhone('+994501234567')
    expect(masked).toContain('*')
    expect(masked).not.toContain('501234')
    expect(masked.endsWith('67')).toBe(true)
  })

  it('adı maskalayır', () => {
    expect(maskName('Elvin')).toBe('E****')
  })
})
