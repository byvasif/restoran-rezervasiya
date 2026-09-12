import { randomBytes } from 'node:crypto'

/**
 * Ləğv tokeni: 32 bayt təsadüfi dəyər (64 hex simvol). Təxmin edilməsi
 * praktiki olaraq mümkün deyil — başqa şəxs sizin rezervasiyanızı ləğv edə bilməz.
 */
export function generateCancellationToken(): string {
  return randomBytes(32).toString('hex')
}
