import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { prisma } from '@/lib/db/prisma'
import { buildCancelUrl } from '@/lib/reservations/create'
import { logError, logInfo } from '@/lib/security/log'
import { dbDateToDateString, todayInZone } from '@/lib/time/timezone'
import { buildBookingUrl } from './link'
import { messages } from './messages.az'
import type { TelegramPort } from './telegram-port'

export interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: TelegramUser
    chat: { id: number; type: string }
    text?: string
  }
}

export interface HandlerDeps {
  telegram: TelegramPort
}

/**
 * Eyni update-in iki dəfə emal olunmasının qarşısını alır (Telegram cavab
 * gecikəndə sorğunu təkrarlayır).
 */
export async function markUpdateProcessed(updateId: number): Promise<boolean> {
  try {
    await prisma.telegramUpdate.create({ data: { updateId: BigInt(updateId) } })
    return true
  } catch {
    return false
  }
}

/** Müştərinin Telegram məlumatlarını saxlayır — rezervasiya ilə əlaqələndirmək üçün. */
async function rememberUser(user: TelegramUser | undefined, chatId: string): Promise<void> {
  if (!user) return
  const telegramUserId = String(user.id)

  await prisma.user.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      telegramChatId: chatId,
      telegramUsername: user.username ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
    },
    update: {
      telegramChatId: chatId,
      telegramUsername: user.username ?? null,
    },
  })

  await prisma.reservation.updateMany({
    where: { telegramChatId: chatId, telegramUsername: null },
    data: { telegramUsername: user.username ?? null },
  })
}

/** Müştərinin gələcək aktiv rezervasiyaları. */
async function activeReservations(chatId: string, timezone: string) {
  const rows = await prisma.reservation.findMany({
    where: {
      telegramChatId: chatId,
      status: 'confirmed',
      reservationDate: { gte: new Date(`${todayInZone(timezone)}T00:00:00.000Z`) },
    },
    orderBy: [{ reservationDate: 'asc' }, { startTime: 'asc' }],
    take: 5,
  })

  return rows.map((row) => ({
    date: dbDateToDateString(row.reservationDate),
    startTime: row.startTime,
    reservationCode: row.reservationCode,
    cancelUrl: buildCancelUrl(row.cancellationToken),
  }))
}

/** Botun komandalarını emal edir. */
export async function handleUpdate(update: TelegramUpdate, deps: HandlerDeps): Promise<void> {
  const message = update.message
  if (!message?.text) return

  const chatId = String(message.chat.id)
  const command = message.text.trim().split(/\s+/)[0].toLowerCase().replace(/@.*$/, '')
  const settings = await getSettings()

  await rememberUser(message.from, chatId)

  const bookingUrl = buildBookingUrl(env.APP_BASE_URL, chatId, env.TELEGRAM_WEBHOOK_SECRET)

  switch (command) {
    case '/start': {
      const reply = messages.start(bookingUrl)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/book': {
      const reply = messages.book(bookingUrl)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/cancel': {
      const reservations = await activeReservations(chatId, settings.timezone)
      if (reservations.length === 0) {
        await deps.telegram.sendMessage(chatId, messages.cancelNoReservation())
        break
      }
      const reply = messages.cancelList(reservations)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/help': {
      await deps.telegram.sendMessage(chatId, messages.help(settings.cancellationDeadlineHours))
      break
    }
    default: {
      await deps.telegram.sendMessage(chatId, messages.unknownCommand())
    }
  }

  logInfo('telegram.update', 'Komanda emal edildi', { command, updateId: update.update_id })
}

/** Webhook və polling üçün ümumi giriş nöqtəsi — xətalar axını dayandırmır. */
export async function processUpdate(update: TelegramUpdate, deps: HandlerDeps): Promise<void> {
  if (!(await markUpdateProcessed(update.update_id))) {
    logInfo('telegram.update', 'Təkrarlanan update atıldı', { updateId: update.update_id })
    return
  }

  try {
    await handleUpdate(update, deps)
  } catch (error) {
    logError('telegram.handleUpdate', error, { updateId: update.update_id })
    // Emal uğursuz oldu — dedupe işarəsini geri götürürük, əks halda Telegram
    // həmin update-i təkrar göndərsə də mesaj həmişəlik itmiş qalar.
    await prisma.telegramUpdate
      .delete({ where: { updateId: BigInt(update.update_id) } })
      .catch(() => undefined)
  }
}
