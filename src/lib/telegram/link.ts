import { hmacHex, safeCompare } from './verify'

/**
 * Rezervasiya səhifəsinin linkinə müştərinin Telegram chat ID-si əlavə olunur.
 * İmza olmasa istənilən şəxs formaya başqasının chat ID-sini yazıb ona
 * bildiriş göndərə bilərdi — buna görə dəyər HMAC ilə imzalanır.
 */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

/** İstənilən dəyəri müddət və imza ilə birləşdirib base64url token qaytarır. */
export function signValue(value: string, secret: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs
  const payload = `${value}.${expiresAt}`
  return toBase64Url(`${payload}.${hmacHex(payload, secret)}`)
}

/** İmzalı tokeni açır; etibarsız və ya vaxtı keçmişdirsə `null`. */
export function verifyValue(token: string, secret: string, now: number = Date.now()): string | null {
  if (!token) return null

  let decoded: string
  try {
    decoded = fromBase64Url(token)
  } catch {
    return null
  }

  const parts = decoded.split('.')
  if (parts.length !== 3) return null

  const [value, expiresAtRaw, signature] = parts
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null
  if (!safeCompare(signature, hmacHex(`${value}.${expiresAtRaw}`, secret))) return null

  return value
}

export function signChatLink(chatId: string, secret: string, ttlMs: number = DEFAULT_TTL_MS): string {
  return signValue(chatId, secret, ttlMs)
}

/** Token etibarlıdırsa chat ID, əks halda `null` qaytarır. */
export function verifyChatLink(token: string, secret: string, now: number = Date.now()): string | null {
  const value = verifyValue(token, secret, now)
  if (value === null) return null
  // Chat ID həmişə rəqəmdir — başqa məqsədlə imzalanmış token bura keçməsin.
  return /^-?\d+$/.test(value) ? value : null
}

/** Bot düyməsindəki rezervasiya linkini qurur. */
export function buildBookingUrl(baseUrl: string, chatId: string, secret: string): string {
  const url = new URL(baseUrl)
  url.searchParams.set('t', signChatLink(chatId, secret))
  return url.toString()
}
