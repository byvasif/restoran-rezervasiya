import { describe, it, expect } from 'vitest'
import { signChatLink, verifyChatLink, buildBookingUrl } from '@/lib/telegram/link'
import { verifyWebhookSecret, safeCompare } from '@/lib/telegram/verify'

const SECRET = 'test-secret-0123456789abcdef'

describe('imzalı chat linki', () => {
  it('imzalanmış tokeni geri açır', () => {
    const token = signChatLink('123456789', SECRET)
    expect(verifyChatLink(token, SECRET)).toBe('123456789')
  })

  it('dəyişdirilmiş tokeni qəbul etmir', () => {
    const token = signChatLink('123456789', SECRET)
    const tampered = Buffer.from(
      Buffer.from(token, 'base64url').toString('utf8').replace('123456789', '987654321'),
      'utf8',
    ).toString('base64url')
    expect(verifyChatLink(tampered, SECRET)).toBeNull()
  })

  it('başqa secret ilə imzalanmış tokeni qəbul etmir', () => {
    const token = signChatLink('123456789', 'basqa-secret-0123456789')
    expect(verifyChatLink(token, SECRET)).toBeNull()
  })

  it('müddəti keçmiş tokeni qəbul etmir', () => {
    const token = signChatLink('123456789', SECRET, 1000)
    expect(verifyChatLink(token, SECRET, Date.now() + 5000)).toBeNull()
  })

  it('boş və ya cəfəng tokeni qəbul etmir', () => {
    expect(verifyChatLink('', SECRET)).toBeNull()
    expect(verifyChatLink('cefeng-token', SECRET)).toBeNull()
  })

  it('rezervasiya linkini qurur', () => {
    const url = buildBookingUrl('http://localhost:3200', '123456789', SECRET)
    const token = new URL(url).searchParams.get('t')
    expect(token).toBeTruthy()
    expect(verifyChatLink(token as string, SECRET)).toBe('123456789')
  })
})

describe('webhook secret doğrulaması', () => {
  it('düzgün secret-i qəbul edir', () => {
    expect(verifyWebhookSecret(SECRET, SECRET)).toBe(true)
  })

  it('yanlış secret-i rədd edir', () => {
    expect(verifyWebhookSecret('yanlis-secret-0123456789abc', SECRET)).toBe(false)
  })

  it('başlıq yoxdursa rədd edir', () => {
    expect(verifyWebhookSecret(null, SECRET)).toBe(false)
  })

  it('fərqli uzunluqda dəyəri rədd edir', () => {
    expect(verifyWebhookSecret('qisa', SECRET)).toBe(false)
    expect(safeCompare('a', 'ab')).toBe(false)
  })
})
