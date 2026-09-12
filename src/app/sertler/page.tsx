import type { Metadata } from 'next'
import { getSettings } from '@/config/business'
import { LegalPage } from '@/components/ui/LegalPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'İstifadə şərtləri',
  description: 'Onlayn masa rezervasiyasının qaydaları.',
}

export default async function TermsPage() {
  const settings = await getSettings()

  return (
    <LegalPage
      restaurantName={settings.restaurantName}
      restaurantAddress={settings.restaurantAddress}
      title="İstifadə şərtləri"
      updatedAt="13 sentyabr 2026"
      intro={`Bu səhifə ${settings.restaurantName} restoranının onlayn rezervasiya səhifəsindən istifadə qaydalarını izah edir. Rezervasiya yaratmaqla bu şərtləri qəbul etmiş olursunuz.`}
      sections={[
        {
          heading: 'Rezervasiya',
          paragraphs: [
            `Hər rezervasiya ${settings.bookingDurationMinutes} dəqiqəlik vaxt aralığı üçündür. Yalnız restoranın iş saatları daxilində və boş olan vaxtlar seçilə bilər; keçmiş tarixlər və bağlı günlər üçün rezervasiya mümkün deyil.`,
            'Rezervasiya təsdiqləndikdən sonra sizə unikal rezervasiya kodu verilir. Restorana gəldiyinizdə həmin kodu göstərməyiniz kifayətdir.',
          ],
        },
        {
          heading: 'Ləğv',
          paragraphs: [
            `Rezervasiyanı başlanma vaxtına ən azı ${settings.cancellationDeadlineHours} saat qalanadək təsdiq mesajındakı ləğv linki ilə ləğv edə bilərsiniz.`,
            `${settings.cancellationDeadlineHours} saatdan az vaxt qaldıqda onlayn ləğv bağlanır — belə halda restoranla birbaşa əlaqə saxlayın.`,
          ],
        },
        {
          heading: 'Gecikmə və gəlməmə',
          paragraphs: [
            'Rezervasiya olunmuş vaxtda gəlmədiyiniz təqdirdə masa müəyyən gözləmə müddətindən sonra sərbəst buraxıla bilər. Gecikəcəyinizi bilirsinizsə, restorana xəbər verməyiniz xahiş olunur.',
          ],
        },
        {
          heading: 'Düzgün məlumat',
          paragraphs: [
            'Ad, soyad və telefon nömrəsinin düzgün yazılması vacibdir — əlaqə yalnız həmin nömrə üzərindən qurulur. Yanlış və ya başqasına aid məlumatla edilən rezervasiya restoran tərəfindən ləğv edilə bilər.',
          ],
        },
        {
          heading: 'Xidmətin əlçatanlığı',
          paragraphs: [
            'Sistem fasiləsiz işləmək üçün qurulub, lakin texniki səbəblərdən müvəqqəti əlçatmaz ola bilər. Belə hallarda rezervasiya üçün restoranla birbaşa əlaqə saxlaya bilərsiniz.',
            'Ödəniş sistemi yoxdur — rezervasiya üçün heç bir ödəniş tələb olunmur.',
          ],
        },
        {
          heading: 'Əlaqə',
          paragraphs: [
            `Suallarınız üçün ${settings.restaurantName} restoranı ilə əlaqə saxlayın${settings.restaurantAddress ? ` (${settings.restaurantAddress})` : ''}.`,
          ],
        },
      ]}
    />
  )
}
