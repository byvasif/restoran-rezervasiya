import type { Metadata } from 'next'
import { getSettings } from '@/config/business'
import { LegalPage } from '@/components/ui/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Məxfilik siyasəti',
  description: 'Rezervasiya zamanı toplanan məlumatlar və onların istifadəsi.',
}

export default async function PrivacyPage() {
  const settings = await getSettings()

  return (
    <LegalPage
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
      title="Məxfilik siyasəti"
      updatedAt="13 sentyabr 2026"
      intro={`Bu səhifə ${settings.restaurantName} restoranının onlayn masa rezervasiya sistemində hansı məlumatların toplandığını, nə üçün istifadə edildiyini və nə qədər saxlanıldığını izah edir.`}
      sections={[
        {
          heading: 'Hansı məlumatları toplayırıq',
          paragraphs: ['Rezervasiya yaratmaq üçün yalnız aşağıdakılar tələb olunur:'],
          bullets: [
            'Ad və soyad — masanın kimin adına saxlanıldığını bilmək üçün',
            'Telefon nömrəsi — rezervasiya ilə bağlı sizinlə əlaqə saxlamaq üçün',
            'Seçdiyiniz tarix və saat',
            'Telegram botu vasitəsilə gəlmisinizsə, Telegram istifadəçi ID-niz — təsdiq və ləğv mesajlarını göndərmək üçün',
          ],
        },
        {
          heading: 'Toplamadıqlarımız',
          paragraphs: [
            'Ödəniş və bank kartı məlumatları toplanmır — sistemdə onlayn ödəniş yoxdur. E-poçt ünvanı tələb olunmur. Yeri, cihaz izləyiciləri və reklam kukiləri istifadə edilmir.',
          ],
        },
        {
          heading: 'Məlumatlar harada saxlanılır',
          paragraphs: [
            'Rezervasiya məlumatları restoranın verilənlər bazasında saxlanılır. Eyni zamanda rezervasiya restoranın Google Calendar təqvimində tədbir kimi yaradılır — orada adınız, telefon nömrəniz və rezervasiya kodunuz göstərilir ki, restoran işçiləri sizi qarşılaya bilsin.',
            'Server loglarında telefon nömrəsi və ad maskalanmış şəkildə yazılır, açıq formada saxlanılmır.',
          ],
        },
        {
          heading: 'Kimlərlə paylaşılır',
          paragraphs: [
            'Məlumatlarınız üçüncü tərəflərə satılmır və reklam məqsədilə paylaşılmır. Yalnız sistemin işləməsi üçün zəruri xidmətlərdən istifadə olunur: rezervasiyanın təqvimə yazılması üçün Google Calendar və bildirişlərin çatdırılması üçün Telegram.',
          ],
        },
        {
          heading: 'Nə qədər saxlanılır',
          paragraphs: [
            'Rezervasiya qeydləri restoranın uçotu üçün saxlanılır. Məlumatlarınızın silinməsini istəyirsinizsə, restoranla birbaşa əlaqə saxlaya bilərsiniz.',
          ],
        },
        {
          heading: 'Rezervasiyanın ləğvi',
          paragraphs: [
            `Rezervasiyanı başlanma vaxtına ən azı ${settings.cancellationDeadlineHours} saat qalanadək təsdiq mesajındakı ləğv linki ilə özünüz ləğv edə bilərsiniz. Ləğv edildikdə tədbir təqvimdən silinir və həmin vaxt yenidən sərbəst olur.`,
          ],
        },
        {
          heading: 'Əlaqə',
          paragraphs: [
            `Məlumatlarınızla bağlı hər hansı sualınız olarsa, ${settings.restaurantName} restoranı ilə birbaşa əlaqə saxlayın${settings.restaurantAddress ? ` (${settings.restaurantAddress})` : ''}.`,
          ],
        },
      ]}
    />
  )
}
