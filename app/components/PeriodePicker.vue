<script setup lang="ts">
const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const { periode, pilihanTa, tahunAnggaran } = usePeriode()
const semesterItems = [
  { label: 'Semester Ganjil (Jul–Des)', value: 'ganjil' },
  { label: 'Semester Genap (Jan–Jun)', value: 'genap' },
]
</script>

<template>
  <div v-if="props.compact" class="flex flex-wrap items-center gap-2">
    <span class="text-xs font-medium text-muted">Periode:</span>
    <USelect v-model="periode.ta" :items="pilihanTa" size="xs" class="w-28" aria-label="Tahun ajaran" />
    <USelect v-model="periode.semester" :items="semesterItems" size="xs" class="w-48" aria-label="Semester" />
    <UBadge color="neutral" variant="subtle" size="sm">
      TAng {{ tahunAnggaran }}
    </UBadge>
  </div>
  <div v-else class="flex flex-wrap items-end gap-3">
    <UFormField label="Tahun ajaran">
      <USelect v-model="periode.ta" :items="pilihanTa" class="w-36" />
    </UFormField>
    <UFormField label="Semester">
      <USelect v-model="periode.semester" :items="semesterItems" class="w-60" />
    </UFormField>
    <UBadge color="neutral" variant="subtle" size="lg" class="mb-0.5">
      Tahun anggaran {{ tahunAnggaran }}
    </UBadge>
  </div>
</template>
