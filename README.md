# Restoran Rezervasiya Sistemi

Azərbaycan dilində işləyən masa rezervasiya sistemi: Telegram botu, mobil
rezervasiya səhifəsi və Google Calendar inteqrasiyası. Bir restoran və bir
sahibkar üçün nəzərdə tutulub.

**Necə işləyir:** müştəri bota `/start` yazır → bot rezervasiya linki göndərir →
müştəri mobil səhifədə tarix və saat seçir → rezervasiya sahibkarın Google
Calendar-ına düşür → həm müştəriyə, həm sahibkara Telegram bildirişi gedir.

## Texnologiyalar

| Sahə | Seçim |
|------|-------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Baza | PostgreSQL + Prisma |
| Stil | Tailwind CSS v4 |
| Vaxt zonası | luxon (default `Asia/Baku`) |
| Təqvim | Google Calendar API (OAuth 2.0 refresh token) |
| Bot | Telegram Bot API |
| Testlər | Vitest |

---

## 1. Layihənin qurulması

Tələblər: **Node.js 20+**, **PostgreSQL 14+**.

```bash
cd restoran-rezervasiya
npm install
cp .env.example .env
```

`.env` faylını 9-cu bölmədəki izaha görə doldurun.

## 2. Database-in yaradılması

```bash
# Baza yaradın (adı istənilən ola bilər — DATABASE_URL ilə uyğun olsun)
createdb restoran_rezervasiya

# Cədvəlləri yaradın
npm run db:migrate

# İş qrafikini və restoran parametrlərini yazın
npm run db:seed
```

İş qrafiki `src/config/business-hours.json` faylından oxunur. Defolt qrafik:
Bazar ertəsi – Şənbə 10:00–22:00, Bazar qapalı. Faylı redaktə edib
`npm run db:seed` işlədəndə qrafik yenilənir.

Bağlı günlər və fasilələr də həmin faylda göstərilir:

```json
{ "weekday": 3, "isOpen": true, "openingTime": "10:00", "closingTime": "22:00",
  "breakStart": "15:00", "breakEnd": "16:00" }
```

## 3. Telegram botun yaradılması

1. Telegram-da [@BotFather](https://t.me/BotFather) ilə söhbət açın.
2. `/newbot` yazın, bota ad və istifadəçi adı verin.
3. BotFather sizə token verəcək — onu `.env` faylında `TELEGRAM_BOT_TOKEN`-ə yazın.
4. Webhook secret yaradın və `TELEGRAM_WEBHOOK_SECRET`-ə yazın:
   ```bash
   openssl rand -hex 24
   ```
5. Sahibkarın chat ID-sini öyrənin: sahibkar hesabı ilə
   [@userinfobot](https://t.me/userinfobot) botuna yazın, aldığınız rəqəmi
   `OWNER_TELEGRAM_CHAT_ID`-ə yazın.

İstəyə görə BotFather-də `/setcommands` ilə komandaları əlavə edin:

```
start - Rezervasiya linkini göstərir
book - Rezervasiya səhifəsini açır
cancel - Rezervasiyanı ləğv etməyə kömək edir
help - İstifadə qaydaları
```

## 4. Telegram webhook-un qoşulması

**Development (tövsiyə olunur):** webhook əvəzinə long-polling işlədin — tunel
lazım deyil:

```bash
npm run bot:poll
```

**Production:** `APP_BASE_URL` real HTTPS ünvanı olduqdan sonra:

```bash
npm run bot:set-webhook
```

Skript webhook-u `APP_BASE_URL/api/telegram/webhook` ünvanına qoşur və secret
token təyin edir. Söndürmək üçün: `npm run bot:set-webhook -- --delete`.

> Eyni anda həm polling, həm webhook işləyə bilməz. `bot:poll` başlayanda
> webhook avtomatik söndürülür.

## 5. Google Cloud Console-da layihənin yaradılması

1. [console.cloud.google.com](https://console.cloud.google.com) → yuxarıdakı
   layihə siyahısından **New Project**.
2. Layihəyə ad verin (məsələn `restoran-rezervasiya`) və **Create** düyməsini basın.

## 6. Google Calendar API-nin aktivləşdirilməsi

1. Sol menyudan **APIs & Services → Library**.
2. Axtarışa `Google Calendar API` yazın.
3. **Enable** düyməsini basın.

## 7. OAuth 2.0 credentials yaradılması

1. **APIs & Services → OAuth consent screen** (yeni interfeysdə **Google Auth
   Platform**): User Type `External`, tətbiq adı və dəstək e-poçtunu doldurun.
2. **Data Access** → **Add or remove scopes** →
   `https://www.googleapis.com/auth/calendar` seçin → Update → Save.
3. **Audience** → restoranın Google hesabını **Test users** siyahısına əlavə edin,
   sonra **Publish app** düyməsini basın.

   > **Vacib:** Testing rejimində Google refresh tokeni 7 gündən sonra ləğv edir
   > və rezervasiyalar səssizcə dayanır. Publish etdikdən sonra bu limit aradan
   > qalxır. Google "verification" təklif edərsə, tətbiq yalnız restoranın öz
   > hesabı tərəfindən istifadə olunduğu üçün müraciət etmək lazım deyil.

4. **Clients → Create OAuth client**:
   - Application type: **Web application**
   - **Authorized redirect URIs → Add URI**:
     `https://<sizin-domeniniz>/api/google/callback`
     (lokal iş üçün əlavə olaraq `http://localhost:3200/api/google/callback`)
   - **Authorized JavaScript origins** boş qala bilər — ora yol (`/...`) yazılmır.
5. Alınan **Client ID** və **Client Secret** dəyərlərini `.env`-ə yazın:
   ```
   GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-..."
   ```

## 8. Təqvimin qoşulması (brauzerdən, terminalsız)

Refresh token **environment-də deyil, bazada** saxlanılır — sahibkar təqvimi
brauzerdən qoşur. Bunun üçün qoşulma linkini qoruyan açar lazımdır:

```bash
openssl rand -hex 24        # çıxan dəyəri SETUP_SECRET-ə yazın
```

`.env` (və production mühitində) `SETUP_SECRET` təyin edildikdən sonra sahibkar
bu linki açır:

```
https://<sizin-domeniniz>/api/google/connect?key=<SETUP_SECRET>
```

Axın: Google hesabı seçilir → "Google bu tətbiqi doğrulamadı" xəbərdarlığında
**Davam et** → təqvim icazəsi verilir → **"Təqvim qoşuldu"** səhifəsi açılır və
hansı hesabla qoşulduğu göstərilir.

Token bazadakı `business_settings.google_refresh_token` sahəsinə yazılır. Token
ölərsə və ya başqa təqvimə keçmək lazım gələrsə, sahibkar eyni linki yenidən
açır — nə terminal, nə yenidən deploy lazımdır.

Qoşulmanın vəziyyətini yoxlamaq üçün:

```bash
curl https://<sizin-domeniniz>/api/health
# {"status":"ok","database":"up","calendar":{"connected":true,"source":"database",...}}
```

`GOOGLE_CALENDAR_ID` üçün: sahibkarın əsas təqvimi olacaqsa `primary` yazın.
Ayrıca təqvim istifadə olunacaqsa, Google Calendar → təqvimin ayarları →
**Integrate calendar → Calendar ID** dəyərini köçürün.

> Environment-dəki `GOOGLE_REFRESH_TOKEN` yalnız ehtiyat variantdır: baza boşdursa
> ondan istifadə olunur. Adi halda bu dəyəri doldurmağa ehtiyac yoxdur.

## 9. Environment dəyişənləri

| Dəyişən | İzah |
|---------|------|
| `DATABASE_URL` | PostgreSQL bağlantı sətri |
| `TELEGRAM_BOT_TOKEN` | BotFather-dən alınan token |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook doğrulaması və link imzası üçün sirr (ən azı 16 simvol) |
| `OWNER_TELEGRAM_CHAT_ID` | Sahibkarın Telegram chat ID-si |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | İstifadə olunmur — redirect ünvanı `APP_BASE_URL`-dən qurulur |
| `GOOGLE_CALENDAR_ID` | `primary` və ya konkret təqvim ID-si |
| `GOOGLE_REFRESH_TOKEN` | İstəyə bağlı — adətən boş qalır, token bazada saxlanılır (8-ci bölmə) |
| `SETUP_SECRET` | Təqvim qoşulma linkini qoruyan açar (`openssl rand -hex 24`) |
| `RESTAURANT_NAME` | Restoranın adı (səhifədə və mesajlarda görünür) |
| `RESTAURANT_ADDRESS` | Ünvan (təqvim tədbirinin məkan sahəsində göstərilir) |
| `TIMEZONE` | Default `Asia/Baku` |
| `BOOKING_DURATION_MINUTES` | Default `60` |
| `CANCELLATION_DEADLINE_HOURS` | Default `24` |
| `MIN_LEAD_MINUTES` | Bugünkü rezervasiya üçün minimum irəli vaxt, default `60` |
| `APP_BASE_URL` | Tətbiqin açıq ünvanı (bot linkləri buradan qurulur) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Sorğu limiti, default 30/dəqiqə |

Məxfi dəyərlər `.env.example` faylında boş saxlanılıb və `.env` git-ə düşmür.

## 10. Development rejimində işə salınma

İki terminal açın:

```bash
# 1-ci terminal — veb tətbiq
npm run dev            # http://localhost:3200

# 2-ci terminal — bot
npm run bot:poll
```

Sonra Telegram-da öz botunuza `/start` yazın.

## 11. Production-a yerləşdirmə

1. Hosted PostgreSQL alın (Supabase, Neon, RDS və s.) və `DATABASE_URL`-i yazın.
2. Miqrasiyaları tətbiq edin: `npm run db:deploy`, sonra `npm run db:seed`.
3. Tətbiqi yerləşdirin (Vercel, Railway, öz serveriniz):
   ```bash
   npm run build
   npm run start
   ```
4. `APP_BASE_URL`-i real HTTPS ünvanı ilə əvəz edin.
5. Google Console-da redirect URI-ni production ünvanı ilə yeniləyin:
   `https://<domeniniz>/api/google/callback`.
6. Webhook-u qoşun: `npm run bot:set-webhook`.
7. `SETUP_SECRET` təyin edin və təqvimi qoşma linki ilə bağlayın (8-ci bölmə).
8. `GET /api/health` ünvanının `{"status":"ok"}` qaytardığını və
   `calendar.connected` sahəsinin `true` olduğunu yoxlayın.

> **Qeyd:** rate limiting yaddaşdaxilidir, yəni hər instans üçün ayrıca sayılır.
> Bir neçə instans işlədəcəksinizsə, `src/lib/security/rate-limit.ts` faylını
> Redis əsaslı sayğacla əvəz edin.

## 12. İlk test rezervasiyasının yaradılması

1. Botda `/start` yazın və **Rezervasiya et** düyməsinə klik edin.
2. Açılan səhifədə tarix seçin — bağlı günlər seçilə bilmir.
3. Boş saatlardan birini seçin.
4. Ad, soyad və telefon nömrəsini yazın (`050 123 45 67` formatı qəbul olunur).
5. Məlumatları yoxlayıb **Rezervasiyanı təsdiqlə** düyməsini basın.

Yoxlayın:

- Müştəriyə Telegram-da təsdiq mesajı və ləğv düyməsi gəldi;
- Sahibkara ayrıca bildiriş gəldi;
- Google Calendar-da 60 dəqiqəlik tədbir yarandı, təsvirdə müştəri məlumatları var;
- Həmin saat səhifədə artıq göstərilmir;
- Ləğv düyməsi rezervasiyanı ləğv edir və saat yenidən boş görünür.

## 13. Səhvlərin yoxlanılması və logların oxunması

Bütün server logları JSON sətirləridir və `scope` sahəsi ilə işarələnir:

```
{"level":"error","scope":"reservations.calendar","message":"...","timestamp":"..."}
```

Əsas `scope` dəyərləri:

| Scope | Nə vaxt yazılır |
|-------|-----------------|
| `availability.calendar` | Google Calendar sorğusu alınmadı (siyahı baza əsasında qaytarıldı) |
| `reservations.create` | Rezervasiya yaradıldı / slot paralel sorğu ilə tutuldu |
| `reservations.calendar` | Təqvim tədbiri yaradıla bilmədi (rezervasiya `failed` oldu) |
| `reservations.notify.customer` / `.owner` | Telegram mesajı göndərilmədi |
| `reservations.cancel` | Rezervasiya ləğv edildi |
| `telegram.webhook` | Doğrulanmamış webhook sorğusu rədd edildi |
| `google.connect` / `google.callback` | Təqvim qoşulma cəhdləri və nəticəsi |
| `health.database` | Baza bağlantısı yoxlanışı uğursuz oldu |

Telefon nömrələri və adlar loglarda maskalanır (`+994*******67`, `E****`).
İstifadəçiyə heç vaxt texniki xəta detalı göstərilmir.

Tez-tez rast gəlinən hallar:

- **Bot cavab vermir** → `npm run bot:set-webhook` çıxışındakı `getWebhookInfo`
  sahəsinə baxın; `last_error_message` problemi göstərir.
- **Boş saat görünmür** → iş qrafikini (`business_hours`), bağlı günləri
  (`closed_dates`) və Google Calendar-dakı mövcud tədbirləri yoxlayın.
- **Rezervasiya 502 qaytarır** → təqvim bağlantısı yoxdur və ya token ləğv
  olunub. `GET /api/health` cavabında `calendar.connected` sahəsinə baxın;
  `false`-dursa sahibkar qoşulma linkini yenidən açmalıdır (8-ci bölmə).

---

## API

| Metod | Ünvan | Təyinat |
|-------|-------|---------|
| `GET` | `/api/availability?date=YYYY-MM-DD` | Seçilmiş tarix üçün boş saatlar |
| `POST` | `/api/reservations` | Yeni rezervasiya yaradır |
| `GET` | `/api/reservations/:code` | Rezervasiyanın açıq məlumatları |
| `POST` | `/api/reservations/:code/cancel` | Rezervasiyanı ləğv edir (token tələb olunur) |
| `POST` | `/api/telegram/webhook` | Telegram update-ləri (secret ilə doğrulanır) |
| `GET` | `/api/google/connect?key=…` | Sahibkarı Google icazə səhifəsinə yönləndirir |
| `GET` | `/api/google/callback` | Tokeni alıb bazaya yazır |
| `GET` | `/api/health` | Sağlamlıq yoxlanışı |

## Testlər

```bash
npm run db:test:setup   # test bazasını hazırlayır (.env.test)
npm test                # bütün testlər
npm run test:unit       # yalnız şəbəkəsiz unit testlər
npm run typecheck
```

Testlər Google Calendar və Telegram-ı mock port-larla əvəz edir — heç bir real
API sorğusu getmir. Əhatə olunan ssenarilər: boş/məşğul saatların hesablanması,
60 dəqiqəlik rezervasiya, təqvim tədbirinin yaradılması, hər iki Telegram
bildirişi, eyni vaxta iki rezervasiyanın bloklanması, 24 saat qaydası,
ləğvdən sonra vaxtın azad olması, keçmiş tarixlər, iş saatlarından kənar
vaxtlar, bağlı günlər, yanlış telefon nömrəsi, Google Calendar xətası və
webhook doğrulaması.

## Layihənin strukturu

```
src/
  config/         env doğrulaması, iş qrafiki, restoran parametrləri
  lib/
    time/         vaxt zonası, slot generasiyası, Azərbaycanca tarix formatı
    calendar/     CalendarPort interfeysi + Google implementasiyası
    telegram/     TelegramPort, mesajlar, imzalı linklər, komandalar
    reservations/ availability, yaratma, ləğv, kod və token generasiyası
    validation/   telefon normalizasiyası, zod sxemləri
    security/     rate limiting, PII maskalanan loglar
  app/            səhifələr və API route-ları
  components/     mobil-first UI
prisma/           sxem, miqrasiyalar, seed
scripts/          bot polling, webhook quraşdırma, Google token
tests/            unit və inteqrasiya testləri
```

Xarici sistemlər (`CalendarPort`, `TelegramPort`) interfeys arxasındadır —
gələcəkdə SMS, ödəniş və ya başqa təqvim provayderi eyni naxışla əlavə olunur.

## Gələcək genişlənmə üçün hazır nöqtələr

- **Masalar və tutum:** `reservations` cədvəlinə `table_id` əlavə edib
  `reservations_slot_confirmed_key` indeksini `(reservation_date, start_time, table_id)`
  formasına keçirmək kifayətdir.
- **Sahibkar paneli:** iş qrafiki və parametrlər onsuz da bazadadır
  (`business_settings`, `business_hours`, `closed_dates`) — panel yalnız həmin
  sətirləri redaktə edəcək.
- **Bir neçə əməkdaş / filial:** hər biri üçün ayrıca `GOOGLE_CALENDAR_ID` və
  `CalendarPort` instansı.
- **SMS, ödəniş, hesabatlar:** mövcud port naxışı ilə yeni modul kimi.
