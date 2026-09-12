type Tone = 'info' | 'warning' | 'error' | 'success'

const TONES: Record<Tone, string> = {
  info: 'bg-sand text-ink border-sand-dark',
  warning: 'bg-[#FDF4E3] text-ink border-brass',
  error: 'bg-nar-100 text-nar-900 border-nar-500',
  success: 'bg-[#EAF3EC] text-[#1C3A25] border-[#8BB89B]',
}

export function Notice({ tone = 'info', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <p className={`rounded-lg border-l-4 px-4 py-3 text-[15px] leading-relaxed ${TONES[tone]}`} role="status">
      {children}
    </p>
  )
}
