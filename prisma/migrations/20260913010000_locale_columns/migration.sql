-- Çoxdilli dəstək: botun istifadəçi ilə danışdığı dil və rezervasiyanın dili.
-- Rezervasiya dili ayrıca saxlanılır ki, müştəri günlər sonra ləğv edəndə
-- təsdiq mesajı yenə onun seçdiyi dildə getsin.
ALTER TABLE "users" ADD COLUMN "locale" TEXT;
ALTER TABLE "reservations" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'az';
