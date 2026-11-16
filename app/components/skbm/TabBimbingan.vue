<script setup lang="ts">
import type { BarisSkbm } from '~/utils/skbm'
import { SARAN_BIMBINGAN, SARAN_SASARAN } from '~/utils/skbm'

const { hasil, ubahTugas } = useSkbmHalaman()

function tambahTugas(b: BarisSkbm, teks: string) {
  const ada = (b.tugas.bimbingan ?? '').split('\n').map(x => x.trim()).filter(Boolean)
  if (ada.includes(teks)) return
  ubahTugas(b, { bimbingan: [...ada, teks].join('\n') })
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <div>
        <p class="font-semibold">Tugas membimbing kokurikuler & ekstrakurikuler (Lampiran III)</p>
        <p class="text-xs text-muted">Satu tugas per baris; bila lebih dari satu, di dokumen ditulis dengan tanda •.</p>
      </div>
    </template>
    <div class="divide-y divide-default">
      <div v-for="b in hasil.baris" :key="b.kunci" class="grid gap-3 p-3 lg:grid-cols-12">
        <div class="lg:col-span-3">
          <p class="font-medium text-highlighted">{{ b.nama }}</p>
          <p class="text-xs text-muted">{{ b.tugasLabel }}</p>
        </div>
        <div class="space-y-1.5 lg:col-span-5">
          <UTextarea
            :model-value="b.tugas.bimbingan ?? ''"
            :rows="2"
            autoresize
            placeholder="mis. Pembina Pramuka Siaga Putra"
            class="w-full"
            @update:model-value="v => ubahTugas(b, { bimbingan: String(v) })"
          />
          <div class="flex flex-wrap gap-1">
            <UButton v-for="s in SARAN_BIMBINGAN" :key="s" size="xs" variant="soft" color="neutral" :label="s" @click="tambahTugas(b, s)" />
          </div>
        </div>
        <div class="space-y-1.5 lg:col-span-4">
          <UInput
            :model-value="b.tugas.sasaran ?? ''"
            placeholder="Sasaran bimbingan"
            class="w-full"
            @update:model-value="v => ubahTugas(b, { sasaran: String(v) })"
          />
          <div class="flex flex-wrap gap-1">
            <UButton v-for="s in SARAN_SASARAN" :key="s" size="xs" variant="soft" color="neutral" :label="s" @click="ubahTugas(b, { sasaran: s })" />
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
