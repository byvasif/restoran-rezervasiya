import { fill, type Dictionary } from '@/i18n'

export type StepIndex = 0 | 1 | 2 | 3

export function StepRail({ current, dictionary }: { current: StepIndex; dictionary: Dictionary }) {
  const names = [
    dictionary.booking.stepNames.date,
    dictionary.booking.stepNames.time,
    dictionary.booking.stepNames.details,
    dictionary.booking.stepNames.review,
  ]

  return (
    <div className="mb-7">
      <div className="flex gap-1.5" role="presentation">
        {names.map((step, index) => (
          <span
            key={step}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              index <= current ? 'bg-nar-700' : 'bg-sand-dark'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-ink-soft">
        {fill(dictionary.booking.stepCounter, {
          current: current + 1,
          total: names.length,
          name: names[current],
        })}
      </p>
    </div>
  )
}
