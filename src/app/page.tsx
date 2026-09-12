import { getSettings } from '@/config/business'
import { getBookingDays } from '@/lib/reservations/calendar-days'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { HoursSummary } from '@/components/booking/HoursSummary'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/**
 * Ana rezervasiya səhifəsi. Telegram botundan gələn `t` parametri müştərinin
 * chat ID-sini imzalı şəkildə daşıyır — server tərəfdə yoxlanılır.
 */
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const [settings, calendar, params] = await Promise.all([getSettings(), getBookingDays(), searchParams])

  return (
    <PageShell restaurantName={settings.restaurantName} restaurantAddress={settings.restaurantAddress}>
      <p className="mb-6 text-[16px] leading-relaxed text-ink-soft">
        Masa rezervasiyası {settings.bookingDurationMinutes} dəqiqədir. Tarix və saatı seçin, adınızı yazın — rezervasiya
        dərhal təsdiqlənir.
      </p>

      <BookingFlow
        restaurantName={settings.restaurantName}
        days={calendar.days}
        telegramToken={params.t}
      />

      <HoursSummary />
    </PageShell>
  )
}
