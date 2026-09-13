'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import type { Dictionary, Locale } from '@/i18n'

interface CancelPanelProps {
  reservationCode: string
  token: string
  locale: Locale
  dictionary: Dictionary
}

export function CancelPanel({ reservationCode, token, locale, dictionary }: CancelPanelProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setState('sending')
    setError(null)

    try {
      const response = await fetch(`/api/reservations/${reservationCode}/cancel?lang=${locale}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}) as Record<string, unknown>)

      if (response.ok) {
        setState('done')
        return
      }

      setError((data.error as string) ?? dictionary.cancel.failed)
      setState('idle')
    } catch {
      setError(dictionary.booking.errorNetwork)
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-4">
        <Notice tone="success">{dictionary.cancel.doneNotice}</Notice>
        <a className="inline-block text-[15px] text-nar-700 underline underline-offset-4" href={`/${locale}`}>
          {dictionary.nav.newReservation}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button variant="danger" full onClick={cancel} disabled={state === 'sending'}>
        {state === 'sending' ? dictionary.cancel.cancelling : dictionary.cancel.confirmButton}
      </Button>
      <a className="block text-center text-[15px] text-ink-soft underline underline-offset-4" href={`/${locale}`}>
        {dictionary.cancel.goBack}
      </a>
    </div>
  )
}
