import { config } from 'dotenv'

// Test mühiti: əvvəlcə .env.test, sonra .env oxunur (mövcud dəyərlər üstələnmir).
config({ path: '.env.test' })
config({ path: '.env' })
