// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content'],

  devtools: { enabled: false },

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  routeRules: {
    '/panduan': { redirect: '/panduan/mulai' }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    prerender: {
      routes: ['/', '/rilis', '/privasi', '/ketentuan', '/panduan/mulai'],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // Font dari paket lokal (@fontsource), bukan diunduh dari layanan font saat build.
  fonts: {
    providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false, adobe: false }
  },

  // Ikon dibundel ke klien (situs statis, tanpa memanggil API Iconify saat dibuka).
  icon: {
    provider: 'none',
    fallbackToApi: false,
    clientBundle: {
      scan: { globInclude: ['app/**/*.vue', 'app/**/*.ts', 'content/**/*.yml', 'content/**/*.md'] },
      sizeLimitKb: 512
    }
  }
})
