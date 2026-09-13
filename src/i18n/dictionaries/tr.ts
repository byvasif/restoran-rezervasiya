import type { Dictionary } from './az'

/** Türkçe sözlük. Açar əskik olsa TypeScript xəta verir. */
export const tr: Dictionary = {
  meta: {
    title: 'Masa rezervasyonu',
    description: 'Restoranda masa ayırtmak için tarih ve saat seçin.',
    privacyTitle: 'Gizlilik politikası',
    privacyDescription: 'Rezervasyon sırasında toplanan veriler ve nasıl kullanıldıkları.',
    termsTitle: 'Kullanım koşulları',
    termsDescription: 'Çevrimiçi masa rezervasyonunun kuralları.',
  },

  nav: {
    privacy: 'Gizlilik politikası',
    terms: 'Kullanım koşulları',
    backToBooking: 'Rezervasyon sayfasına dön',
    newReservation: 'Yeni rezervasyon yap',
    languageLabel: 'Dil',
  },

  booking: {
    intro: 'Masa rezervasyonu {minutes} dakikadır. Tarih ve saati seçin, adınızı yazın, rezervasyon hemen onaylanır.',
    stepNames: { date: 'Tarih', time: 'Saat', details: 'Bilgiler', review: 'Onay' },
    stepCounter: '{current}/{total} — {name}',

    dateHeading: 'Hangi gün geliyorsunuz?',
    dateHint: 'Kapalı günler seçilemez.',
    dateAriaLabel: 'Tarih seçimi',
    closedShort: 'kapalı',

    timeHeading: 'Saati seçin',
    timeAriaLabel: 'Saat seçimi',
    loadingSlots: 'Boş saatler yükleniyor…',
    noSlots: 'Bu gün için boş saat kalmadı. Başka bir gün seçin.',
    changeDate: 'Tarihi değiştir',

    guestHeading: 'Sizi nasıl kaydedelim?',
    guestSubtitle: '{date}, saat {time}',
    firstName: 'Ad',
    lastName: 'Soyad',
    phone: 'Telefon numarası',
    phoneHint: 'Örnek: {example}',
    continue: 'Devam et',
    changeTime: 'Saati değiştir',

    reviewHeading: 'Bilgileri kontrol edin',
    reviewSubtitle: 'Onaydan sonra rezervasyon kodunuz gösterilecek.',
    labelRestaurant: 'Restoran',
    labelName: 'Ad, soyad',
    labelPhone: 'Telefon',
    labelDate: 'Tarih',
    labelTime: 'Saat',
    labelCode: 'Rezervasyon kodu',
    confirm: 'Rezervasyonu onayla',
    confirming: 'Onaylanıyor…',
    editDetails: 'Bilgileri düzelt',

    errorFirstName: 'Adınızı yazın.',
    errorLastName: 'Soyadınızı yazın.',
    errorPhone: 'Telefon numarasını eksiksiz yazın.',
    errorLoad: 'Saatler yüklenemedi.',
    errorNetwork: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    errorTimeout: 'Sunucu zamanında yanıt vermedi. Rezervasyon oluşturulmadı, biraz sonra tekrar deneyin.',
    errorGeneric: 'Rezervasyon tamamlanamadı. Lütfen biraz sonra tekrar deneyin.',

    hoursHeading: 'Çalışma saatleri',
    closedAllDay: 'Kapalı',
    hoursWithBreak: '{opening} – {closing} (mola {breakStart} – {breakEnd})',
    hoursPlain: '{opening} – {closing}',
  },

  success: {
    confirmedHeading: 'Rezervasyonunuz onaylandı',
    confirmedSubtitle: 'Sizi bekliyoruz.',
    cancelledHeading: 'Rezervasyon iptal edildi',
    cancelledSubtitle: 'Bu saat yeniden boşta.',
    cancelHint: 'Rezervasyonu başlama saatine {hours} saat kalana kadar iptal edebilirsiniz.',
    cancelViaTelegram: 'İptal bağlantısı Telegram mesajınızda gönderildi. Rezervasyonu başlama saatine {hours} saat kalana kadar iptal edebilirsiniz.',
    cancelButton: 'Rezervasyonu iptal et',
  },

  cancel: {
    heading: 'Rezervasyonu iptal ediyorsunuz',
    invalidHeading: 'Bu iptal bağlantısı geçerli değil',
    invalidBody: 'Bağlantı eskimiş olabilir. Telegram botuna /cancel yazarak aktif rezervasyonlarınızı görebilirsiniz.',
    alreadyCancelled: 'Bu rezervasyon zaten iptal edilmiş.',
    tooLate: 'Bu rezervasyonun başlamasına {hours} saatten az kaldığı için çevrimiçi iptal mümkün değil. Lütfen restoranla doğrudan iletişime geçin.',
    confirmButton: 'Evet, rezervasyonu iptal et',
    cancelling: 'İptal ediliyor…',
    goBack: 'Vazgeçtim, geri dön',
    doneNotice: 'Rezervasyonunuz iptal edildi. Bu saat yeniden boşta.',
    failed: 'İptal edilemedi.',
  },

  errorPage: {
    heading: 'Bir şeyler ters gitti',
    body: 'İstek tamamlanamadı. Biraz sonra tekrar deneyin veya restoranla doğrudan iletişime geçin.',
    retry: 'Tekrar dene',
    renderBody: 'Sayfa gösterilemedi. Tekrar deneyin veya restoranla doğrudan iletişime geçin.',
  },

  notFound: {
    heading: 'Sayfa bulunamadı',
    body: 'Aradığınız rezervasyon veya sayfa mevcut değil. Yeni rezervasyon için aşağıdaki bağlantıyı kullanın.',
    link: 'Rezervasyon sayfası',
  },

  api: {
    rateLimited: 'Çok fazla istek gönderildi. Biraz sonra tekrar deneyin.',
    missingDate: 'Tarih belirtilmedi.',
    invalidDate: 'Tarih biçimi geçerli değil.',
    pastDate: 'Geçmiş bir tarih için rezervasyon yapılamaz.',
    availabilityFailed: 'Saatler yüklenemedi. Biraz sonra tekrar deneyin.',
    unreadableBody: 'İstek verisi okunamadı.',
    invalidInput: 'Girilen bilgiler geçerli değil.',
    invalidSlot: 'Seçilen saat artık müsait değil. Lütfen başka bir saat seçin.',
    slotTaken: 'Bu saat az önce başka bir müşteri tarafından alındı. Lütfen başka bir saat seçin.',
    calendarFailed: 'Rezervasyon tamamlanamadı. Lütfen biraz sonra tekrar deneyin.',
    createFailed: 'Rezervasyon oluşturulamadı. Lütfen biraz sonra tekrar deneyin.',
    invalidCode: 'Rezervasyon kodu hatalı.',
    notFound: 'Böyle bir rezervasyon bulunamadı.',
    readFailed: 'Bilgi yüklenemedi.',
    invalidCancelToken: 'Bu iptal bağlantısı geçerli değil.',
    alreadyCancelled: 'Bu rezervasyon zaten iptal edilmiş.',
    cancelFailed: 'İptal edilemedi. Biraz sonra tekrar deneyin.',
    closedWeekday: 'Bu gün restoran çalışmıyor.',
    closedDate: 'Bu tarihte restoran kapalı.',
  },

  validation: {
    nameTooShort: 'En az 2 karakter olmalı.',
    nameTooLong: 'En fazla 50 karakter olabilir.',
    nameInvalid: 'Yalnızca harf, boşluk, kesme işareti ve tire kullanılabilir.',
    phoneRequired: 'Telefon numarası gerekli.',
    phoneInvalid: 'Telefon numarası geçerli değil. Örnek: {example}',
    dateFormat: 'Tarih `YYYY-MM-DD` biçiminde olmalı.',
    timeFormat: 'Saat `HH:MM` biçiminde olmalı.',
    codeInvalid: 'Rezervasyon kodu hatalı.',
    tokenInvalid: 'İptal anahtarı hatalı.',
  },

  date: {
    months: [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ],
    weekdays: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    weekdaysShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    /** `10 Mayıs 2027, Pazartesi` */
    longFormat: '{day} {month} {year}, {weekday}',
    phoneExample: '0555 123 45 67',
  },
}
