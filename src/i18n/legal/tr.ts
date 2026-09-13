import type { LegalContent } from './az'

export const legalTr: LegalContent = {
  privacy: {
    title: 'Gizlilik politikası',
    updatedAt: '13 Eylül 2026',
    intro:
      'Bu sayfa, {restaurant} restoranının çevrimiçi masa rezervasyon sisteminde hangi verilerin toplandığını, ne için kullanıldığını ve ne kadar saklandığını açıklar.',
    sections: [
      {
        heading: 'Hangi verileri topluyoruz',
        paragraphs: ['Rezervasyon oluşturmak için yalnızca şunlar gerekir:'],
        bullets: [
          'Ad ve soyad, masanın kimin adına ayrıldığını bilmek için',
          'Telefon numarası, rezervasyonla ilgili sizinle iletişim kurmak için',
          'Seçtiğiniz tarih ve saat',
          'Telegram botu üzerinden geldiyseniz Telegram kullanıcı kimliğiniz, onay ve iptal mesajlarını gönderebilmek için',
        ],
      },
      {
        heading: 'Toplamadıklarımız',
        paragraphs: [
          'Ödeme ve banka kartı bilgisi toplanmaz, sistemde çevrimiçi ödeme yoktur. E-posta adresi istenmez. Konum, cihaz izleyicileri ve reklam çerezleri kullanılmaz.',
        ],
      },
      {
        heading: 'Veriler nerede saklanır',
        paragraphs: [
          'Rezervasyon bilgileri restoranın veritabanında saklanır. Aynı zamanda rezervasyon, restoranın Google Takvim hesabında bir etkinlik olarak oluşturulur: orada adınız, telefon numaranız ve rezervasyon kodunuz görünür, böylece restoran çalışanları sizi karşılayabilir.',
          'Sunucu kayıtlarında telefon numarası ve ad maskelenmiş biçimde yazılır, açık olarak saklanmaz.',
        ],
      },
      {
        heading: 'Kimlerle paylaşılır',
        paragraphs: [
          'Verileriniz üçüncü taraflara satılmaz ve reklam amacıyla paylaşılmaz. Yalnızca sistemin çalışması için gerekli hizmetler kullanılır: rezervasyonun takvime yazılması için Google Takvim ve bildirimlerin iletilmesi için Telegram.',
        ],
      },
      {
        heading: 'Ne kadar saklanır',
        paragraphs: [
          'Rezervasyon kayıtları restoranın kendi kayıtları için saklanır. Verilerinizin silinmesini isterseniz restoranla doğrudan iletişime geçebilirsiniz.',
        ],
      },
      {
        heading: 'Rezervasyonun iptali',
        paragraphs: [
          'Rezervasyonu başlama saatine en az {hours} saat kalana kadar onay mesajındaki iptal bağlantısıyla kendiniz iptal edebilirsiniz. İptal edildiğinde etkinlik takvimden silinir ve o saat yeniden serbest kalır.',
        ],
      },
      {
        heading: 'İletişim',
        paragraphs: [
          'Verilerinizle ilgili sorunuz olursa {restaurant} restoranıyla doğrudan iletişime geçin. {address}',
        ],
      },
    ],
  },

  terms: {
    title: 'Kullanım koşulları',
    updatedAt: '13 Eylül 2026',
    intro:
      'Bu sayfa, {restaurant} restoranının çevrimiçi rezervasyon sayfasının kullanım kurallarını açıklar. Rezervasyon oluşturarak bu koşulları kabul etmiş olursunuz.',
    sections: [
      {
        heading: 'Rezervasyon',
        paragraphs: [
          'Her rezervasyon {minutes} dakikalık bir zaman aralığı içindir. Yalnızca restoranın çalışma saatleri içinde ve boş olan saatler seçilebilir; geçmiş tarihler ve kapalı günler için rezervasyon yapılamaz.',
          'Rezervasyon onaylandıktan sonra size benzersiz bir rezervasyon kodu verilir. Restorana geldiğinizde bu kodu göstermeniz yeterlidir.',
        ],
      },
      {
        heading: 'İptal',
        paragraphs: [
          'Rezervasyonu başlama saatine en az {hours} saat kalana kadar onay mesajındaki iptal bağlantısıyla iptal edebilirsiniz.',
          '{hours} saatten az kaldığında çevrimiçi iptal kapanır: bu durumda restoranla doğrudan iletişime geçin.',
        ],
      },
      {
        heading: 'Gecikme ve gelmeme',
        paragraphs: [
          'Rezervasyon saatinde gelmediğiniz takdirde masa belirli bir bekleme süresinden sonra serbest bırakılabilir. Geç kalacağınızı biliyorsanız restorana haber vermenizi rica ederiz.',
        ],
      },
      {
        heading: 'Doğru bilgi',
        paragraphs: [
          'Ad, soyad ve telefon numarasının doğru yazılması önemlidir, iletişim yalnızca bu numara üzerinden kurulur. Yanlış veya başkasına ait bilgiyle yapılan rezervasyon restoran tarafından iptal edilebilir.',
        ],
      },
      {
        heading: 'Hizmetin erişilebilirliği',
        paragraphs: [
          'Sistem kesintisiz çalışmak üzere kurulmuştur, ancak teknik nedenlerle geçici olarak erişilemez olabilir. Böyle durumlarda rezervasyon için restoranla doğrudan iletişime geçebilirsiniz.',
          'Ödeme sistemi yoktur, rezervasyon için herhangi bir ödeme istenmez.',
        ],
      },
      {
        heading: 'İletişim',
        paragraphs: ['Sorularınız için {restaurant} restoranıyla iletişime geçin. {address}'],
      },
    ],
  },
}
