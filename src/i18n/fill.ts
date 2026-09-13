/**
 * Lüğət mətnlərindəki `{açar}` yerlərini doldurur.
 *
 * Lüğətlərdə funksiya deyil, adi sətirlər saxlanılır — belə olanda lüğət server
 * komponentindən klient komponentinə olduğu kimi ötürülə bilir və yalnız aktiv
 * dilin mətnləri brauzerə düşür.
 */
export function fill(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}
