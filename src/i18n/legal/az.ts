export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalDocument {
  title: string
  updatedAt: string
  intro: string
  sections: LegalSection[]
}

export interface LegalContent {
  privacy: LegalDocument
  terms: LegalDocument
}

/**
 * Hüquqi mətnlər ayrıca saxlanılır: bu mətnlər yalnız server komponentlərində
 * göstərilir və rezervasiya axınının klient paketinə düşmür.
 * `{restaurant}`, `{address}`, `{hours}`, `{minutes}` render zamanı doldurulur.
 */
export const legalAz: LegalContent = {
  privacy: {
    title: 'Məxfilik siyasəti',
    updatedAt: '13 sentyabr 2026',
    intro:
      'Bu səhifə {restaurant} restoranının onlayn masa rezervasiya sistemində hansı məlumatların toplandığını, nə üçün istifadə edildiyini və nə qədər saxlanıldığını izah edir.',
    sections: [
      {
        heading: 'Hansı məlumatları toplayırıq',
        paragraphs: ['Rezervasiya yaratmaq üçün yalnız aşağıdakılar tələb olunur:'],
        bullets: [
          'Ad və soyad, masanın kimin adına saxlanıldığını bilmək üçün',
          'Telefon nömrəsi, rezervasiya ilə bağlı sizinlə əlaqə saxlamaq üçün',
          'Seçdiyiniz tarix və saat',
          'Telegram botu vasitəsilə gəlmisinizsə, Telegram istifadəçi ID-niz, təsdiq və ləğv mesajlarını göndərmək üçün',
        ],
      },
      {
        heading: 'Toplamadıqlarımız',
        paragraphs: [
          'Ödəniş və bank kartı məlumatları toplanmır, sistemdə onlayn ödəniş yoxdur. E-poçt ünvanı tələb olunmur. Yer, cihaz izləyiciləri və reklam kukiləri istifadə edilmir.',
        ],
      },
      {
        heading: 'Məlumatlar harada saxlanılır',
        paragraphs: [
          'Rezervasiya məlumatları restoranın verilənlər bazasında saxlanılır. Eyni zamanda rezervasiya restoranın Google Calendar təqvimində tədbir kimi yaradılır: orada adınız, telefon nömrəniz və rezervasiya kodunuz göstərilir ki, restoran işçiləri sizi qarşılaya bilsin.',
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
          'Rezervasiyanı başlanma vaxtına ən azı {hours} saat qalanadək təsdiq mesajındakı ləğv linki ilə özünüz ləğv edə bilərsiniz. Ləğv edildikdə tədbir təqvimdən silinir və həmin vaxt yenidən sərbəst olur.',
        ],
      },
      {
        heading: 'Əlaqə',
        paragraphs: [
          'Məlumatlarınızla bağlı sualınız olarsa, {restaurant} restoranı ilə birbaşa əlaqə saxlayın. {address}',
        ],
      },
    ],
  },

  terms: {
    title: 'İstifadə şərtləri',
    updatedAt: '13 sentyabr 2026',
    intro:
      'Bu səhifə {restaurant} restoranının onlayn rezervasiya səhifəsindən istifadə qaydalarını izah edir. Rezervasiya yaratmaqla bu şərtləri qəbul etmiş olursunuz.',
    sections: [
      {
        heading: 'Rezervasiya',
        paragraphs: [
          'Hər rezervasiya {minutes} dəqiqəlik vaxt aralığı üçündür. Yalnız restoranın iş saatları daxilində və boş olan vaxtlar seçilə bilər; keçmiş tarixlər və bağlı günlər üçün rezervasiya mümkün deyil.',
          'Rezervasiya təsdiqləndikdən sonra sizə unikal rezervasiya kodu verilir. Restorana gəldiyinizdə həmin kodu göstərməyiniz kifayətdir.',
        ],
      },
      {
        heading: 'Ləğv',
        paragraphs: [
          'Rezervasiyanı başlanma vaxtına ən azı {hours} saat qalanadək təsdiq mesajındakı ləğv linki ilə ləğv edə bilərsiniz.',
          '{hours} saatdan az vaxt qaldıqda onlayn ləğv bağlanır: belə halda restoranla birbaşa əlaqə saxlayın.',
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
          'Ad, soyad və telefon nömrəsinin düzgün yazılması vacibdir, əlaqə yalnız həmin nömrə üzərindən qurulur. Yanlış və ya başqasına aid məlumatla edilən rezervasiya restoran tərəfindən ləğv edilə bilər.',
        ],
      },
      {
        heading: 'Xidmətin əlçatanlığı',
        paragraphs: [
          'Sistem fasiləsiz işləmək üçün qurulub, lakin texniki səbəblərdən müvəqqəti əlçatmaz ola bilər. Belə hallarda rezervasiya üçün restoranla birbaşa əlaqə saxlaya bilərsiniz.',
          'Ödəniş sistemi yoxdur, rezervasiya üçün heç bir ödəniş tələb olunmur.',
        ],
      },
      {
        heading: 'Əlaqə',
        paragraphs: ['Suallarınız üçün {restaurant} restoranı ilə əlaqə saxlayın. {address}'],
      },
    ],
  },
}
