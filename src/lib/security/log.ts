/**
 * Server logları. Şəxsi məlumatlar (telefon, ad, soyad) heç vaxt açıq
 * şəkildə loglanmır — yalnız maskalanmış formada.
 */

/** `+994501234567` → `+994**   ***67` formasına salır. */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const visible = phone.slice(-2)
  const prefix = phone.startsWith('+') ? phone.slice(0, 4) : phone.slice(0, 3)
  const hiddenCount = Math.max(phone.length - prefix.length - visible.length, 0)
  return `${prefix}${'*'.repeat(hiddenCount)}${visible}`
}

/** `Elvin` → `E****` */
export function maskName(name: string): string {
  if (!name) return ''
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(name.length - 1, 0))}`
}

function serialize(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}

export function logError(scope: string, error: unknown, meta: Record<string, unknown> = {}): void {
  console.error(
    JSON.stringify({
      level: 'error',
      scope,
      message: serialize(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
      timestamp: new Date().toISOString(),
    }),
  )
}

export function logWarn(scope: string, message: string, meta: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ level: 'warn', scope, message, ...meta, timestamp: new Date().toISOString() }))
}

export function logInfo(scope: string, message: string, meta: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ level: 'info', scope, message, ...meta, timestamp: new Date().toISOString() }))
}
