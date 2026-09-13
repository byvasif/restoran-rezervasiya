/**
 * Azərbaycanca lüğət — bütün dillərin tip mənbəyi.
 *
 * Bu fayla yeni açar əlavə edildikdə `tr` və `en` lüğətləri həmin açarı
 * verməyənə qədər layihə kompilyasiya olunmur. Beləliklə tərcüməsiz mətn
 * production-a çıxa bilmir.
 */
export const az = {
  meta: {
    title: 'Masa rezervasiyası',
    description: 'Restoranda masa rezervasiya etmək üçün tarix və saat seçin.',
    privacyTitle: 'Məxfilik siyasəti',
    privacyDescription: 'Rezervasiya zamanı toplanan məlumatlar və onların istifadəsi.',
    termsTitle: 'İstifadə şərtləri',
    termsDescription: 'Onlayn masa rezervasiyasının qaydaları.',
  },

  nav: {
    privacy: 'Məxfilik siyasəti',
    terms: 'İstifadə şərtləri',
    backToBooking: 'Rezervasiya səhifəsinə qayıt',
    newReservation: 'Yeni rezervasiya et',
    languageLabel: 'Dil',
  },

  booking: {
    intro: 'Masa rezervasiyası {minutes} dəqiqədir. Tarix və saatı seçin, adınızı yazın, rezervasiya dərhal təsdiqlənir.',
    stepNames: { date: 'Tarix', time: 'Saat', details: 'Məlumat', review: 'Təsdiq' },
    stepCounter: '{current}/{total} — {name}',

    dateHeading: 'Hansı gün gəlirsiniz?',
    dateHint: 'Bağlı günlər seçilə bilmir.',
    dateAriaLabel: 'Tarix seçimi',
    closedShort: 'bağlı',

    timeHeading: 'Saatı seçin',
    timeAriaLabel: 'Saat seçimi',
    loadingSlots: 'Boş saatlar yüklənir…',
    noSlots: 'Bu gün üçün boş saat qalmayıb. Başqa gün seçin.',
    changeDate: 'Tarixi dəyiş',

    guestHeading: 'Sizi necə tanıyaq?',
    guestSubtitle: '{date}, saat {time}',
    firstName: 'Ad',
    lastName: 'Soyad',
    phone: 'Telefon nömrəsi',
    phoneHint: 'Nümunə: {example}',
    continue: 'Davam et',
    changeTime: 'Saatı dəyiş',

    reviewHeading: 'Məlumatları yoxlayın',
    reviewSubtitle: 'Təsdiqdən sonra rezervasiya kodunuz göstəriləcək.',
    labelRestaurant: 'Restoran',
    labelName: 'Ad, soyad',
    labelPhone: 'Telefon',
    labelDate: 'Tarix',
    labelTime: 'Saat',
    labelCode: 'Rezervasiya kodu',
    confirm: 'Rezervasiyanı təsdiqlə',
    confirming: 'Təsdiqlənir…',
    editDetails: 'Məlumatları düzəlt',

    errorFirstName: 'Adınızı yazın.',
    errorLastName: 'Soyadınızı yazın.',
    errorPhone: 'Telefon nömrəsini tam yazın.',
    errorLoad: 'Saatları yükləmək mümkün olmadı.',
    errorNetwork: 'Bağlantı alınmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.',
    errorTimeout: 'Server vaxtında cavab vermədi. Rezervasiya yaradılmayıb, bir az sonra yenidən cəhd edin.',
    errorGeneric: 'Rezervasiyanı tamamlamaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.',

    hoursHeading: 'İş saatları',
    closedAllDay: 'Qapalı',
    hoursWithBreak: '{opening} – {closing} (fasilə {breakStart} – {breakEnd})',
    hoursPlain: '{opening} – {closing}',
  },

  success: {
    confirmedHeading: 'Rezervasiyanız təsdiqləndi',
    confirmedSubtitle: 'Sizi gözləyirik.',
    cancelledHeading: 'Rezervasiya ləğv edilib',
    cancelledSubtitle: 'Bu vaxt yenidən boşdur.',
    cancelHint: 'Rezervasiyanı başlanma vaxtına {hours} saat qalanadək ləğv edə bilərsiniz.',
    cancelViaTelegram: 'Ləğv linki Telegram mesajınızda göndərilib. Rezervasiyanı başlanma vaxtına {hours} saat qalanadək ləğv edə bilərsiniz.',
    cancelButton: 'Rezervasiyanı ləğv et',
  },

  cancel: {
    heading: 'Rezervasiyanı ləğv edirsiniz',
    invalidHeading: 'Bu ləğv linki etibarlı deyil',
    invalidBody: 'Link köhnəlmiş ola bilər. Telegram botuna /cancel yazaraq aktiv rezervasiyalarınızı görə bilərsiniz.',
    alreadyCancelled: 'Bu rezervasiya artıq ləğv edilib.',
    tooLate: 'Bu rezervasiyanın başlanmasına {hours} saatdan az vaxt qaldığı üçün onlayn ləğv etmək mümkün deyil. Zəhmət olmasa restoranla birbaşa əlaqə saxlayın.',
    confirmButton: 'Bəli, rezervasiyanı ləğv et',
    cancelling: 'Ləğv edilir…',
    goBack: 'Fikrimi dəyişdim, geri qayıt',
    doneNotice: 'Rezervasiyanız ləğv edildi. Bu vaxt yenidən boşdur.',
    failed: 'Ləğv etmək mümkün olmadı.',
  },

  errorPage: {
    heading: 'Nəsə alınmadı',
    body: 'Sorğunu tamamlamaq mümkün olmadı. Bir az sonra yenidən cəhd edin və ya restoranla birbaşa əlaqə saxlayın.',
    retry: 'Yenidən cəhd et',
    renderBody: 'Səhifəni göstərmək mümkün olmadı. Yenidən cəhd edin və ya restoranla birbaşa əlaqə saxlayın.',
  },

  notFound: {
    heading: 'Səhifə tapılmadı',
    body: 'Axtardığınız rezervasiya və ya səhifə mövcud deyil. Yeni rezervasiya üçün aşağıdakı linkdən istifadə edin.',
    link: 'Rezervasiya səhifəsi',
  },

  api: {
    rateLimited: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.',
    missingDate: 'Tarix göstərilməyib.',
    invalidDate: 'Tarix düzgün formatda deyil.',
    pastDate: 'Keçmiş tarix üçün rezervasiya mümkün deyil.',
    availabilityFailed: 'Saatları yükləmək mümkün olmadı. Bir az sonra yenidən cəhd edin.',
    unreadableBody: 'Sorğu məlumatı oxunmadı.',
    invalidInput: 'Daxil edilmiş məlumatlar düzgün deyil.',
    invalidSlot: 'Seçilmiş vaxt artıq əlçatan deyil. Zəhmət olmasa başqa saat seçin.',
    slotTaken: 'Bu vaxt yenicə başqa müştəri tərəfindən tutuldu. Zəhmət olmasa başqa saat seçin.',
    calendarFailed: 'Rezervasiyanı tamamlamaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
    createFailed: 'Rezervasiyanı yaratmaq mümkün olmadı. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
    invalidCode: 'Rezervasiya kodu yanlışdır.',
    notFound: 'Belə bir rezervasiya tapılmadı.',
    readFailed: 'Məlumatı yükləmək mümkün olmadı.',
    invalidCancelToken: 'Bu ləğv linki etibarlı deyil.',
    alreadyCancelled: 'Bu rezervasiya artıq ləğv edilib.',
    cancelFailed: 'Ləğv etmək mümkün olmadı. Bir az sonra yenidən cəhd edin.',
    closedWeekday: 'Bu gün restoran işləmir.',
    closedDate: 'Bu tarixdə restoran bağlıdır.',
  },

  validation: {
    nameTooShort: 'Ən azı 2 simvol olmalıdır.',
    nameTooLong: 'Ən çox 50 simvol ola bilər.',
    nameInvalid: 'Yalnız hərflər, boşluq, apostrof və defis istifadə edilə bilər.',
    phoneRequired: 'Telefon nömrəsi tələb olunur.',
    phoneInvalid: 'Telefon nömrəsi düzgün deyil. Nümunə: {example}',
    dateFormat: 'Tarix `YYYY-MM-DD` formatında olmalıdır.',
    timeFormat: 'Saat `HH:MM` formatında olmalıdır.',
    codeInvalid: 'Rezervasiya kodu yanlışdır.',
    tokenInvalid: 'Ləğv tokeni yanlışdır.',
  },

  date: {
    months: [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
    ],
    weekdays: [
      'Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə',
      'Cümə axşamı', 'Cümə', 'Şənbə',
    ],
    weekdaysShort: ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.'],
    /** `10 may 2027, Bazar ertəsi` */
    longFormat: '{day} {month} {year}, {weekday}',
    phoneExample: '050 123 45 67',
  },
}

export type Dictionary = typeof az
