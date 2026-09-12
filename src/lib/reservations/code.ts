import { randomInt } from 'node:crypto'

// Səhv oxunan simvollar (0/O, 1/I) daxil edilmir — kod telefonla deyilə bilər.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

/** Müştəriyə göstərilən unikal rezervasiya kodu. */
export function generateReservationCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}
