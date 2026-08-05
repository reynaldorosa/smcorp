/** @type {import('next').NextConfig} */
const ignoreLintDuringBuild = process.env.NEXT_BUILD_IGNORE_LINT === 'true';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: ignoreLintDuringBuild,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Mitigação CVEs do Image Optimizer (GHSA-9g9p, GHSA-h64f, GHSA-3x4c):
  // sem optimizer ativo, as classes de DoS/cache de disco deixam de existir.
  // O app usa apenas data URLs (fotos de alunos) — next/image renderiza direto.
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  // Mitigação GHSA-h25m: headers de segurança contra DoS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // Limitar tamanho de body para Server Actions (mitiga DoS)
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

module.exports = nextConfig;
