import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import hours from '../src/config/business-hours.json'

config({ path: '.env' })

const prisma = new PrismaClient()

/**
 * İş qrafiki və restoran parametrləri bazada yaşayır — gələcək sahibkar
 * paneli məhz bu sətirləri redaktə edəcək. İlkin dəyərlər environment
 * dəyişənlərindən və `src/config/business-hours.json` faylından gəlir.
 */
async function main() {
  const settings = {
    restaurantName: process.env.RESTAURANT_NAME ?? 'Restoran',
    restaurantAddress: process.env.RESTAURANT_ADDRESS ?? '',
    timezone: process.env.TIMEZONE ?? 'Asia/Baku',
    bookingDurationMinutes: Number(process.env.BOOKING_DURATION_MINUTES ?? 60),
    cancellationDeadlineHours: Number(process.env.CANCELLATION_DEADLINE_HOURS ?? 24),
  }

  const existing = await prisma.businessSettings.findFirst()
  if (existing) {
    await prisma.businessSettings.update({ where: { id: existing.id }, data: settings })
  } else {
    await prisma.businessSettings.create({ data: settings })
  }

  for (const day of hours.weekdays) {
    await prisma.businessHours.upsert({
      where: { weekday: day.weekday },
      create: {
        weekday: day.weekday,
        isOpen: day.isOpen,
        openingTime: day.openingTime,
        closingTime: day.closingTime,
        breakStart: day.breakStart,
        breakEnd: day.breakEnd,
      },
      update: {
        isOpen: day.isOpen,
        openingTime: day.openingTime,
        closingTime: day.closingTime,
        breakStart: day.breakStart,
        breakEnd: day.breakEnd,
      },
    })
  }

  for (const closed of hours.closedDates) {
    await prisma.closedDate.upsert({
      where: { closedDate: new Date(`${closed.date}T00:00:00.000Z`) },
      create: { closedDate: new Date(`${closed.date}T00:00:00.000Z`), reason: closed.reason },
      update: { reason: closed.reason },
    })
  }

  console.log('Seed tamamlandı: iş qrafiki, restoran parametrləri və bağlı günlər yazıldı.')
}

main()
  .catch((error) => {
    console.error('Seed uğursuz oldu:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
