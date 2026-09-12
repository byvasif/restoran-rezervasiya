'use client'

export interface GuestDetails {
  firstName: string
  lastName: string
  phoneNumber: string
}

interface GuestFormProps {
  value: GuestDetails
  errors: Partial<Record<keyof GuestDetails, string>>
  onChange: (value: GuestDetails) => void
}

const FIELDS: Array<{ name: keyof GuestDetails; label: string; type: string; hint?: string; autoComplete: string }> = [
  { name: 'firstName', label: 'Ad', type: 'text', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Soyad', type: 'text', autoComplete: 'family-name' },
  {
    name: 'phoneNumber',
    label: 'Telefon nömrəsi',
    type: 'tel',
    hint: 'Nümunə: 050 123 45 67',
    autoComplete: 'tel',
  },
]

export function GuestForm({ value, errors, onChange }: GuestFormProps) {
  return (
    <div className="space-y-4">
      {FIELDS.map((field) => (
        <label key={field.name} className="block">
          <span className="mb-1.5 block text-[15px] text-ink">{field.label}</span>
          <input
            type={field.type}
            name={field.name}
            value={value[field.name]}
            autoComplete={field.autoComplete}
            inputMode={field.name === 'phoneNumber' ? 'tel' : 'text'}
            onChange={(event) => onChange({ ...value, [field.name]: event.target.value })}
            className={`h-12 w-full rounded-lg border bg-paper px-3.5 text-ink placeholder:text-sand-dark ${
              errors[field.name] ? 'border-nar-500' : 'border-sand-dark'
            }`}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
          />
          {errors[field.name] ? (
            <span id={`${field.name}-error`} className="mt-1 block text-[13px] text-nar-500">
              {errors[field.name]}
            </span>
          ) : field.hint ? (
            <span className="mt-1 block text-[13px] text-ink-soft">{field.hint}</span>
          ) : null}
        </label>
      ))}
    </div>
  )
}
