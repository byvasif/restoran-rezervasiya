import { describe, it, expect } from 'vitest'
import { signValue, verifyValue, verifyChatLink, signChatLink } from '@/lib/telegram/link'

const SECRET = 'setup-secret-0123456789abcdef'

describe('imzalı state', () => {
  it('dəyəri geri qaytarır', () => {
    expect(verifyValue(signValue('google-connect', SECRET), SECRET)).toBe('google-connect')
  })

  it('başqa secret ilə imzalanmış state-i qəbul etmir', () => {
    expect(verifyValue(signValue('google-connect', 'basqa-secret-123456'), SECRET)).toBeNull()
  })

  it('müddəti keçmiş state-i qəbul etmir', () => {
    const token = signValue('google-connect', SECRET, 1000)
    expect(verifyValue(token, SECRET, Date.now() + 5000)).toBeNull()
  })

  it('dəyişdirilmiş state-i qəbul etmir', () => {
    const token = signValue('google-connect', SECRET)
    const tampered = Buffer.from(
      Buffer.from(token, 'base64url').toString('utf8').replace('google-connect', 'basqa-deyer'),
      'utf8',
    ).toString('base64url')
    expect(verifyValue(tampered, SECRET)).toBeNull()
  })

  it('chat linki üçün rəqəm olmayan dəyəri qəbul etmir', () => {
    // Setup state-i chat ID kimi istifadə edilə bilməməlidir.
    expect(verifyChatLink(signValue('google-connect', SECRET), SECRET)).toBeNull()
    expect(verifyChatLink(signChatLink('123456', SECRET), SECRET)).toBe('123456')
  })
})
