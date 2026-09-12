import { describe, it, expect } from 'vitest'
import { withTimeout, TimeoutError } from '@/lib/calendar/with-timeout'

describe('withTimeout', () => {
  it('vaxtında cavab verən sorğunu qaytarır', async () => {
    await expect(withTimeout(Promise.resolve('hazır'), 100, 'test')).resolves.toBe('hazır')
  })

  it('həddi aşan sorğunu dayandırır', async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 200))
    await expect(withTimeout(slow, 30, 'Google Calendar')).rejects.toBeInstanceOf(TimeoutError)
  })

  it('sorğunun öz xətasını ötürür', async () => {
    await expect(withTimeout(Promise.reject(new Error('şəbəkə xətası')), 100, 'test')).rejects.toThrow('şəbəkə xətası')
  })
})
