<script setup lang="ts">
/** Logo Ceklis SD — lihat DESIGN.md §2. variant: 'color' | 'reverse' | 'mono' */
withDefaults(defineProps<{ variant?: 'color' | 'reverse' | 'mono', mark?: boolean }>(), { variant: 'color', mark: false })
</script>

<template>
  <span class="inline-flex items-center gap-2" aria-label="Ceklis SD">
    <svg viewBox="0 0 64 64" class="size-8 shrink-0" aria-hidden="true">
      <rect x="6" y="10" width="52" height="50" rx="14" :fill="variant === 'reverse' ? '#fff' : variant === 'mono' ? 'currentColor' : 'var(--color-papan-700)'" />
      <rect x="21" y="3" width="22" height="13" rx="5" :fill="variant === 'mono' ? 'currentColor' : 'var(--color-merah-600)'" />
      <circle cx="32" cy="9.5" r="2.6" :fill="variant === 'reverse' ? '#fff' : variant === 'mono' ? 'var(--ui-bg)' : 'var(--color-papan-700)'" />
      <path d="M19.5 36.5 L28.5 45.5 L45 27" fill="none" :stroke="variant === 'reverse' ? 'var(--color-papan-700)' : variant === 'mono' ? 'var(--ui-bg)' : '#fff'" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span v-if="!mark" class="flex items-center gap-1.5 text-xl font-extrabold tracking-tight" :class="variant === 'reverse' ? 'text-white' : 'text-highlighted'">
      Ceklis
      <span class="rounded-md px-1.5 py-px text-sm font-extrabold leading-5 text-white" :class="variant === 'mono' ? 'bg-current' : 'bg-merah-600'">
        <span :class="variant === 'mono' ? 'text-(--ui-bg)' : ''">SD</span>
      </span>
    </span>
  </span>
</template>
