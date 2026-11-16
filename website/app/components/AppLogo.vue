<script setup lang="ts">
withDefaults(defineProps<{ mark?: boolean }>(), { mark: false })
</script>

<template>
  <!-- Logo SVG brand (bukan komponen Nuxt UI karena berupa aset gambar). Versi terang & gelap. -->
  <span class="inline-flex items-center">
    <template v-if="mark">
      <img
        src="/brand/logo-mark.svg"
        alt="Ceklis SD"
        class="h-full w-auto"
      >
    </template>
    <template v-else>
      <img
        src="/brand/logo-horizontal.svg"
        alt="Ceklis SD"
        class="h-full w-auto dark:hidden"
      >
      <img
        src="/brand/logo-horizontal-reverse.svg"
        alt="Ceklis SD"
        class="hidden h-full w-auto dark:block"
      >
    </template>
  </span>
</template>
