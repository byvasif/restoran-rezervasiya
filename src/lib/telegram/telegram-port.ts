export interface InlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
}

export type InlineKeyboard = InlineKeyboardButton[][]

export interface TelegramPort {
  sendMessage(chatId: string, text: string, keyboard?: InlineKeyboard): Promise<void>
  answerCallbackQuery?(callbackQueryId: string, text?: string): Promise<void>
}
