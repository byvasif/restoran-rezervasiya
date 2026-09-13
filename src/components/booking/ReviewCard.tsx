import type { Dictionary, Locale } from '@/i18n'
import { formatDateLong } from '@/i18n/format-date'

interface ReviewCardProps {
  restaurantName: string
  firstName: string
  lastName: string
  phoneNumber: string
  date: string
  time: string
  endTime: string
  locale: Locale
  dictionary: Dictionary
}

/** Təsdiqdən əvvəl müştərinin daxil etdiyi məlumatların yekun görünüşü. */
export function ReviewCard({
  restaurantName,
  firstName,
  lastName,
  phoneNumber,
  date,
  time,
  endTime,
  locale,
  dictionary,
}: ReviewCardProps) {
  const rows: Array<[string, string]> = [
    [dictionary.booking.labelRestaurant, restaurantName],
    [dictionary.booking.labelName, `${firstName} ${lastName}`],
    [dictionary.booking.labelPhone, phoneNumber],
    [dictionary.booking.labelDate, formatDateLong(date, locale)],
    [dictionary.booking.labelTime, `${time} – ${endTime}`],
  ]

  return (
    <dl className="rounded-xl border border-sand-dark border-l-4 border-l-nar-700 bg-sand/60">
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
  )
}
