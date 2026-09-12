# Restoran Rezervasiya Sistemi — Dizayn Sənədi

Tarix: 2026-09-12
Status: Təsdiqlənib

## 1. Məqsəd

Bir restoran və bir sahibkar üçün uçdan-uca rezervasiya sistemi. Müştəri Telegram
botuna yazır, bot ona rezervasiya linki göndərir, müştəri mobil səhifədə tarix və
saat seçir, rezervasiya sahibkarın Google Calendar-ına düşür və hər iki tərəfə
Telegram bildirişi gedir. İnterfeys və bütün mesajlar Azərbaycan dilindədir.

Miqyas fərziyyəsi: **eyni saata yalnız bir rezervasiya**. Masa anlayışı,
admin paneli, ödəniş, SMS və e-poçt bu versiyaya daxil deyil, lakin kod
strukturu onların sonradan əlavə olunmasına maneə yaratmır.

## 2. Texnologiya seçimləri

| Sahə | Seçim | Səbəb |
|------|-------|-------|
| Framework | Next.js 15 (App Router) + TypeScript | Tək deploy vahidində həm API, həm mobil səhifə |
| Baza | PostgreSQL 17 (yerli) + Prisma | Partial unique index ilə race condition zəmanəti |
| Stil | Tailwind CSS v4 | Mobil-first, əlavə komponent kitabxanası olmadan |
| Vaxt zonası | luxon | IANA zonaları, DST və divar saatı → UTC çevrilməsi |
| Telefon | libphonenumber-js | AZ nömrələrinin normalizasiyası (E.164) |
| Calendar | googleapis | Rəsmi OAuth2 + freeBusy dəstəyi |
| Telegram | Bot API-yə nazik `fetch` klienti | Kiçik səth, əlavə asılılıq yoxdur |
| Testlər | Vitest | Sürətli, layihənin qalan hissəsi ilə eyni TS konfiqi |

## 3. Qovluq strukturu

```
src/
  config/         env.ts (zod), business.ts, business-hours.json
  lib/
    time/         timezone.ts, slots.ts
    calendar/     client.ts, calendar-port.ts, google-calendar.ts
    telegram/     client.ts, telegram-port.ts, verify.ts, handlers.ts, messages.az.ts
    reservations/ availability.ts, create.ts, cancel.ts, code.ts, token.ts
    validation/   phone.ts, schemas.ts
    security/     rate-limit.ts, log.ts
    db/           prisma.ts
  app/
    (booking)/    page.tsx, ugurlu/, legv/[token]/, xeta/
    api/          availability, reservations, reservations/[code],
                  reservations/[code]/cancel, telegram/webhook, health
  components/     mobil-first UI komponentləri
prisma/           schema.prisma, migrations/, seed.ts
scripts/          bot-poll.ts, set-webhook.ts, google-refresh-token.ts
tests/            unit/, integration/
```

Xarici sistemlər **port interfeysləri** arxasındadır (`CalendarPort`,
`TelegramPort`). Testlərdə həqiqi şəbəkə sorğusu açılmır; gələcəkdə SMS və
ödəniş eyni naxışla əlavə olunur.

## 4. Verilənlər modeli

Cədvəllər: `users`, `reservations`, `business_settings`, `business_hours`,
`closed_dates`, `telegram_updates` (dedupe üçün).

`reservations.status` ∈ {`confirmed`, `cancelled`, `failed`}.

Vaxt saxlanması: `reservation_date` DATE, `start_time`/`end_time` TIME —
yəni konfiqurasiya olunmuş zonada **divar saatı**, üstəgəl `timezone` sütunu.
UTC anı yalnız Google Calendar sorğusu üçün luxon ilə hesablanır.

**Race condition həlli:** miqrasiyada xam SQL ilə
`CREATE UNIQUE INDEX ... ON reservations (reservation_date, start_time)
WHERE status = 'confirmed'`. Yalnız təsdiqlənmiş rezervasiya slotu tutur;
`cancelled` və `failed` slotu dərhal azad edir.

**Duplicate qorunması:** `reservations.idempotency_key` unikal sütunu (klient
tərəfdən göndərilir) və `telegram_updates.update_id` birincili açarı.

İş qrafiki DB-də yaşayır, ilkin dəyərlər `config/business-hours.json` + env-dən
seed ilə yüklənir. Səbəb: gələcək sahibkar paneli həmin sətirləri redaktə edəcək.

## 5. Boş vaxtların hesablanması

`GET /api/availability?date=YYYY-MM-DD`:

1. Tarix formatı və keçmiş tarix yoxlanışı (zonada bugünkü tarixə görə).
2. `closed_dates` yoxlanışı.
3. `business_hours` — həmin həftə günü açıqdırmı.
4. Açılış → bağlanış aralığında `booking_duration_minutes` addımı ilə slotlar;
   fasilə aralığı ilə kəsişənlər atılır; son slot bağlanışdan əvvəl bitməlidir.
5. Bu gün üçün artıq keçmiş (və `MIN_LEAD_MINUTES`-dən yaxın) slotlar atılır.
6. DB-dəki `confirmed` rezervasiyalarla kəsişənlər atılır.
7. Google Calendar `freeBusy` ilə məşğul aralıqlarla kəsişənlər atılır.

Calendar əlçatmaz olsa addım 7 buraxılır, xəta loglanır, istifadəçiyə texniki
detal göstərilmir — yaratma mərhələsində Calendar onsuz da yenidən yoxlanılır.

## 6. Rezervasiya yaratma axını

`POST /api/reservations`:

1. Zod ilə input doğrulaması; telefon E.164-ə normalizasiya.
2. Server tərəfdə slot yenidən hesablanır (klientə etibar edilmir).
3. Tranzaksiya: `users` upsert → `reservations` sətri `confirmed` statusu,
   unikal `reservation_code` və 32 baytlıq `cancellation_token` ilə yazılır.
   Unikal indeks pozuntusu (P2002) → `409` və "bu vaxt yenicə tutuldu" səhifəsi.
4. Google Calendar tədbiri yaradılır (60 dəq, başlıq
   "Restoran rezervasiyası — Ad Soyad", təsvirdə müştəri məlumatları,
   məkanda restoran ünvanı), `google_calendar_event_id` yazılır.
   Xəta olarsa status `failed` olur, slot azad olur, müştəriyə sadə dildə
   "yenidən cəhd edin" mesajı qayıdır.
5. Telegram: müştəriyə təsdiq + "Ləğv et" düyməsi, sahibkara ayrıca bildiriş.
   Telegram xətası rezervasiyanı ləğv etmir — loglanır, səhifə uğurlu qalır.

## 7. Telegram bağlantısı

Bot düyməsindəki link: `APP_BASE_URL/?t=<base64url(chatId.exp.hmac)>`.
HMAC açarı `TELEGRAM_WEBHOOK_SECRET`-dir. Bu olmasa istənilən şəxs formaya
başqasının chat ID-sini yaza bilərdi. İmza yoxdursa və ya etibarsızdırsa
rezervasiya yenə yaranır, sadəcə müştəriyə Telegram bildirişi getmir.

Webhook `X-Telegram-Bot-Api-Secret-Token` başlığı ilə doğrulanır və
`update_id` ilə dedupe olunur. Dev rejimi üçün `npm run bot:poll` long-polling
skripti — ngrok tələb olunmur.

Komandalar: `/start`, `/book`, `/cancel`, `/help` — hamısı Azərbaycan dilində.

## 8. Ləğv

Ləğv linki: `/legv/<token>` — 32 baytlıq `crypto.randomBytes` hex tokeni,
müqayisə `timingSafeEqual` ilə. Kod bilmək kifayət deyil, token tələb olunur.

Qayda: rezervasiyanın başlamasına `CANCELLATION_DEADLINE_HOURS` (default 24)
saatdan az qalıbsa ləğv rədd edilir və spesifikasiyadakı mesaj göstərilir.
Ləğv zamanı: status `cancelled`, `cancelled_at` yazılır, Calendar tədbiri
silinir, hər iki tərəfə Telegram bildirişi gedir, slot yenidən boş görünür.

## 9. Təhlükəsizlik

- Bütün məxfi dəyərlər env-də; `.env.example` boş nümunə ilə.
- Env `zod` ilə startda doğrulanır — çatışmayan dəyər səssiz keçmir.
- Bütün input zod sxemləri ilə; Prisma parametrləşdirilmiş sorğular (SQL
  injection); React default escaping (XSS); `dangerouslySetInnerHTML` yoxdur.
- Rate limiting: yaddaşdaxili token-bucket, IP + endpoint açarı ilə
  (tək instans üçün kifayətdir, README-də Redis qeydi var).
- Loglarda telefon və ad maskalanır (`+994**    **89` formasında).
- Google OAuth tokenləri yalnız serverdə; heç bir API cavabında görünmür.
- İstifadəçiyə texniki xəta detalı göstərilmir; server logunda tam detal qalır.

## 10. Testlər

Unit (şəbəkəsiz): slot generasiyası, fasilə, bağlanma, keçmiş saat, bağlı gün,
telefon doğrulaması, ləğv müddəti, HMAC/webhook doğrulaması, mesaj formatları.

İnteqrasiya (`restoran_rezervasiya_test` bazası, Calendar/Telegram mock port):
availability endpoint-i, 60 dəqiqəlik rezervasiya yaradılması, Calendar tədbiri
çağırışı, hər iki Telegram bildirişi, paralel iki sorğuda yalnız birinin uğuru,
24 saatdan əvvəl/sonra ləğv, ləğvdən sonra slotun azad olması, Calendar API
xətasının idarə olunması.

## 11. Qəbul meyarları

Bölmə 17-dəki bütün maddələr + `npm test`, `npm run typecheck`, `npm run build`
uğurla keçir.
