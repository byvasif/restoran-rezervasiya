import { createServer } from 'node:http'
import { config } from 'dotenv'
import { google } from 'googleapis'

config({ path: '.env' })

/**
 * Google Calendar refresh token-i alır.
 *
 * İstifadə: npm run google:token
 * Skript brauzerdə açılacaq linki göstərir; icazə verdikdən sonra terminalda
 * refresh token görünür — onu .env faylındakı GOOGLE_REFRESH_TOKEN-ə yazın.
 */
const PORT = 53682

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/oauth2callback`

  if (!clientId || !clientSecret) {
    console.error('GOOGLE_CLIENT_ID və GOOGLE_CLIENT_SECRET .env faylında doldurulmalıdır.')
    process.exit(1)
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
  })

  console.log('\n1) Aşağıdakı linki brauzerdə açın və icazə verin:\n')
  console.log(authUrl)
  console.log(`\n2) İcazədən sonra bu skript tokeni burada göstərəcək (dinlənilən port: ${PORT}).\n`)

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
    const code = url.searchParams.get('code')

    if (!code) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Kod tapılmadı.')
      return
    }

    try {
      const { tokens } = await oauth2.getToken(code)
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      response.end('<h2>Hazırdır. Terminala qayıda bilərsiniz.</h2>')

      console.log('\nGOOGLE_REFRESH_TOKEN="' + (tokens.refresh_token ?? '') + '"\n')
      if (!tokens.refresh_token) {
        console.log('Refresh token gəlmədi. Google hesabınızdan tətbiqin icazəsini silib yenidən cəhd edin.')
      }
    } catch (error) {
      console.error('Token alınmadı:', error instanceof Error ? error.message : error)
    } finally {
      server.close()
      process.exit(0)
    }
  })

  server.listen(PORT)
}

main()
