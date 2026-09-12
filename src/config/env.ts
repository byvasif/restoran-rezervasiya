import { z } from 'zod'

/**
 * Bütün məxfi və konfiqurasiya dəyərləri yalnız bu fayl vasitəsilə oxunur.
 * Çatışmayan dəyər səssiz keçmir — tətbiq startda aydın xəta ilə dayanır.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL tələb olunur'),

  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN tələb olunur'),
  TELEGRAM_WEBHOOK_SECRET: z
    .string()
    .min(16, 'TELEGRAM_WEBHOOK_SECRET ən azı 16 simvol olmalıdır'),
  OWNER_TELEGRAM_CHAT_ID: z.string().min(1, 'OWNER_TELEGRAM_CHAT_ID tələb olunur'),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  GOOGLE_CALENDAR_ID: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),

  RESTAURANT_NAME: z.string().min(1).default('Restoran'),
  RESTAURANT_ADDRESS: z.string().default(''),
  TIMEZONE: z.string().min(1).default('Asia/Baku'),
  BOOKING_DURATION_MINUTES: z.coerce.number().int().positive().default(60),
  CANCELLATION_DEADLINE_HOURS: z.coerce.number().int().nonnegative().default(24),
  /** Bugünkü rezervasiyalar üçün minimum irəli vaxt (dəqiqə). */
  MIN_LEAD_MINUTES: z.coerce.number().int().nonnegative().default(60),

  APP_BASE_URL: z.string().url(),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Environment konfiqurasiyası yanlışdır — ${details}`)
  }
  return parsed.data
}

let cached: Env | null = null

function load(): Env {
  if (!cached) cached = parseEnv(process.env)
  return cached
}

/** Test üçün keşi sıfırlayır. */
export function resetEnvCache(): void {
  cached = null
}

/**
 * Lazy proxy — modulu import etmək prosesi düşürmür, dəyər ilk oxunanda
 * doğrulanır. Beləliklə saf funksiyaların testləri env tələb etmir.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return load()[prop as keyof Env]
  },
})
