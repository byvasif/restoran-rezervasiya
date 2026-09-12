import { notFound } from 'next/navigation'
import { getSettings } from '@/config/business'
import { findByCode } from '@/lib/reservations/cancel'
import { formatDateAz } from '@/lib/time/format-az'
import { dbDateToDateString } from '@/lib/time/timezone'
import { PageShell } from '@/components/ui/PageShell'
import { SuccessPanel } from '@/components/booking/SuccessPanel'

export const dynamic = 'force-dynamic'

/** Rezervasiya uğurlu səhifəsi — kod ilə açılır, ləğv tokeni URL-də daşınmır. */
export default async function SuccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const reservation = await findByCode(code)
  if (!reservation) notFound()

  const settings = await getSettings()
  const date = dbDateToDateString(reservation.reservationDate)
  const isCancelled = reservation.status === 'cancelled'

  return (
    <PageShell restaurantName={settings.restaurantName} restaurantAddress={settings.restaurantAddress}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="seal mt-1 flex h-14 w-14 shrink-0 rotate-[-3deg] items-center justify-center rounded-full border-2 border-brass font-display text-[22px] text-brass"
        >
          {isCancelled ? '×' : '✓'}
        </span>
        <div>
          <h2 className="font-display text-[26px] leading-tight text-ink">
            {isCancelled ? 'Rezervasiya ləğv edilib' : 'Rezervasiyanız təsdiqləndi'}
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            {isCancelled ? 'Bu vaxt yenidən boşdur.' : 'Sizi gözləyirik.'}
          </p>
        </div>
      </div>

      <dl className="mt-7 rounded-xl border border-sand-dark border-l-4 border-l-nar-700 bg-sand/60">
        {[
          ['Ad, soyad', `${reservation.firstName} ${reservation.lastName}`],
          ['Tarix', formatDateAz(date)],
          ['Saat', `${reservation.startTime} – ${reservation.endTime}`],
          ['Rezervasiya kodu', reservation.reservationCode],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
              index === 0 ? '' : 'border-t border-sand-dark/70'
            }`}
          >
            <dt className="shrink-0 text-[14px] text-ink-soft">{label}</dt>
            <dd className={`text-right text-[16px] text-ink ${label === 'Rezervasiya kodu' ? 'font-display text-[20px]' : ''}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {!isCancelled ? (
        <div className="mt-7">
          <SuccessPanel
            reservationCode={reservation.reservationCode}
            deadlineHours={settings.cancellationDeadlineHours}
          />
        </div>
      ) : (
        <a className="mt-7 inline-block text-[15px] text-nar-700 underline underline-offset-4" href="/">
          Yeni rezervasiya et
        </a>
      )}
    </PageShell>
  )
}
