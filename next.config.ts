import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prisma Node API-si server tərəfdə bundle edilmir.
  serverExternalPackages: ['@prisma/client', 'googleapis'],
}

export default nextConfig
