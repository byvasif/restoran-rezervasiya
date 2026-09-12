import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Telegram webhook sorğusunun həqiqətən Telegram-dan gəldiyini yoxlayır.
 * Müqayisə timing-safe-dir ki, secret simvol-simvol təxmin edilə bilməsin.
 */
export function verifyWebhookSecret(header: string | null, secret: string): boolean {
  if (!header || !secret) return false
  const a = Buffer.from(header)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** İki sirr dəyərini timing-safe müqayisə edir (ləğv tokeni üçün də istifadə olunur). */
export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  if (bufferA.length !== bufferB.length) return false
  return timingSafeEqual(bufferA, bufferB)
}

export function hmacHex(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}
