const withPWA = require('next-pwa')({
  dest: 'public',
  disable: true, // Temporarily disable to fix build
  register: true,
  skipWaiting: true,
  sw: 'sw.js', // Service worker filename
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!noprecache/**/*'],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude Horizon UI folder from build
  webpack: (config, { isServer }) => {
    // Exclude Horizon UI folder from webpack compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/Horizon UI/**', '**/UI Idea/**'],
    }
    return config
  },
  async headers() {
    return [
      {
        // Apply headers to service worker
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Apply headers to manifest
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)

