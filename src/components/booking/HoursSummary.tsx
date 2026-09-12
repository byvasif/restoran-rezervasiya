import { prisma } from '@/lib/db/prisma'
import { weekdayNameAz } from '@/lib/time/format-az'

// Həftə Bazar ertəsindən başlayır, Bazar sonda.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

interface HoursLine {
  days: string
  hours: string
}

function describe(row: { isOpen: boolean; openingTime: string | null; closingTime: string | null; breakStart: string | null; breakEnd: string | null } | undefined): string {
  if (!row?.isOpen || !row.openingTime || !row.closingTime) return 'Qapalı'
  const base = `${row.openingTime} – ${row.closingTime}`
  return row.breakStart && row.breakEnd ? `${base} (fasilə ${row.breakStart} – ${row.breakEnd})` : base
}

/** İş qrafikini ardıcıl eyni günləri birləşdirərək göstərir. */
export async function HoursSummary() {
  const rows = await prisma.businessHours.findMany()
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]))

  const lines: HoursLine[] = []
  for (const weekday of WEEK_ORDER) {
    const hours = describe(byWeekday.get(weekday))
    const previous = lines[lines.length - 1]

    if (previous && previous.hours === hours) {
      previous.days = `${previous.days.split(' – ')[0]} – ${weekdayNameAz(weekday)}`
    } else {
      lines.push({ days: weekdayNameAz(weekday), hours })
    }
  }

  return (
    <section className="mt-12 border-t border-sand-dark pt-6">
      <h2 className="font-display text-[18px] text-ink">İş saatları</h2>
      <dl className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <div key={line.days} className="flex justify-between gap-4 text-[15px]">
            <dt className="text-ink-soft">{line.days}</dt>
            <dd className={line.hours === 'Qapalı' ? 'text-ink-soft' : 'text-ink'}>{line.hours}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
