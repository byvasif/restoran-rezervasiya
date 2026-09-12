-- Eyni tarix və saat üçün yalnız bir TƏSDİQLƏNMİŞ rezervasiya ola bilər.
-- Race condition-un qarşısı tətbiq kodunda deyil, məhz burada — baza
-- səviyyəsində alınır. Ləğv edilmiş və uğursuz rezervasiyalar slotu tutmur.
CREATE UNIQUE INDEX "reservations_slot_confirmed_key"
  ON "reservations" ("reservation_date", "start_time")
  WHERE "status" = 'confirmed';
