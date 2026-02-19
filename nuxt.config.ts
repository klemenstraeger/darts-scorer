import { resolve } from 'node:path'
// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/supabase', '@nuxtjs/color-mode', '@vite-pwa/nuxt', 'shadcn-nuxt'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  css: ['~/assets/css/main.css'],

  components: [
    { path: '~/components/tournament', pathPrefix: false },
    { path: '~/components/spectate', pathPrefix: false },
    { path: '~/components/training', pathPrefix: false },
    { path: '~/components/training/modes', pathPrefix: false },
    '~/components',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login', '/confirm', '/spectate/*', '/camera/*'],
    },
  },

  nitro: {
    preset: 'node-server',
  },

  routeRules: {
    '/dashboard': { ssr: false },
    '/game': { ssr: false },
    '/players': { ssr: false },
    '/tournaments/**': { ssr: false },
    '/stats': { ssr: false },
    '/stats/**': { ssr: false },
    '/profile-setup': { ssr: false },
    '/login': { ssr: false },
    '/quick-start': { ssr: false },
    '/training/**': { ssr: false },
    '/training': { ssr: false },
  },

  alias: {
    '#shared': resolve(__dirname, 'shared'),
  },

  runtimeConfig: {
    databaseUrl: '', // NUXT_DATABASE_URL
  },

  vite: {
    plugins: [tailwindcss()],
    // optimizeDeps: {
    //   include: ['cookie', '@supabase/ssr'],
    // },
    // ssr: {
    //   external: ['@unovis/ts', '@unovis/vue'],
    // },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Darts Scorer',
      short_name: 'Darts',
      description: 'Score darts games and tournaments',
      theme_color: '#0a0a14',
      background_color: '#0a0a14',
      display: 'standalone',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        {
          name: 'Quick Game',
          short_name: 'Quick Game',
          url: '/quick-start',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
        },
        {
          name: 'Practice (501)',
          short_name: 'Practice',
          url: '/dashboard',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      navigateFallbackDenylist: [/^\/api\//, /^\/confirm/, /^\/$/],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts-css', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts-woff2', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        },
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 },
        },
        {
          urlPattern: /.*\.supabase\.co\/auth\/.*/i,
          handler: 'NetworkOnly',
        },
      ],
    },
  },

  app: {
    head: {
      title: 'Darts Scorer — Professional Darts Scoring & Tournament Management',
      meta: [
        { name: 'description', content: 'Free professional darts scoring app with real-time game tracking, tournament management, detailed statistics, and AI opponents. Works offline as a PWA.' },
        { property: 'og:title', content: 'Darts Scorer — Professional Darts Scoring & Tournament Management' },
        { property: 'og:description', content: 'Free professional darts scoring app with real-time game tracking, tournament management, detailed statistics, and AI opponents.' },
        { property: 'og:type', content: 'website' },
        { name: 'theme-color', content: '#0a0a14' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
          crossorigin: 'anonymous',
        },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
