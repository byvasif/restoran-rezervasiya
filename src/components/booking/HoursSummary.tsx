import { prisma } from '@/lib/db/prisma'
import { fill, getDictionary, type Locale } from '@/i18n'
import { weekdayName } from '@/i18n/format-date'

// Həftə Bazar ertəsindən başlayır, Bazar sonda.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface HoursLine {
  days: string
  hours: string
}

/** İş qrafikini ardıcıl eyni günləri birləşdirərək göstərir. */
export async function HoursSummary({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale)
  const rows = await prisma.businessHours.findMany()
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]))

  function describe(weekday: number): string {
    const row = byWeekday.get(weekday)
    if (!row?.isOpen || !row.openingTime || !row.closingTime) return dictionary.booking.closedAllDay

    return row.breakStart && row.breakEnd
      ? fill(dictionary.booking.hoursWithBreak, {
          opening: row.openingTime,
          closing: row.closingTime,
          breakStart: row.breakStart,
          breakEnd: row.breakEnd,
        })
      : fill(dictionary.booking.hoursPlain, { opening: row.openingTime, closing: row.closingTime })
  }

  const lines: HoursLine[] = []
  for (const weekday of WEEK_ORDER) {
    const hours = describe(weekday)
    const previous = lines[lines.length - 1]

    if (previous && previous.hours === hours) {
      previous.days = `${previous.days.split(' – ')[0]} – ${weekdayName(weekday, locale)}`
    } else {
      lines.push({ days: weekdayName(weekday, locale), hours })
    }
  }

  return (
    <section className="mt-12 border-t border-sand-dark pt-6">
      <h2 className="font-display text-[18px] text-ink">{dictionary.booking.hoursHeading}</h2>
      <dl className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <div key={line.days} className="flex justify-between gap-4 text-[15px]">
            <dt className="text-ink-soft">{line.days}</dt>
            <dd className={line.hours === dictionary.booking.closedAllDay ? 'text-ink-soft' : 'text-ink'}>
              {line.hours}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
