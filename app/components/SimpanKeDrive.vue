<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/** Tombol "Simpan ke Drive" dengan pilihan format; hanya tampil bila Google Drive sudah terhubung. */
const props = withDefaults(defineProps<{
  items: DropdownMenuItem[] | DropdownMenuItem[][]
  size?: 'xs' | 'sm' | 'md'
  block?: boolean
}>(), { size: 'sm', block: false })

const { siap, status, menyimpan, muatStatus } = useGoogleDrive()

onMounted(() => {
  if (!status.value) muatStatus()
})
</script>

<template>
  <UDropdownMenu v-if="siap" :items="props.items" :content="{ align: 'end' }">
    <UButton
      color="neutral"
      variant="outline"
      :size="props.size"
      :block="props.block"
      icon="i-lucide-cloud-upload"
      trailing-icon="i-lucide-chevron-down"
      label="Simpan ke Drive"
      :loading="!!menyimpan"
      class="shrink-0"
    />
  </UDropdownMenu>
</template>
