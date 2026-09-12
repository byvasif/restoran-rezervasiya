-- Google Calendar bağlantısı sahibkar tərəfindən brauzerdən qurulur;
-- refresh token environment deyil, bazada saxlanılır ki, yenidən qoşulma
-- üçün deploy və ya terminal lazım olmasın.
ALTER TABLE "business_settings"
  ADD COLUMN "google_refresh_token" TEXT,
  ADD COLUMN "google_calendar_id" TEXT,
  ADD COLUMN "google_connected_at" TIMESTAMP(3),
  ADD COLUMN "google_account_email" TEXT;
