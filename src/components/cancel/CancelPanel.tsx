'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'

interface CancelPanelProps {
  reservationCode: string
  token: string
}

export function CancelPanel({ reservationCode, token }: CancelPanelProps) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setState('sending')
    setError(null)

    try {
      const response = await fetch(`/api/reservations/${reservationCode}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()

      if (response.ok) {
        setState('done')
        return
      }

      setError(data.error ?? 'Ləğv etmək mümkün olmadı.')
      setState('idle')
    } catch {
      setError('Bağlantı alınmadı. Bir az sonra yenidən cəhd edin.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-4">
        <Notice tone="success">Rezervasiyanız ləğv edildi. Bu vaxt yenidən boşdur.</Notice>
        <a className="inline-block text-[15px] text-nar-700 underline underline-offset-4" href="/">
          Yeni rezervasiya et
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button variant="danger" full onClick={cancel} disabled={state === 'sending'}>
        {state === 'sending' ? 'Ləğv edilir…' : 'Bəli, rezervasiyanı ləğv et'}
      </Button>
      <a className="block text-center text-[15px] text-ink-soft underline underline-offset-4" href="/">
        Fikrimi dəyişdim, geri qayıt
      </a>
    </div>
  )
}
