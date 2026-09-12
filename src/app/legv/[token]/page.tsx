import { getSettings } from '@/config/business'
import { canCancel, findByCancellationToken } from '@/lib/reservations/cancel'
import { messages } from '@/lib/telegram/messages.az'
import { formatDateAz } from '@/lib/time/format-az'
import { dbDateToDateString } from '@/lib/time/timezone'
import { CancelPanel } from '@/components/cancel/CancelPanel'
import { Notice } from '@/components/ui/Notice'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/** Rezervasiya ləğvi səhifəsi — yalnız təsadüfi ləğv tokeni ilə açılır. */
export default async function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const settings = await getSettings()
  const reservation = /^[a-f0-9]{64}$/.test(token) ? await findByCancellationToken(token) : null

  if (!reservation) {
    return (
      <PageShell restaurantName={settings.restaurantName} restaurantAddress={settings.restaurantAddress}>
        <h2 className="font-display text-[24px] text-ink">Bu ləğv linki etibarlı deyil</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Link köhnəlmiş ola bilər. Telegram botuna /cancel yazaraq aktiv rezervasiyalarınızı görə bilərsiniz.
        </p>
      </PageShell>
    )
  }

  const date = dbDateToDateString(reservation.reservationDate)
  const tooLate = !canCancel(reservation, settings.cancellationDeadlineHours)

  return (
    <PageShell restaurantName={settings.restaurantName} restaurantAddress={settings.restaurantAddress}>
      <h2 className="font-display text-[24px] leading-tight text-ink">Rezervasiyanı ləğv edirsiniz</h2>

      <dl className="mt-5 rounded-xl border border-sand-dark border-l-4 border-l-nar-700 bg-sand/60">
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
            <dd className="text-right text-[16px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        {reservation.status === 'cancelled' ? (
          <Notice tone="info">Bu rezervasiya artıq ləğv edilib.</Notice>
        ) : tooLate ? (
          <Notice tone="warning">{messages.cancelTooLate(settings.cancellationDeadlineHours)}</Notice>
        ) : (
          <CancelPanel reservationCode={reservation.reservationCode} token={token} />
        )}
      </div>
    </PageShell>
  )
}
