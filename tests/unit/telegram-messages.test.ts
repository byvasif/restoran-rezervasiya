import { describe, it, expect } from 'vitest'
import { messages, escapeHtml } from '@/lib/telegram/messages.az'

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

describe('müştəri mesajları', () => {
  it('start mesajında rezervasiya düyməsi var', () => {
    const message = messages.start('http://localhost:3200/?t=abc')
    expect(message.text).toContain('Salam!')
    expect(message.text).toContain('rezervasiya')
    expect(message.keyboard[0][0].text).toContain('Rezervasiya et')
    expect(message.keyboard[0][0].url).toBe('http://localhost:3200/?t=abc')
  })

  it('təsdiq mesajında bütün tələb olunan sahələr var', () => {
    const message = messages.customerConfirmation(data, 'http://localhost:3200/legv/token')
    expect(message.text).toContain('təsdiqləndi')
    expect(message.text).toContain('Şirvanşah')
    expect(message.text).toContain('Elvin Məmmədov')
    expect(message.text).toContain('10 may 2027')
    expect(message.text).toContain('19:00')
    expect(message.text).toContain('AB12CD34')
    expect(message.keyboard[0][0].text).toContain('ləğv')
    expect(message.keyboard[0][0].url).toBe('http://localhost:3200/legv/token')
  })

  it('ləğv müddətini konfiqurasiyadan götürür', () => {
    const message = messages.customerConfirmation(data, 'http://x/legv/t', 48)
    expect(message.text).toContain('48 saat')
    expect(messages.cancelTooLate(48)).toContain('48 saatdan az')
  })

  it('24 saatdan az qalanda spesifikasiyadakı mesajı verir', () => {
    expect(messages.cancelTooLate()).toContain('24 saatdan az vaxt qaldığı üçün onlayn ləğv etmək')
    expect(messages.cancelTooLate()).toContain('restoranla birbaşa əlaqə saxlayın')
  })

  it('help mesajı bütün komandaları sadalayır', () => {
    const text = messages.help()
    for (const command of ['/start', '/book', '/cancel', '/help']) {
      expect(text).toContain(command)
    }
  })
})

describe('sahibkar mesajları', () => {
  it('yeni rezervasiya bildirişində müştəri məlumatları var', () => {
    const text = messages.ownerNotification(data)
    expect(text).toContain('Yeni rezervasiya')
    expect(text).toContain('Elvin Məmmədov')
    expect(text).toContain('+994501234567')
    expect(text).toContain('10 may 2027')
    expect(text).toContain('AB12CD34')
    expect(text).toContain('@elvin_m')
    expect(text).toContain('tədbir yaradıldı')
  })

  it('təqvim tədbiri yaradılmayıbsa xəbərdarlıq göstərir', () => {
    expect(messages.ownerNotification({ ...data, calendarEventCreated: false })).toContain('yaradıla bilmədi')
  })

  it('ləğv bildirişində məlumatlar var', () => {
    const text = messages.ownerCancelled(data)
    expect(text).toContain('ləğv edildi')
    expect(text).toContain('AB12CD34')
  })
})

describe('HTML escape', () => {
  it('təhlükəli simvolları əvəz edir', () => {
    expect(escapeHtml('<b>x</b> & y')).toBe('&lt;b&gt;x&lt;/b&gt; &amp; y')
  })

  it('mesajda istifadəçi mətnini escape edir', () => {
    const text = messages.ownerNotification({ ...data, firstName: '<script>' })
    expect(text).not.toContain('<script>')
    expect(text).toContain('&lt;script&gt;')
  })
})
