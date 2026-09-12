const STEPS = ['Tarix', 'Saat', 'Məlumat', 'Təsdiq'] as const

export type StepIndex = 0 | 1 | 2 | 3

export function StepRail({ current }: { current: StepIndex }) {
  return (
    <div className="mb-7">
      <div className="flex gap-1.5" role="presentation">
        {STEPS.map((step, index) => (
          <span
            key={step}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              index <= current ? 'bg-nar-700' : 'bg-sand-dark'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-ink-soft">
        {current + 1}/{STEPS.length} — {STEPS[current]}
      </p>
    </div>
  )
}
