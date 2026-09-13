import { getSettings } from '@/config/business'
import { canCancel, findByCancellationToken } from '@/lib/reservations/cancel'
import { fill, getDictionary, toLocale } from '@/i18n'
import { formatDateLong } from '@/i18n/format-date'
import { dbDateToDateString } from '@/lib/time/timezone'
import { CancelPanel } from '@/components/cancel/CancelPanel'
import { Notice } from '@/components/ui/Notice'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/** Rezervasiya ləğvi səhifəsi — yalnız təsadüfi ləğv tokeni ilə açılır. */
export default async function CancelPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale: rawLocale, token } = await params
  const locale = toLocale(rawLocale)
  const dictionary = getDictionary(locale)

  const settings = await getSettings()
  const reservation = /^[a-f0-9]{64}$/.test(token) ? await findByCancellationToken(token) : null

  if (!reservation) {
    return (
      <PageShell
        locale={locale}
        restaurantName={settings.restaurantName}
        restaurantAddress={settings.restaurantAddress}
      >
        <h2 className="font-display text-[24px] text-ink">{dictionary.cancel.invalidHeading}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{dictionary.cancel.invalidBody}</p>
      </PageShell>
    )
  }

  const date = dbDateToDateString(reservation.reservationDate)
  const tooLate = !canCancel(reservation, settings.cancellationDeadlineHours)

  const rows: Array<[string, string]> = [
    [dictionary.booking.labelName, `${reservation.firstName} ${reservation.lastName}`],
    [dictionary.booking.labelDate, formatDateLong(date, locale)],
    [dictionary.booking.labelTime, `${reservation.startTime} – ${reservation.endTime}`],
    [dictionary.booking.labelCode, reservation.reservationCode],
  ]

  return (
    <PageShell
      locale={locale}
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
    >
      <h2 className="font-display text-[24px] leading-tight text-ink">{dictionary.cancel.heading}</h2>

      <dl className="mt-5 rounded-xl border border-sand-dark border-l-4 border-l-nar-700 bg-sand/60">
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
              index === 0 ? '' : 'border-t border-sand-dark/70'
            }`}
          >
            <dt className="shrink-0 text-[14px] text-ink-soft">{label}</dt>
            <dd className="text-right text-[16px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        {reservation.status === 'cancelled' ? (
          <Notice tone="info">{dictionary.cancel.alreadyCancelled}</Notice>
        ) : tooLate ? (
          <Notice tone="warning">
            {fill(dictionary.cancel.tooLate, { hours: settings.cancellationDeadlineHours })}
          </Notice>
        ) : (
          <CancelPanel
            reservationCode={reservation.reservationCode}
            token={token}
            locale={locale}
            dictionary={dictionary}
          />
        )}
      </div>
    </PageShell>
  )
}
