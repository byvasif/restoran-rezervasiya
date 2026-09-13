import type { Metadata } from 'next'
import { getSettings } from '@/config/business'
import { getDictionary, toLocale } from '@/i18n'
import { getLegalContent } from '@/i18n/legal'
import { LegalPage } from '@/components/ui/LegalPage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const dictionary = getDictionary(toLocale((await params).locale))
  return { title: dictionary.meta.privacyTitle, description: dictionary.meta.privacyDescription }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale)
  const settings = await getSettings()

  return (
    <LegalPage
      locale={locale}
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
      document={getLegalContent(locale).privacy}
      vars={{
        restaurant: settings.restaurantName,
        address: settings.restaurantAddress,
        hours: settings.cancellationDeadlineHours,
        minutes: settings.bookingDurationMinutes,
      }}
    />
  )
}
