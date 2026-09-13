import { getSettings } from '@/config/business'
import { getBookingDays } from '@/lib/reservations/calendar-days'
import { fill, getDictionary, toLocale } from '@/i18n'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { HoursSummary } from '@/components/booking/HoursSummary'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/**
 * Ana rezervasiya səhifəsi. Telegram botundan gələn `t` parametri müştərinin
 * chat ID-sini imzalı şəkildə daşıyır — server tərəfdə yoxlanılır.
 */
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const locale = toLocale((await params).locale)
  const dictionary = getDictionary(locale)
  const [settings, calendar, query] = await Promise.all([
    getSettings(),
    getBookingDays(21, locale),
    searchParams,
  ])

  return (
    <PageShell
      locale={locale}
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
    >
      <p className="mb-6 text-[16px] leading-relaxed text-ink-soft">
        {fill(dictionary.booking.intro, { minutes: settings.bookingDurationMinutes })}
      </p>

      <BookingFlow
        locale={locale}
        dictionary={dictionary}
        restaurantName={settings.restaurantName}
        days={calendar.days}
        telegramToken={query.t}
      />

      <HoursSummary locale={locale} />
    </PageShell>
  )
}
