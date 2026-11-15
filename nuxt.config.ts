// https://nuxt.com/docs/api/configuration/nuxt-config
//
// Tiga target build:
// - desktop: dijalankan oleh Tauri (`tauri dev` / `tauri build`), atau NUXT_TARGET=desktop
// - static : `nuxt generate`, situs statis tanpa server (data hanya di browser)
// - web    : `nuxt build`, website dengan server Nitro + endpoint sinkronisasi /api/ceklis
const isDesktop
  = process.env.NUXT_TARGET === 'desktop'
    || Boolean(process.env.TAURI_ENV_PLATFORM || process.env.TAURI_PLATFORM)
const isStatic = !isDesktop && (process.env.NUXT_TARGET === 'static' || process.argv.includes('generate'))
const appTarget = isDesktop ? 'desktop' : isStatic ? 'static' : 'web'
const tanpaServer = isDesktop || isStatic

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  // Semua data aplikasi ada di perangkat pengguna, jadi SSR tidak memberi manfaat di mode mana pun.
  ssr: false,
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  runtimeConfig: {
    // Diisi saat runtime lewat env NUXT_SYNC_TOKENS (format "NPSN:token,NPSN:token"), tidak ditanam saat build.
    syncTokens: '',
    public: {
      appTarget,
    },
  },
  nitro: tanpaServer
    ? {
        preset: process.argv.includes('dev') ? undefined : 'static',
        ignore: ['**/api/**'],
      }
    : {
        storage: {
          data: {
            driver: 'fs-lite',
            base: './.data/nitro',
          },
        },
      },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Ceklis SD: Checklist & Template Administrasi Sekolah Dasar',
      meta: [
        { name: 'description', content: 'Checklist awal semester & tahun ajaran serta generator dokumen untuk operator, kepala sekolah, dan bendahara SD.' },
        { name: 'theme-color', content: '#0E6E66' },
        { property: 'og:title', content: 'Ceklis SD' },
        { property: 'og:description', content: 'Checklist & template administrasi untuk operator, kepala sekolah, dan bendahara SD.' },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  icon: {
    provider: 'none',
    fallbackToApi: false,
    clientBundle: { scan: true, sizeLimitKb: 512 },
  },
  fonts: { providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false, adobe: false } },
  ui: { colorMode: true },
})
