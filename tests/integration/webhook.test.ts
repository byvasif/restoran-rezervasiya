import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { POST as webhookPost } from '@/app/api/telegram/webhook/route'
import { setTelegram } from '@/lib/telegram/client'
import { processUpdate, handleUpdate, markUpdateProcessed, type TelegramUpdate } from '@/lib/telegram/handlers'
import { verifyChatLink } from '@/lib/telegram/link'
import { createReservation } from '@/lib/reservations/create'
import { signChatLink } from '@/lib/telegram/link'
import { prisma, resetReservations, resetBusinessHours } from '../helpers/db'
import { FakeCalendar, FakeTelegram } from '../helpers/fakes'

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET as string
const CHAT_ID = 777000333

let telegram: FakeTelegram

function update(text: string, updateId = Math.floor(Math.random() * 1_000_000)): TelegramUpdate {
  return {
    update_id: updateId,
    message: {
      message_id: 1,
      from: { id: CHAT_ID, username: 'test_user', first_name: 'Test' },
      chat: { id: CHAT_ID, type: 'private' },
      text,
    },
  }
}

beforeEach(async () => {
  await resetReservations()
  await resetBusinessHours()
  telegram = new FakeTelegram()
})

afterAll(async () => {
  await resetReservations()
  await prisma.$disconnect()
})

describe('bot komandaları', () => {
  it('/start imzalı rezervasiya linki olan düymə göndərir', async () => {
    await handleUpdate(update('/start'), { telegram })

    const message = telegram.sent[0]
    expect(message.text).toContain('Salam!')
    const url = new URL(message.keyboard?.[0][0].url as string)
    expect(verifyChatLink(url.searchParams.get('t') as string, SECRET)).toBe(String(CHAT_ID))
  })

  it('/book rezervasiya səhifəsinin linkini göndərir', async () => {
    await handleUpdate(update('/book'), { telegram })
    expect(telegram.sent[0].keyboard?.[0][0].url).toContain('t=')
  })

  it('/help bütün komandaları göstərir', async () => {
    await handleUpdate(update('/help'), { telegram })
    for (const command of ['/start', '/book', '/cancel', '/help']) {
      expect(telegram.sent[0].text).toContain(command)
    }
  })

  it('/cancel aktiv rezervasiya yoxdursa məlumat verir', async () => {
    await handleUpdate(update('/cancel'), { telegram })
    expect(telegram.sent[0].text).toContain('tapılmadı')
  })

  it('/cancel aktiv rezervasiyanın ləğv linkini göndərir', async () => {
    const calendar = new FakeCalendar()
    const created = await createReservation(
      {
        firstName: 'Elvin',
        lastName: 'Məmmədov',
        phoneNumber: '+994501234567',
        date: '2027-05-10',
        time: '19:00',
        telegramToken: signChatLink(String(CHAT_ID), SECRET),
      } as Parameters<typeof createReservation>[0],
      { calendar, telegram },
    )
    expect(created.ok).toBe(true)
    telegram.sent = []

    await handleUpdate(update('/cancel'), { telegram })

    expect(telegram.sent[0].text).toContain('10 may 2027')
    expect(telegram.sent[0].keyboard?.[0][0].url).toContain('/legv/')
  })

  it('naməlum komandaya yardım təklif edir', async () => {
    await handleUpdate(update('salam'), { telegram })
    expect(telegram.sent[0].text).toContain('/help')
  })

  it('istifadəçi məlumatlarını saxlayır', async () => {
    await handleUpdate(update('/start'), { telegram })

    const user = await prisma.user.findUnique({ where: { telegramUserId: String(CHAT_ID) } })
    expect(user?.telegramUsername).toBe('test_user')
    expect(user?.telegramChatId).toBe(String(CHAT_ID))
  })
})

describe('update dedupe', () => {
  it('eyni update_id ikinci dəfə emal edilmir', async () => {
    const payload = update('/start', 424242)

    await processUpdate(payload, { telegram })
    await processUpdate(payload, { telegram })

    expect(telegram.sent).toHaveLength(1)
  })

  it('markUpdateProcessed ikinci çağırışda false qaytarır', async () => {
    expect(await markUpdateProcessed(999111)).toBe(true)
    expect(await markUpdateProcessed(999111)).toBe(false)
  })

  it('handler xətası axını dayandırmır', async () => {
    telegram.failOnSend = true
    await expect(processUpdate(update('/start'), { telegram })).resolves.toBeUndefined()
  })

  it('uğursuz emaldan sonra eyni update yenidən cəhd edilə bilir', async () => {
    const payload = update('/start', 515151)

    telegram.failOnSend = true
    await processUpdate(payload, { telegram })
    expect(telegram.sent).toHaveLength(0)
    expect(await prisma.telegramUpdate.findUnique({ where: { updateId: BigInt(515151) } })).toBeNull()

    telegram.failOnSend = false
    await processUpdate(payload, { telegram })
    expect(telegram.sent).toHaveLength(1)
  })
})

describe('webhook endpoint doğrulaması', () => {
  function post(secret: string | null, body: unknown) {
    setTelegram(telegram)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (secret !== null) headers['x-telegram-bot-api-secret-token'] = secret

    return webhookPost(
      new Request('http://localhost:3200/api/telegram/webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
    )
  }

  it('secret başlığı olmayan sorğunu 401 ilə rədd edir', async () => {
    const response = await post(null, update('/start'))
    expect(response.status).toBe(401)
    expect(telegram.sent).toHaveLength(0)
  })

  it('yanlış secret ilə sorğunu rədd edir', async () => {
    const response = await post('yanlis-secret-deyeri-123456789', update('/start'))
    expect(response.status).toBe(401)
    expect(telegram.sent).toHaveLength(0)
  })

  it('düzgün secret ilə update-i emal edir', async () => {
    const response = await post(SECRET, update('/start'))
    expect(response.status).toBe(200)
    expect(telegram.sent).toHaveLength(1)
    expect(telegram.sent[0].text).toContain('Salam!')
  })

  it('oxunmayan gövdədə də Telegram-a 200 qaytarır', async () => {
    const response = await webhookPost(
      new Request('http://localhost:3200/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
        body: 'bu JSON deyil',
      }),
    )
    expect(response.status).toBe(200)
  })
})
