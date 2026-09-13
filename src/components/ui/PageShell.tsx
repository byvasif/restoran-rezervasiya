import { getDictionary, type Locale } from '@/i18n'
import { LocaleSwitcher } from './LocaleSwitcher'

/** Bütün səhifələrin ümumi çərçivəsi: nar rəngli başlıq lenti və kağız gövdə. */
export function PageShell({
  locale,
  restaurantName,
  restaurantAddress,
  children,
}: {
  locale: Locale
  restaurantName: string
  restaurantAddress?: string
  children: React.ReactNode
}) {
  const dictionary = getDictionary(locale)

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-nar-900 px-5 pb-7 pt-6 text-paper">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-4 flex justify-end">
            <LocaleSwitcher current={locale} label={dictionary.nav.languageLabel} />
          </div>
          <h1 className="font-display text-[30px] leading-tight">{restaurantName}</h1>
          {restaurantAddress ? <p className="mt-1 text-[14px] text-nar-100/80">{restaurantAddress}</p> : null}
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-5 pt-7">{children}</main>

      <footer className="mx-auto max-w-[560px] px-5 pb-12 pt-10">
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-sand-dark pt-5 text-[14px] text-ink-soft">
          <a className="underline underline-offset-4" href={`/${locale}/mexfilik`}>
            {dictionary.nav.privacy}
          </a>
          <a className="underline underline-offset-4" href={`/${locale}/sertler`}>
            {dictionary.nav.terms}
          </a>
        </div>
      </footer>
    </div>
  )
}
