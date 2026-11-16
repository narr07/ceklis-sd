<script setup lang="ts">
const colorMode = useColorMode()
const themeColor = computed(() => (colorMode.value === 'dark' ? '#0b1416' : '#0e6e66'))

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: themeColor }
  ]
})

useSeoMeta({
  titleTemplate: title => (title ? `${title} · Ceklis SD` : 'Ceklis SD: Checklist & template administrasi SD'),
  ogSiteName: 'Ceklis SD',
  ogImage: `${URL_SITUS}/og-image.png`,
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image'
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
  transform: data => data.find(item => item.path === '/panduan')?.children || []
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
