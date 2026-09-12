/**
 * Sadə yaddaşdaxili token-bucket. Tək instans üçün kifayət edir; bir neçə
 * instansda işlədiləcəksə Redis əsaslı sayğaca keçmək lazımdır (README-də qeyd).
 */
interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Limit aşılmayıbsa true qaytarır və sayğacı artırır. */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count += 1
  return true
}

export function resetRateLimits(): void {
  buckets.clear()
}

/** Sorğunun mənbəyini müəyyən edir (proxy arxasında X-Forwarded-For). */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
  return `${scope}:${ip}`
}
