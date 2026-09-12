import { getSettings } from '@/config/business'
import { PageShell } from '@/components/ui/PageShell'

export const dynamic = 'force-dynamic'

/** Gözlənilməz xəta halları üçün sadə səhifə. */
export default async function ErrorPage() {
  const settings = await getSettings()

  return (
    <PageShell restaurantName={settings.restaurantName} restaurantAddress={settings.restaurantAddress}>
      <h2 className="font-display text-[24px] text-ink">Nəsə alınmadı</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        Sorğunu tamamlamaq mümkün olmadı. Bir az sonra yenidən cəhd edin və ya restoranla birbaşa əlaqə saxlayın.
      </p>
      <a className="mt-5 inline-block text-[15px] text-nar-700 underline underline-offset-4" href="/">
        Rezervasiya səhifəsinə qayıt
      </a>
    </PageShell>
  )
}
