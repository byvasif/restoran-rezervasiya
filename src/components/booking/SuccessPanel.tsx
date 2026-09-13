'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { fill, type Dictionary } from '@/i18n'

/**
 * Ləğv linki URL-də daşınmır — rezervasiyanı yaradan brauzer onu
 * sessionStorage-dən oxuyur. Link həmçinin Telegram mesajında gəlir.
 */
export function SuccessPanel({
  reservationCode,
  deadlineHours,
  dictionary,
}: {
  reservationCode: string
  deadlineHours: number
  dictionary: Dictionary
}) {
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
        {fill(dictionary.success.cancelViaTelegram, { hours: deadlineHours })}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        {fill(dictionary.success.cancelHint, { hours: deadlineHours })}
      </p>
      <Button variant="danger" full onClick={() => window.location.assign(cancelUrl)}>
        {dictionary.success.cancelButton}
      </Button>
    </div>
  )
}
