import { prisma } from '@/lib/db/prisma'

/** Hər testdən əvvəl rezervasiya məlumatlarını təmizləyir (qrafik qalır). */
export async function resetReservations(): Promise<void> {
  await prisma.reservation.deleteMany()
  await prisma.user.deleteMany()
  await prisma.telegramUpdate.deleteMany()
}

/** Test üçün iş qrafikini məlum vəziyyətə gətirir: B.e–Şənbə 10:00–22:00, Bazar bağlı. */
export async function resetBusinessHours(): Promise<void> {
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const isOpen = weekday !== 0
    await prisma.businessHours.upsert({
      where: { weekday },
      create: {
        weekday,
        isOpen,
        openingTime: isOpen ? '10:00' : null,
        closingTime: isOpen ? '22:00' : null,
        breakStart: null,
        breakEnd: null,
      },
      update: {
        isOpen,
        openingTime: isOpen ? '10:00' : null,
        closingTime: isOpen ? '22:00' : null,
        breakStart: null,
        breakEnd: null,
      },
    })
  }
  await prisma.closedDate.deleteMany()
}

export { prisma }
