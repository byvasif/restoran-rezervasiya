'use client'

import { useEffect } from 'react'

/** Gözlənilməz client/server xətalarında istifadəçiyə texniki detal göstərilmir. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: 'error', scope: 'app.render', digest: error.digest }))
  }, [error])

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-nar-900 px-5 pb-7 pt-8 text-paper">
        <div className="mx-auto max-w-[560px]">
          <h1 className="font-display text-[30px] leading-tight">Nəsə alınmadı</h1>
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-5 pt-7">
        <p className="text-[15px] leading-relaxed text-ink-soft">
          Səhifəni göstərmək mümkün olmadı. Yenidən cəhd edin və ya restoranla birbaşa əlaqə saxlayın.
        </p>
        <button
          onClick={reset}
          className="mt-5 min-h-[52px] rounded-lg bg-nar-700 px-6 text-[17px] font-semibold text-paper"
        >
          Yenidən cəhd et
        </button>
      </main>
    </div>
  )
}
