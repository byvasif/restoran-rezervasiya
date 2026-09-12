import type { Metadata, Viewport } from 'next'
import { Source_Serif_4 } from 'next/font/google'
import './globals.css'

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Masa rezervasiyası',
  description: 'Restoranda masa rezervasiya etmək üçün tarix və saat seçin.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6E1023',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={sourceSerif.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
