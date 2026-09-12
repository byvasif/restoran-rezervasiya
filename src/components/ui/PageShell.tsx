/** Bütün səhifələrin ümumi çərçivəsi: nar rəngli başlıq lenti və kağız gövdə. */
export function PageShell({
  restaurantName,
  restaurantAddress,
  children,
}: {
  restaurantName: string
  restaurantAddress?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-nar-900 px-5 pb-7 pt-8 text-paper">
        <div className="mx-auto max-w-[560px]">
          <h1 className="font-display text-[30px] leading-tight">{restaurantName}</h1>
          {restaurantAddress ? <p className="mt-1 text-[14px] text-nar-100/80">{restaurantAddress}</p> : null}
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-5 pt-7">{children}</main>

      <footer className="mx-auto max-w-[560px] px-5 pb-12 pt-10">
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-sand-dark pt-5 text-[14px] text-ink-soft">
          <a className="underline underline-offset-4" href="/mexfilik">
            Məxfilik siyasəti
          </a>
          <a className="underline underline-offset-4" href="/sertler">
            İstifadə şərtləri
          </a>
        </div>
      </footer>
    </div>
  )
}
