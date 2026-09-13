import { getSettings } from '@/config/business'
import { env } from '@/config/env'
import { prisma } from '@/lib/db/prisma'
import { buildCancelUrl } from '@/lib/reservations/create'
import { logError, logInfo } from '@/lib/security/log'
import { dbDateToDateString, todayInZone } from '@/lib/time/timezone'
import { DEFAULT_LOCALE, isLocale, localeFromTelegram, toLocale, type Locale } from '@/i18n/locales'
import { buildBookingUrl } from './link'
import { getCustomerMessages } from './messages'
import type { TelegramPort } from './telegram-port'

export interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: TelegramUser
    chat: { id: number; type: string }
    text?: string
  }
  callback_query?: {
    id: string
    from?: TelegramUser
    message?: { chat: { id: number } }
    data?: string
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

/**
 * Botun bu istifadəçi ilə danışacağı dil.
 *
 * Əvvəlcə bazadakı seçim (istifadəçi `/dil` ilə özü seçibsə), sonra Telegram
 * hesabının dili, sonra Azərbaycanca. Əl ilə edilən seçim avtomatik aşkarlamanı
 * həmişə üstələyir.
 */
export function resolveLocale(stored: string | null | undefined, telegramCode: string | null | undefined): Locale {
  if (isLocale(stored)) return stored
  return localeFromTelegram(telegramCode)
}

/** Müştərinin Telegram məlumatlarını saxlayır — rezervasiya ilə əlaqələndirmək üçün. */
async function rememberUser(user: TelegramUser | undefined, chatId: string): Promise<Locale> {
  if (!user) return DEFAULT_LOCALE

  const telegramUserId = String(user.id)
  const existing = await prisma.user.findUnique({ where: { telegramUserId } })
  const locale = resolveLocale(existing?.locale, user.language_code)

  await prisma.user.upsert({
    where: { telegramUserId },
    create: {
      telegramUserId,
      telegramChatId: chatId,
      telegramUsername: user.username ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      locale,
    },
    update: {
      telegramChatId: chatId,
      telegramUsername: user.username ?? null,
      // Saxlanmış seçim varsa toxunulmur.
      locale: existing?.locale ?? locale,
    },
  })

  await prisma.reservation.updateMany({
    where: { telegramChatId: chatId, telegramUsername: null },
    data: { telegramUsername: user.username ?? null },
  })

  return locale
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
    cancelUrl: buildCancelUrl(row.cancellationToken, toLocale(row.locale)),
  }))
}

/** `/dil` menyusundan gələn düymə cavabı. */
async function handleLanguageChoice(
  update: NonNullable<TelegramUpdate['callback_query']>,
  deps: HandlerDeps,
): Promise<void> {
  const chatId = update.message?.chat.id ? String(update.message.chat.id) : null
  const chosen = update.data?.split(':')[1]

  if (!chatId || !isLocale(chosen)) return

  if (update.from) {
    await prisma.user.updateMany({ where: { telegramUserId: String(update.from.id) }, data: { locale: chosen } })
  }

  await deps.telegram.answerCallbackQuery?.(update.id)
  await deps.telegram.sendMessage(chatId, getCustomerMessages(chosen).languageChanged())

  logInfo('telegram.language', 'Bot dili dəyişdirildi', { locale: chosen })
}

/** Botun komandalarını emal edir. */
export async function handleUpdate(update: TelegramUpdate, deps: HandlerDeps): Promise<void> {
  if (update.callback_query) {
    await handleLanguageChoice(update.callback_query, deps)
    return
  }

  const message = update.message
  if (!message?.text) return

  const chatId = String(message.chat.id)
  const command = message.text.trim().split(/\s+/)[0].toLowerCase().replace(/@.*$/, '')
  const settings = await getSettings()

  const locale = await rememberUser(message.from, chatId)
  const texts = getCustomerMessages(locale)

  const bookingUrl = buildBookingUrl(env.APP_BASE_URL, chatId, env.TELEGRAM_WEBHOOK_SECRET, locale)

  switch (command) {
    case '/start': {
      const reply = texts.start(bookingUrl)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/book': {
      const reply = texts.book(bookingUrl)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/cancel': {
      const reservations = await activeReservations(chatId, settings.timezone)
      if (reservations.length === 0) {
        await deps.telegram.sendMessage(chatId, texts.cancelNoReservation())
        break
      }
      const reply = texts.cancelList(reservations)
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/dil':
    case '/lang':
    case '/language': {
      const reply = texts.languagePrompt()
      await deps.telegram.sendMessage(chatId, reply.text, reply.keyboard)
      break
    }
    case '/help': {
      await deps.telegram.sendMessage(chatId, texts.help(settings.cancellationDeadlineHours))
      break
    }
    default: {
      await deps.telegram.sendMessage(chatId, texts.unknownCommand())
    }
  }

  logInfo('telegram.update', 'Komanda emal edildi', { command, locale, updateId: update.update_id })
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
