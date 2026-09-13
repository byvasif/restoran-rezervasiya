import { headers } from 'next/headers'
import { getDictionary, toLocale } from '@/i18n'

export default async function NotFound() {
  const locale = toLocale((await headers()).get('x-locale'))
  const dictionary = getDictionary(locale)

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-nar-900 px-5 pb-7 pt-8 text-paper">
        <div className="mx-auto max-w-[560px]">
          <h1 className="font-display text-[30px] leading-tight">{dictionary.notFound.heading}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-5 pt-7">
        <p className="text-[15px] leading-relaxed text-ink-soft">{dictionary.notFound.body}</p>
        <a className="mt-5 inline-block text-[15px] text-nar-700 underline underline-offset-4" href={`/${locale}`}>
          {dictionary.notFound.link}
        </a>
      </main>
    </div>
  )
}
