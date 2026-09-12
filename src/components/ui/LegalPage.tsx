import { PageShell } from './PageShell'

export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

/** Məxfilik siyasəti və istifadə şərtləri üçün ümumi tərtibat. */
export function LegalPage({
  restaurantName,
  restaurantAddress,
  title,
  updatedAt,
  intro,
  sections,
}: {
  restaurantName: string
  restaurantAddress?: string
  title: string
  updatedAt: string
  intro: string
  sections: LegalSection[]
}) {
  return (
    <PageShell restaurantName={restaurantName} restaurantAddress={restaurantAddress}>
      <h2 className="font-display text-[26px] leading-tight text-ink">{title}</h2>
      <p className="mt-1 text-[13px] text-ink-soft">Son yenilənmə: {updatedAt}</p>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">{intro}</p>

      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h3 className="font-display text-[19px] text-ink">{section.heading}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-3 space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-soft">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="list-disc">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <a className="mt-10 inline-block text-[15px] text-nar-700 underline underline-offset-4" href="/">
        Rezervasiya səhifəsinə qayıt
      </a>
    </PageShell>
  )
}
