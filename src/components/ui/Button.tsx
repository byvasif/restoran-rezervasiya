import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'quiet' | 'danger'

const STYLES: Record<Variant, string> = {
  primary: 'bg-nar-700 text-paper hover:bg-nar-500 active:bg-nar-900 disabled:bg-sand-dark disabled:text-ink-soft',
  quiet: 'bg-transparent text-ink-soft hover:text-ink underline underline-offset-4 decoration-sand-dark',
  danger: 'bg-nar-500 text-paper hover:bg-nar-700 disabled:bg-sand-dark disabled:text-ink-soft',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
}

export function Button({ variant = 'primary', full = false, className = '', ...props }: ButtonProps) {
  const base =
    variant === 'quiet'
      ? 'py-2 text-[15px]'
      : 'min-h-[52px] px-6 rounded-lg text-[17px] font-semibold transition-colors disabled:cursor-not-allowed'

  return <button className={`${base} ${STYLES[variant]} ${full ? 'w-full' : ''} ${className}`} {...props} />
}
