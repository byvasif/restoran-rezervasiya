import { DateTime } from 'luxon'

const MONTHS_AZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
]

const WEEKDAYS_AZ = [
  'Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə',
  'Cümə axşamı', 'Cümə', 'Şənbə',
]

/** 0 = Bazar ... 6 = Şənbə */
export function weekdayNameAz(weekday: number): string {
  return WEEKDAYS_AZ[weekday] ?? ''
}

/** `2027-05-10` → `10 may 2027, Bazar ertəsi` */
export function formatDateAz(date: string): string {
  const dt = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'utc' })
  if (!dt.isValid) return date
  const weekday = dt.weekday === 7 ? 0 : dt.weekday
  return `${dt.day} ${MONTHS_AZ[dt.month - 1]} ${dt.year}, ${WEEKDAYS_AZ[weekday]}`
}

/** `2027-05-10` → `10 may` */
export function formatDateShortAz(date: string): string {
  const dt = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'utc' })
  if (!dt.isValid) return date
  return `${dt.day} ${MONTHS_AZ[dt.month - 1]}`
}

export { MONTHS_AZ, WEEKDAYS_AZ }
