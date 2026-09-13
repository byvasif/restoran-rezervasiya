'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingDay } from '@/lib/reservations/calendar-days'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { fill, type Dictionary, type Locale } from '@/i18n'
import { formatDateLong } from '@/i18n/format-date'
import { DateStrip } from './DateStrip'
import { GuestForm, type GuestDetails } from './GuestForm'
import { ReviewCard } from './ReviewCard'
import { StepRail, type StepIndex } from './StepRail'
import { TimeGrid } from './TimeGrid'

interface BookingFlowProps {
  locale: Locale
  dictionary: Dictionary
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

export function BookingFlow({ locale, dictionary, restaurantName, days, telegramToken }: BookingFlowProps) {
  const router = useRouter()
  const texts = dictionary.booking

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

  const loadSlots = useCallback(
    async (selectedDate: string) => {
      setLoadingSlots(true)
      setClosedReason(null)
      try {
        const response = await fetchWithTimeout(`/api/availability?date=${selectedDate}&lang=${locale}`)
        const data = await readJson(response)

        if (!response.ok) {
          setSlots([])
          setMessage({ tone: 'error', text: (data.error as string) ?? texts.errorLoad })
          return
        }

        setSlots((data.slots as string[]) ?? [])
        setDurationMinutes((data.durationMinutes as number) ?? 60)
        if (data.closed) setClosedReason((data.reason as string) ?? texts.noSlots)
        setMessage(null)
      } catch {
        setSlots([])
        setMessage({ tone: 'error', text: texts.errorNetwork })
      } finally {
        setLoadingSlots(false)
      }
    },
    [locale, texts],
  )

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
    if (guest.firstName.trim().length < 2) errors.firstName = texts.errorFirstName
    if (guest.lastName.trim().length < 2) errors.lastName = texts.errorLastName
    if (guest.phoneNumber.replace(/\D/g, '').length < 9) errors.phoneNumber = texts.errorPhone

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
          locale,
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
        router.push(`/${locale}/ugurlu/${data.reservationCode as string}`)
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

      setMessage({ tone: 'error', text: (data.error as string) ?? texts.errorGeneric })
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
      setMessage({ tone: 'error', text: timedOut ? texts.errorTimeout : texts.errorNetwork })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <StepRail current={step} dictionary={dictionary} />

      {message ? (
        <div className="mb-5">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {step === 0 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">{texts.dateHeading}</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">{texts.dateHint}</p>
          <DateStrip days={days} selected={date} onSelect={selectDate} dictionary={dictionary} />
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">{texts.timeHeading}</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">{date ? formatDateLong(date, locale) : ''}</p>

          {loadingSlots ? (
            <p className="text-[15px] text-ink-soft">{texts.loadingSlots}</p>
          ) : closedReason ? (
            <Notice tone="warning">{closedReason}</Notice>
          ) : slots.length === 0 ? (
            <Notice tone="warning">{texts.noSlots}</Notice>
          ) : (
            <TimeGrid slots={slots} selected={time} onSelect={selectTime} dictionary={dictionary} />
          )}

          <div className="mt-6">
            <Button variant="quiet" onClick={() => setStep(0)}>
              {texts.changeDate}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">{texts.guestHeading}</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">
            {fill(texts.guestSubtitle, { date: date ? formatDateLong(date, locale) : '', time: time ?? '' })}
          </p>

          <GuestForm value={guest} errors={fieldErrors} onChange={setGuest} dictionary={dictionary} />

          <div className="mt-6 space-y-3">
            <Button
              full
              onClick={() => {
                if (validateGuest()) setStep(3)
              }}
            >
              {texts.continue}
            </Button>
            <Button variant="quiet" onClick={() => setStep(1)}>
              {texts.changeTime}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 && date && time ? (
        <section>
          <h2 className="font-display text-[22px] text-ink">{texts.reviewHeading}</h2>
          <p className="mt-1 mb-4 text-[15px] text-ink-soft">{texts.reviewSubtitle}</p>

          <ReviewCard
            restaurantName={restaurantName}
            firstName={guest.firstName.trim()}
            lastName={guest.lastName.trim()}
            phoneNumber={guest.phoneNumber.trim()}
            date={date}
            time={time}
            endTime={addMinutesToTime(time, durationMinutes)}
            locale={locale}
            dictionary={dictionary}
          />

          <div className="mt-6 space-y-3">
            <Button full onClick={confirm} disabled={submitting}>
              {submitting ? texts.confirming : texts.confirm}
            </Button>
            <Button variant="quiet" onClick={() => setStep(2)} disabled={submitting}>
              {texts.editDetails}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
