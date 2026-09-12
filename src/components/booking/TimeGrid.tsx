'use client'

interface TimeGridProps {
  slots: string[]
  selected: string | null
  onSelect: (time: string) => void
}

export function TimeGrid({ slots, selected, onSelect }: TimeGridProps) {
  return (
    <ul className="grid grid-cols-3 gap-2" role="listbox" aria-label="Saat seçimi">
      {slots.map((slot) => {
        const isSelected = slot === selected
        return (
          <li key={slot}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(slot)}
              className={`h-12 w-full rounded-lg border text-[17px] transition-colors ${
                isSelected
                  ? 'border-nar-700 bg-nar-700 text-paper'
                  : 'border-sand-dark bg-paper text-ink hover:border-nar-500'
              }`}
            >
              {slot}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
