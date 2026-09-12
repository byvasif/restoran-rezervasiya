'use client'

import type { BookingDay } from '@/lib/reservations/calendar-days'

interface DateStripProps {
  days: BookingDay[]
  selected: string | null
  onSelect: (date: string) => void
}

export function DateStrip({ days, selected, onSelect }: DateStripProps) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2">
      <ul className="flex gap-2" role="listbox" aria-label="Tarix seçimi">
        {days.map((day) => {
          const isSelected = day.date === selected
          return (
            <li key={day.date}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={!day.isOpen}
                title={day.reason}
                onClick={() => onSelect(day.date)}
                className={`flex h-[76px] w-[62px] flex-col items-center justify-center rounded-xl border transition-colors ${
                  isSelected
                    ? 'border-nar-700 bg-nar-700 text-paper'
                    : day.isOpen
                      ? 'border-sand-dark bg-paper text-ink hover:border-nar-500'
                      : 'border-transparent bg-sand text-ink-soft/50'
                }`}
              >
                <span className="text-[12px] uppercase tracking-wide opacity-80">{day.weekdayShort}</span>
                <span className="font-display text-[24px] leading-tight">{day.dayNumber}</span>
                <span className="text-[11px] opacity-70">{day.isOpen ? day.monthShort : 'bağlı'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
