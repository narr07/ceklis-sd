<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const open = ref(false)

const diPanduan = computed(() => route.path.startsWith('/panduan'))

const items = computed(() => [
  { label: 'Fitur', to: '/#fitur' },
  { label: 'Panduan', to: '/panduan/mulai', active: diPanduan.value },
  { label: 'Catatan Rilis', to: '/rilis' }
])
</script>

<template>
  <UHeader v-model:open="open">
    <template #left>
      <NuxtLink
        to="/"
        class="-ms-1 rounded-md p-1 outline-primary/25 focus-visible:outline-3"
        aria-label="Ceklis SD, ke beranda"
      >
        <AppLogo class="h-7 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />
      <UButton
        :to="URL_REPO"
        target="_blank"
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        aria-label="Kode sumber di GitHub"
      />
      <UButton
        label="Unduh"
        icon="i-lucide-download"
        to="/#unduh"
        class="hidden lg:inline-flex"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <template v-if="diPanduan && navigation?.length">
        <USeparator class="my-6" />
        <UContentNavigation
          :navigation="navigation"
          highlight
        />
      </template>

      <USeparator class="my-6" />
      <UButton
        label="Unduh untuk Windows"
        icon="i-lucide-download"
        to="/#unduh"
        block
      />
    </template>
  </UHeader>
</template>
