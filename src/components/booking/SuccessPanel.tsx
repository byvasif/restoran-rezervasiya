'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Ləğv linki URL-də daşınmır — rezervasiyanı yaradan brauzer onu
 * sessionStorage-dən oxuyur. Link həmçinin Telegram mesajında gəlir.
 */
export function SuccessPanel({ reservationCode, deadlineHours }: { reservationCode: string; deadlineHours: number }) {
  const [cancelUrl, setCancelUrl] = useState<string | null>(null)

  useEffect(() => {
    try {
      setCancelUrl(sessionStorage.getItem(`rezervasiya:${reservationCode}`))
    } catch {
      setCancelUrl(null)
    }
  }, [reservationCode])

  if (!cancelUrl) {
    return (
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Ləğv linki Telegram mesajınızda göndərilib. Rezervasiyanı başlanma vaxtına {deadlineHours} saat qalanadək ləğv
        edə bilərsiniz.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Rezervasiyanı başlanma vaxtına {deadlineHours} saat qalanadək ləğv edə bilərsiniz.
      </p>
      <Button variant="danger" full onClick={() => window.location.assign(cancelUrl)}>
        Rezervasiyanı ləğv et
      </Button>
    </div>
  )
}
