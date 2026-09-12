# Restoran Rezervasiya Sistemi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telegram botu, mobil rezervasiya səhifəsi və Google Calendar inteqrasiyası olan, Azərbaycan dilində işləyən tək restoranlıq rezervasiya sistemi qurmaq.

**Architecture:** Next.js 15 App Router tək deploy vahidi; saf domen məntiqi (`src/lib/time`, `src/lib/reservations`) şəbəkədən asılı olmayan funksiyalardır; Google Calendar və Telegram `CalendarPort`/`TelegramPort` interfeysləri arxasındadır və testlərdə mock edilir. Slotun ikiqat tutulmasının qarşısı Postgres partial unique index ilə baza səviyyəsində alınır.

**Tech Stack:** TypeScript, Next.js 15, React 19, Prisma + PostgreSQL 17, Tailwind CSS v4, luxon, zod, libphonenumber-js, googleapis, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-12-restoran-rezervasiya-design.md`

## Global Constraints

- Bütün istifadəçiyə görünən mətn Azərbaycan dilindədir (`src/lib/telegram/messages.az.ts` və UI komponentləri).
- Məxfi dəyər heç vaxt koda yazılmır; yalnız `process.env` üzərindən, `src/config/env.ts`-də zod ilə doğrulanır.
- Vaxt zonası default `Asia/Baku`, `TIMEZONE` env dəyişəni ilə dəyişdirilir; divar saatı hesablamaları luxon ilə aparılır.
- Rezervasiya müddəti default 60 dəqiqə (`BOOKING_DURATION_MINUTES`), ləğv müddəti default 24 saat (`CANCELLATION_DEADLINE_HOURS`).
- Yalnız `status = 'confirmed'` sətir slotu tutur.
- İstifadəçiyə texniki xəta detalı (stack, API cavabı) göstərilmir; server logunda telefon və ad maskalanır.
- Hər task-ın sonunda `npm run typecheck` və `npm test` yaşıl olmalıdır.

---

### Task 1: Layihə skeleti, env konfiqurasiyası, health endpoint

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `src/config/env.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/api/health/route.ts`
- Test: `tests/unit/env.test.ts`

**Interfaces:**
- Produces: `env` obyekti — `{ DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, OWNER_TELEGRAM_CHAT_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_CALENDAR_ID, GOOGLE_REFRESH_TOKEN, RESTAURANT_NAME, RESTAURANT_ADDRESS, TIMEZONE, BOOKING_DURATION_MINUTES, CANCELLATION_DEADLINE_HOURS, APP_BASE_URL, MIN_LEAD_MINUTES }`; `parseEnv(raw: NodeJS.ProcessEnv): Env`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { parseEnv } from '../../src/config/env'

const base = { DATABASE_URL: 'postgresql://x/y', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_WEBHOOK_SECRET: 's'.repeat(16), OWNER_TELEGRAM_CHAT_ID: '1', GOOGLE_CLIENT_ID: 'c', GOOGLE_CLIENT_SECRET: 'cs', GOOGLE_REDIRECT_URI: 'http://localhost/cb', GOOGLE_CALENDAR_ID: 'primary', GOOGLE_REFRESH_TOKEN: 'r', APP_BASE_URL: 'http://localhost:3000' }

it('tətbiq edir defolt vaxt zonasını və müddəti', () => {
  const env = parseEnv(base as never)
  expect(env.TIMEZONE).toBe('Asia/Baku')
  expect(env.BOOKING_DURATION_MINUTES).toBe(60)
  expect(env.CANCELLATION_DEADLINE_HOURS).toBe(24)
})

it('çatışmayan məxfi dəyərdə xəta atır', () => {
  expect(() => parseEnv({} as never)).toThrow()
})
```

- [ ] **Step 2: Run test to verify it fails** — `npx vitest run tests/unit/env.test.ts` → FAIL (modul yoxdur)
- [ ] **Step 3: Implement** — `src/config/env.ts`-də zod sxemi; rəqəm sahələri `z.coerce.number()`, defolt dəyərlər yuxarıdakı kimi. `env` lazy proxy ilə export olunur ki, test import-u prosesi düşürməsin.
- [ ] **Step 4: Run tests** → PASS; `/api/health` `{ status: 'ok', timestamp }` qaytarır.
- [ ] **Step 5: Commit** — `chore: layihə skeleti və env konfiqurasiyası`

---

### Task 2: Prisma sxemi, partial unique index, seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/migrations/.../migration.sql`, `prisma/seed.ts`, `src/lib/db/prisma.ts`, `src/config/business-hours.json`
- Test: `tests/integration/schema.test.ts`

**Interfaces:**
- Produces: `prisma` (PrismaClient singleton); modellər `User`, `Reservation`, `BusinessSettings`, `BusinessHours`, `ClosedDate`, `TelegramUpdate`; enum `ReservationStatus { confirmed, cancelled, failed }`.

- [ ] **Step 1: Write the failing test** — eyni `reservation_date` + `start_time` ilə iki `confirmed` sətir yazmağa cəhd; ikincisi `P2002` atmalıdır; `cancelled` statusda ikinci sətir uğurla yazılmalıdır.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — sxem + miqrasiyanın sonuna xam SQL:

```sql
CREATE UNIQUE INDEX "reservations_slot_confirmed_key"
  ON "reservations" ("reservation_date", "start_time")
  WHERE "status" = 'confirmed';
```

- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: verilənlər bazası sxemi və slot unikal indeksi`

---

### Task 3: Vaxt zonası və slot generasiyası (saf funksiyalar)

**Files:**
- Create: `src/lib/time/timezone.ts`, `src/lib/time/slots.ts`
- Test: `tests/unit/slots.test.ts`, `tests/unit/timezone.test.ts`

**Interfaces:**
- Produces:
  - `toUtcInstant(date: string, time: string, tz: string): Date`
  - `nowInZone(tz: string): DateTime`
  - `todayInZone(tz: string): string`
  - `weekdayOf(date: string, tz: string): number` (0=Bazar)
  - `addMinutes(time: string, minutes: number): string`
  - `generateSlots(input: { openingTime, closingTime, breakStart, breakEnd, durationMinutes }): string[]`
  - `filterSlots(slots: string[], busy: Array<{ start: string; end: string }>, durationMinutes: number): string[]`

- [ ] **Step 1: Write the failing tests**

```ts
it('10:00–22:00 aralığında 60 dəqiqəlik slotlar yaradır', () => {
  expect(generateSlots({ openingTime: '10:00', closingTime: '22:00', breakStart: null, breakEnd: null, durationMinutes: 60 }))
    .toEqual(['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'])
})

it('fasilə ilə kəsişən slotları çıxarır', () => {
  const s = generateSlots({ openingTime: '10:00', closingTime: '14:00', breakStart: '12:00', breakEnd: '13:00', durationMinutes: 60 })
  expect(s).toEqual(['10:00','11:00','13:00'])
})

it('məşğul aralıqla kəsişən slotu gizlədir', () => {
  expect(filterSlots(['10:00','11:00'], [{ start: '11:00', end: '12:00' }], 60)).toEqual(['10:00'])
})
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — dəqiqəyə çevirmə + interval kəsişmə (`aStart < bEnd && bStart < aEnd`); luxon `DateTime.fromISO(..., { zone })`.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: vaxt zonası və slot generasiya məntiqi`

---

### Task 4: Telefon doğrulaması və input sxemləri

**Files:**
- Create: `src/lib/validation/phone.ts`, `src/lib/validation/schemas.ts`, `src/lib/security/log.ts`
- Test: `tests/unit/phone.test.ts`

**Interfaces:**
- Produces: `normalizePhone(raw: string): string | null` (E.164, default region AZ); `createReservationSchema`; `maskPhone(phone: string): string`; `logError(scope: string, error: unknown, meta?: Record<string, unknown>): void`.

- [ ] **Step 1: Failing tests** — `'0501234567' → '+994501234567'`, `'+994 50 123 45 67' → '+994501234567'`, `'123' → null`, `'abc' → null`; `maskPhone('+994501234567')` rəqəmlərin çoxunu `*` ilə əvəz edir.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — `libphonenumber-js` `parsePhoneNumberFromString(raw, 'AZ')`, `isValid()` yoxlanışı.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: telefon doğrulaması və log maskalama`

---

### Task 5: Calendar portu və Google implementasiyası

**Files:**
- Create: `src/lib/calendar/calendar-port.ts`, `src/lib/calendar/google-calendar.ts`, `src/lib/calendar/index.ts`
- Test: `tests/unit/calendar-event.test.ts`

**Interfaces:**
- Produces:
  - `interface CalendarPort { getBusy(from: Date, to: Date): Promise<Array<{ start: Date; end: Date }>>; createEvent(input: CalendarEventInput): Promise<string>; deleteEvent(eventId: string): Promise<void> }`
  - `CalendarEventInput = { summary, description, location, start: Date, end: Date, timezone: string }`
  - `buildEventInput(reservation, settings): CalendarEventInput` — başlıq `Restoran rezervasiyası — Ad Soyad`, təsvirdə ad, telefon, tarix, saat, Telegram, kod, status.
  - `getCalendar(): CalendarPort`

- [ ] **Step 1: Failing test** — `buildEventInput` başlıq formatını və təsvirin bütün sətirlərini yoxlayır.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — `googleapis` OAuth2 klienti refresh token ilə; `freebusy.query`; `events.insert`; `events.delete` (404 → səssiz keçir).
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: Google Calendar inteqrasiyası`

---

### Task 6: Telegram portu, mesajlar, HMAC bağlantı tokeni

**Files:**
- Create: `src/lib/telegram/telegram-port.ts`, `src/lib/telegram/client.ts`, `src/lib/telegram/messages.az.ts`, `src/lib/telegram/verify.ts`, `src/lib/telegram/link.ts`
- Test: `tests/unit/telegram-link.test.ts`, `tests/unit/telegram-messages.test.ts`

**Interfaces:**
- Produces:
  - `interface TelegramPort { sendMessage(chatId: string, text: string, keyboard?: InlineKeyboard): Promise<void> }`
  - `signChatLink(chatId: string, secret: string, ttlMs?: number): string`
  - `verifyChatLink(token: string, secret: string): string | null`
  - `verifyWebhookSecret(header: string | null, secret: string): boolean` (timing-safe)
  - `customerConfirmation(...)`, `ownerNotification(...)`, `customerCancelled(...)`, `ownerCancelled(...)`, `startMessage(url)`, `helpMessage()`, `cancelHelpMessage()`

- [ ] **Step 1: Failing tests** — imzalanmış token geri açılır; dəyişdirilmiş token `null` qaytarır; müddəti keçmiş token `null` qaytarır; təsdiq mesajı restoran adı, ad, tarix, saat və kodu ehtiva edir.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — `crypto.createHmac('sha256', secret)`, base64url; `timingSafeEqual`.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: Telegram klienti, mesajlar və imzalı bağlantı`

---

### Task 7: Availability servisi və `GET /api/availability`

**Files:**
- Create: `src/lib/reservations/availability.ts`, `src/app/api/availability/route.ts`, `src/lib/security/rate-limit.ts`
- Test: `tests/integration/availability.test.ts`

**Interfaces:**
- Produces: `getAvailability(date: string, deps: { calendar: CalendarPort }): Promise<{ date, slots: string[], closed: boolean, reason?: string }>`; `rateLimit(key: string, limit: number, windowMs: number): boolean`

- [ ] **Step 1: Failing tests** — bağlı gün boş siyahı + `reason` qaytarır; keçmiş tarix `400`; DB-də `confirmed` olan saat siyahıda yoxdur; Calendar məşğul aralığı siyahıdan çıxır; Calendar xətası atarsa DB əsaslı siyahı qayıdır.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — spec bölmə 5-dəki 7 addımlı ardıcıllıq.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: boş vaxtların hesablanması endpoint-i`

---

### Task 8: Rezervasiya yaratma və `POST /api/reservations`

**Files:**
- Create: `src/lib/reservations/code.ts`, `src/lib/reservations/token.ts`, `src/lib/reservations/create.ts`, `src/app/api/reservations/route.ts`
- Test: `tests/integration/create-reservation.test.ts`, `tests/integration/race.test.ts`

**Interfaces:**
- Produces: `generateReservationCode(): string` (8 simvol, oxunaqlı əlifba); `generateCancellationToken(): string` (64 hex); `createReservation(input, deps: { calendar, telegram }): Promise<Result>` — `Result = { ok: true, reservation } | { ok: false, code: 'SLOT_TAKEN' | 'INVALID_SLOT' | 'CALENDAR_FAILED' | 'INVALID_INPUT' }`

- [ ] **Step 1: Failing tests** — 60 dəqiqəlik sətir yaranır və `end_time` düzgündür; Calendar `createEvent` çağırılır və `google_calendar_event_id` yazılır; müştəri və sahibkar mesajları göndərilir; Calendar xəta atarsa status `failed` olur, slot yenidən boş görünür, cavab `502` + sadə mesaj; eyni `idempotency_key` ilə ikinci sorğu yeni sətir yaratmır; `Promise.all` ilə iki paralel sorğudan yalnız biri uğurlu, digəri `SLOT_TAKEN`.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — server tərəfdə slot yenidən hesablanır; `P2002` → `SLOT_TAKEN`; Telegram xətası rezervasiyanı pozmur (log + davam).
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: rezervasiya yaratma, race condition və idempotentlik`

---

### Task 9: Baxış və ləğv — `GET /api/reservations/:code`, `POST /api/reservations/:code/cancel`

**Files:**
- Create: `src/lib/reservations/cancel.ts`, `src/app/api/reservations/[code]/route.ts`, `src/app/api/reservations/[code]/cancel/route.ts`
- Test: `tests/integration/cancel.test.ts`

**Interfaces:**
- Produces: `cancelReservation(code: string, token: string, deps): Promise<{ ok: true } | { ok: false, code: 'NOT_FOUND' | 'INVALID_TOKEN' | 'TOO_LATE' | 'ALREADY_CANCELLED' }>`

- [ ] **Step 1: Failing tests** — 48 saat sonrakı rezervasiya ləğv olunur, status `cancelled`, Calendar `deleteEvent` çağırılır, hər iki tərəfə mesaj gedir; 12 saat sonrakı rezervasiya `TOO_LATE` qaytarır və status dəyişmir; yanlış token `INVALID_TOKEN`; ləğvdən sonra həmin saat `availability`-də yenidən görünür; `GET /api/reservations/:code` `cancellation_token`-i cavabda qaytarmır.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — `timingSafeEqual` ilə token müqayisəsi; deadline luxon ilə zonada hesablanır.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: rezervasiyaya baxış və ləğv axını`

---

### Task 10: Telegram webhook, komandalar, polling və setup skriptləri

**Files:**
- Create: `src/lib/telegram/handlers.ts`, `src/app/api/telegram/webhook/route.ts`, `scripts/bot-poll.ts`, `scripts/set-webhook.ts`, `scripts/google-refresh-token.ts`
- Test: `tests/integration/webhook.test.ts`

**Interfaces:**
- Produces: `handleUpdate(update: TelegramUpdate, deps: { telegram }): Promise<void>` — `/start`, `/book`, `/cancel`, `/help` və `cancel:<code>` callback-i.

- [ ] **Step 1: Failing tests** — səhv secret başlığı ilə sorğu `401` və heç bir mesaj göndərilmir; düzgün secret ilə `/start` imzalı linkli düymə göndərir; eyni `update_id` ikinci dəfə gələndə mesaj təkrarlanmır.
- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** — webhook həmişə `200` qaytarır (Telegram təkrarını dayandırmaq üçün), xətalar loglanır.
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** — `feat: Telegram webhook, komandalar və dev polling`

---

### Task 11: Mobil rezervasiya interfeysi

**Files:**
- Create: `src/app/(booking)/page.tsx`, `src/app/(booking)/ugurlu/page.tsx`, `src/app/legv/[token]/page.tsx`, `src/app/xeta/page.tsx`
- Create: `src/components/StepIndicator.tsx`, `DatePicker.tsx`, `SlotGrid.tsx`, `CustomerForm.tsx`, `ReviewStep.tsx`, `Button.tsx`, `Notice.tsx`

**Interfaces:**
- Consumes: `GET /api/availability`, `POST /api/reservations`, `POST /api/reservations/:code/cancel`

- [ ] **Step 1:** 4 addımlı axın (tarix → saat → məlumat → təsdiq), mobil-first Tailwind, bütün mətn Azərbaycan dilində.
- [ ] **Step 2:** Keçmiş tarixlər seçilə bilmir; boş saat yoxdursa aydın mesaj.
- [ ] **Step 3:** `409` cavabında "bu vaxt yenicə tutuldu" vəziyyəti göstərilir və saatlar yenilənir.
- [ ] **Step 4:** Uğur səhifəsində kod, tarix, saat və ləğv linki.
- [ ] **Step 5: Commit** — `feat: mobil rezervasiya interfeysi`

---

### Task 12: README, .env.example, yekun yoxlama

**Files:**
- Create: `README.md`, `.env.example`

- [ ] **Step 1:** README-də spec bölmə 16-dakı 13 addım (quraşdırma, DB, bot, webhook, Google Cloud, OAuth, refresh token, env, dev, production, ilk test, loglar).
- [ ] **Step 2:** `.env.example` — bütün açarlar, məxfi dəyərlər boş.
- [ ] **Step 3:** `npm run typecheck && npm test && npm run build` → hamısı yaşıl.
- [ ] **Step 4: Commit** — `docs: quraşdırma təlimatı və environment nümunəsi`

---

## Self-Review

- **Spec coverage:** bölmə 1 → Task 6/10; 2 → Task 11; 3 → Task 2; 4 → Task 5/8; 5 → Task 6/8; 6 → Task 9; 7 → Task 2; 8 → Task 2 (DB-də konfiqurasiya); 9 → Task 1/7/8/9/10; 10 → Task 1/4/6/7/8/9; 11 → Task 11; 13 → Task 1; 14 → Task 12; 15 → bütün task-ların test addımları; 16 → Task 12.
- **Type consistency:** `CalendarPort`, `TelegramPort`, `ReservationStatus` adları bütün task-larda eynidir; `getAvailability` və `createReservation` `deps` obyektini eyni formada qəbul edir.
