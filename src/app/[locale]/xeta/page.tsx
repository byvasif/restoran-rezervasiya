import { getSettings } from '@/config/business'
import { getDictionary, toLocale } from '@/i18n'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/** Gözlənilməz xəta halları üçün sadə səhifə. */
export default async function ErrorPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale)
  const dictionary = getDictionary(locale)
  const settings = await getSettings()

  return (
    <PageShell
      locale={locale}
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
    >
      <h2 className="font-display text-[24px] text-ink">{dictionary.errorPage.heading}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{dictionary.errorPage.body}</p>
      <a className="mt-5 inline-block text-[15px] text-nar-700 underline underline-offset-4" href={`/${locale}`}>
        {dictionary.nav.backToBooking}
      </a>
    </PageShell>
  )
}
