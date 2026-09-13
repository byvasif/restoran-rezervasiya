import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Source_Serif_4 } from 'next/font/google'
import { getDictionary, toLocale } from '@/i18n'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
})

/** Başlıq və təsvir aktiv dildə verilir — dil middleware-dən gələn başlıqdadır. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = toLocale((await headers()).get('x-locale'))
  const dictionary = getDictionary(locale)

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6E1023',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = toLocale((await headers()).get('x-locale'))

  return (
    <html lang={locale} className={sourceSerif.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
