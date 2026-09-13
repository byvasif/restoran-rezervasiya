import { describe, it, expect } from 'vitest'
import { getCustomerMessages, ownerMessages, escapeHtml } from '@/lib/telegram/messages'
import { SUPPORTED_LOCALES } from '@/i18n/locales'

const data = {
  restaurantName: 'Şirvanşah',
  firstName: 'Elvin',
  lastName: 'Məmmədov',
  phoneNumber: '+994501234567',
  date: '2027-05-10',
  startTime: '19:00',
  endTime: '20:00',
  reservationCode: 'AB12CD34',
  telegramUsername: 'elvin_m',
  telegramChatId: '123456',
  calendarEventCreated: true,
}

describe('müştəri mesajları (hər dil)', () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: start mesajında rezervasiya düyməsi var`, () => {
      const message = getCustomerMessages(locale).start('http://localhost:3200/az/?t=abc')
      expect(message.text.length).toBeGreaterThan(20)
      expect(message.keyboard[0][0].url).toBe('http://localhost:3200/az/?t=abc')
    })

    it(`${locale}: təsdiq mesajında kod, tarix və ləğv düyməsi var`, () => {
      const message = getCustomerMessages(locale).confirmation(data, 'http://x/az/legv/token', 24)
      expect(message.text).toContain('AB12CD34')
      expect(message.text).toContain('19:00')
      expect(message.text).toContain('Şirvanşah')
      expect(message.keyboard[0][0].url).toBe('http://x/az/legv/token')
    })

    it(`${locale}: help mesajı bütün komandaları sadalayır`, () => {
      const text = getCustomerMessages(locale).help(24)
      for (const command of ['/start', '/book', '/cancel', '/dil', '/help']) {
        expect(text).toContain(command)
      }
    })

    it(`${locale}: dil menyusunda üç variant var`, () => {
      const reply = getCustomerMessages(locale).languagePrompt()
      expect(reply.keyboard[0]).toHaveLength(3)
      expect(reply.keyboard[0].map((button) => button.callback_data)).toEqual([
        'lang:az',
        'lang:tr',
        'lang:en',
      ])
    })
  }

  it('tarix hər dildə öz formatındadır', () => {
    expect(getCustomerMessages('az').confirmation(data, 'u', 24).text).toContain('10 may 2027')
    expect(getCustomerMessages('tr').confirmation(data, 'u', 24).text).toContain('10 Mayıs 2027')
    expect(getCustomerMessages('en').confirmation(data, 'u', 24).text).toContain('10 May 2027')
  })

  it('ləğv müddəti mesajda göstərilir', () => {
    expect(getCustomerMessages('az').cancelTooLate(48)).toContain('48')
    expect(getCustomerMessages('tr').cancelTooLate(48)).toContain('48')
    expect(getCustomerMessages('en').cancelTooLate(48)).toContain('48')
  })
})

describe('sahibkar mesajları', () => {
  it('həmişə Azərbaycancadır, müştəri dilindən asılı deyil', () => {
    const text = ownerMessages.newReservation(data, 'en')
    expect(text).toContain('Yeni rezervasiya')
    expect(text).toContain('Müştəri: Elvin Məmmədov')
    expect(text).toContain('10 may 2027')
  })

  it('müştərinin dilini göstərir', () => {
    expect(ownerMessages.newReservation(data, 'tr')).toContain('TR')
  })

  it('təqvim tədbiri yaradılmayıbsa xəbərdarlıq göstərir', () => {
    expect(ownerMessages.newReservation({ ...data, calendarEventCreated: false }, 'az')).toContain(
      'yaradıla bilmədi',
    )
  })

  it('ləğv bildirişində məlumatlar var', () => {
    const text = ownerMessages.cancelled(data)
    expect(text).toContain('ləğv edildi')
    expect(text).toContain('AB12CD34')
  })
})

describe('HTML escape', () => {
  it('təhlükəli simvolları əvəz edir', () => {
    expect(escapeHtml('<b>x</b> & y')).toBe('&lt;b&gt;x&lt;/b&gt; &amp; y')
  })

  it('mesajda istifadəçi mətnini escape edir', () => {
    const text = ownerMessages.newReservation({ ...data, firstName: '<script>' }, 'az')
    expect(text).not.toContain('<script>')
    expect(text).toContain('&lt;script&gt;')
  })
})
