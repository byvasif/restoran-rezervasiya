import { execSync } from 'node:child_process'
import { config } from 'dotenv'

/**
 * Test bazasını miqrasiya edir və iş qrafikini seed edir.
 * İstifadə: npm run db:test:setup
 */
const parsed = config({ path: '.env.test' }).parsed
if (!parsed?.DATABASE_URL) {
  console.error('.env.test faylında DATABASE_URL tapılmadı.')
  process.exit(1)
}

const environment = { ...process.env, ...parsed }

execSync('npx prisma migrate deploy', { stdio: 'inherit', env: environment })
execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: environment })
