<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

useSeoMeta({
  title: 'Halaman tidak ditemukan',
  description: 'Maaf, halaman yang Anda cari tidak ada.'
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
  transform: data => data.find(item => item.path === '/panduan')?.children || []
})
provide('navigation', navigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <UMain>
      <UContainer>
        <UError
          :error="error"
          :clear="{ label: 'Kembali ke beranda', to: '/' }"
        />
      </UContainer>
    </UMain>

    <AppFooter />
  </UApp>
</template>
