'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingDay } from '@/lib/reservations/calendar-days'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { formatDateAz } from '@/lib/time/format-az'
import { DateStrip } from './DateStrip'
import { GuestForm, type GuestDetails } from './GuestForm'
import { ReviewCard } from './ReviewCard'
import { StepRail, type StepIndex } from './StepRail'
import { TimeGrid } from './TimeGrid'

interface BookingFlowProps {
  restaurantName: string
  days: BookingDay[]
  telegramToken?: string
}

const EMPTY_GUEST: GuestDetails = { firstName: '', lastName: '', phoneNumber: '' }

/** Server cavabı JSON olmasa (proxy xəta səhifəsi və s.) axını dağıtmır. */
async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Sorğu bu müddətdən çox çəkərsə istifadəçi sonsuz gözləmir. */
const REQUEST_TIMEOUT_MS = 30_000

function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function BookingFlow({ restaurantName, days, telegramToken }: BookingFlowProps) {
  const router = useRouter()

  const [step, setStep] = useState<StepIndex>(0)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [guest, setGuest] = useState<GuestDetails>(EMPTY_GUEST)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({})

  const [slots, setSlots] = useState<string[]>([])
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [closedReason, setClosedReason] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'warning'; text: string } | null>(null)

  const loadSlots = useCallback(async (selectedDate: string) => {
    setLoadingSlots(true)
    setClosedReason(null)
    try {
      const response = await fetchWithTimeout(`/api/availability?date=${selectedDate}`)
      const data = await readJson(response)

      if (!response.ok) {
        setSlots([])
        setMessage({ tone: 'error', text: (data.error as string) ?? 'Saatları yükləmək mümkün olmadı.' })
        return
      }

      setSlots((data.slots as string[]) ?? [])
      setDurationMinutes((data.durationMinutes as number) ?? 60)
      if (data.closed) setClosedReason((data.reason as string) ?? 'Bu tarixdə restoran bağlıdır.')
      setMessage(null)
    } catch {
      setSlots([])
      setMessage({ tone: 'error', text: 'Bağlantı alınmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.' })
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    if (date) void loadSlots(date)
  }, [date, loadSlots])

  function selectDate(value: string) {
    setDate(value)
    setTime(null)
    setStep(1)
  }

  function selectTime(value: string) {
    setTime(value)
    setStep(2)
  }

  function validateGuest(): boolean {
    const errors: Partial<Record<keyof GuestDetails, string>> = {}
    if (guest.firstName.trim().length < 2) errors.firstName = 'Adınızı yazın.'
    if (guest.lastName.trim().length < 2) errors.lastName = 'Soyadınızı yazın.'
    if (guest.phoneNumber.replace(/\D/g, '').length < 9) errors.phoneNumber = 'Telefon nömrəsini tam yazın.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function confirm() {
    if (!date || !time) return
    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetchWithTimeout('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          date,
          time,
          telegramToken,
          idempotencyKey: crypto.randomUUID(),
        }),
      })

      const data = await readJson(response)

      if (response.status === 201) {
        try {
          sessionStorage.setItem(`rezervasiya:${data.reservationCode}`, data.cancelUrl as string)
        } catch {
          // sessionStorage əlçatmazdırsa ləğv linki yalnız Telegram mesajında qalır.
        }
        router.push(`/ugurlu/${data.reservationCode as string}`)
        return
      }

      if (response.status === 409) {
        setMessage({ tone: 'warning', text: data.error as string })
        setTime(null)
        setStep(1)
        if (date) void loadSlots(date)
        return
      }

      if (response.status === 400 && data.fields) {
        const fields = data.fields as Record<string, string>
        setFieldErrors({
          firstName: fields.firstName,
          lastName: fields.lastName,
          phoneNumber: fields.phoneNumber,
        })
        setStep(2)
        return
      }

      setMessage({
        tone: 'error',
        text:
          (data.error as string) ??
          'Rezervasiyanı tamamlamaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
      })
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
      setMessage({
        tone: 'error',
        text: timedOut
          ? 'Server vaxtında cavab vermədi. Rezervasiya yaradılmayıb — bir az sonra yenidən cəhd edin.'
          : 'Bağlantı alınmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <StepRail current={step} />

      {message ? (
        <div className="mb-5">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {step === 0 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">Hansı gün gəlirsiniz?</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">Bağlı günlər seçilə bilmir.</p>
          <DateStrip days={days} selected={date} onSelect={selectDate} />
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">Saatı seçin</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">{date ? formatDateAz(date) : ''}</p>

          {loadingSlots ? (
            <p className="text-[15px] text-ink-soft">Boş saatlar yüklənir…</p>
          ) : closedReason ? (
            <Notice tone="warning">{closedReason}</Notice>
          ) : slots.length === 0 ? (
            <Notice tone="warning">Bu gün üçün boş saat qalmayıb. Başqa gün seçin.</Notice>
          ) : (
            <TimeGrid slots={slots} selected={time} onSelect={selectTime} />
          )}

          <div className="mt-6">
            <Button variant="quiet" onClick={() => setStep(0)}>
              Tarixi dəyiş
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">Sizi necə tanıyaq?</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">
            {date ? formatDateAz(date) : ''}, saat {time}
          </p>

          <GuestForm value={guest} errors={fieldErrors} onChange={setGuest} />

          <div className="mt-6 space-y-3">
            <Button
              full
              onClick={() => {
                if (validateGuest()) setStep(3)
              }}
            >
              Davam et
            </Button>
            <Button variant="quiet" onClick={() => setStep(1)}>
              Saatı dəyiş
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 && date && time ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">Məlumatları yoxlayın</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">Təsdiqdən sonra rezervasiya kodunuz göstəriləcək.</p>

          <ReviewCard
            restaurantName={restaurantName}
            firstName={guest.firstName.trim()}
            lastName={guest.lastName.trim()}
            phoneNumber={guest.phoneNumber.trim()}
            date={date}
            time={time}
            endTime={addMinutesToTime(time, durationMinutes)}
          />

          <div className="mt-6 space-y-3">
            <Button full onClick={confirm} disabled={submitting}>
              {submitting ? 'Təsdiqlənir…' : 'Rezervasiyanı təsdiqlə'}
            </Button>
            <Button variant="quiet" onClick={() => setStep(2)} disabled={submitting}>
              Məlumatları düzəlt
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
