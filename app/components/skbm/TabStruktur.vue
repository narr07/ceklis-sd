<script setup lang="ts">
import type { TingkatKelas } from '~/utils/daftar1'
import { TINGKAT_LIST } from '~/utils/daftar1'
import { strukturJamBawaan } from '~/utils/skbm'

const { skbm, kelasRomawi } = useSkbmHalaman()
const resetOpen = ref(false)

const total = (t: TingkatKelas) => skbm.value.strukturJam[t].reduce((a, m) => a + (Number(m.jjm) || 0), 0)
function tambah(t: TingkatKelas) {
  skbm.value.strukturJam[t].push({ mapel: '', jjm: 2 })
}
function salinKe(dari: TingkatKelas, ke: TingkatKelas[]) {
  for (const t of ke) skbm.value.strukturJam[t] = structuredClone(toRaw(skbm.value.strukturJam[dari]))
}
function kembalikan() {
  skbm.value.strukturJam = strukturJamBawaan()
  resetOpen.value = false
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-muted">
        Jumlah jam pelajaran per minggu (JJM) tiap mapel di setiap kelas, sesuai KOSP sekolah. Nama mapel yang sama dipakai untuk guru mata pelajaran dan jadwal.
      </p>
      <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-rotate-ccw" label="Kembalikan bawaan" @click="resetOpen = true" />
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard v-for="t in TINGKAT_LIST" :key="t">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">Kelas {{ kelasRomawi(t) }}</p>
            <UBadge color="primary" variant="subtle" :label="`${total(t)} JJM`" />
          </div>
        </template>
        <div class="space-y-2">
          <div v-for="(m, i) in skbm.strukturJam[t]" :key="i" class="flex items-center gap-2">
            <UInput v-model="m.mapel" placeholder="Nama mapel" size="sm" class="flex-1" />
            <UInput v-model.number="m.jjm" type="number" min="0" max="20" size="sm" class="w-20" :aria-label="`JJM ${m.mapel}`" />
            <UButton color="error" variant="ghost" size="sm" icon="i-lucide-x" :aria-label="`Hapus ${m.mapel}`" @click="skbm.strukturJam[t].splice(i, 1)" />
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <UButton size="xs" variant="soft" icon="i-lucide-plus" label="Tambah mapel" @click="tambah(t)" />
            <UButton
              v-if="t === '3'"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-copy"
              label="Salin ke Kelas IV–VI"
              @click="salinKe('3', ['4', '5', '6'])"
            />
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="resetOpen" title="Kembalikan struktur jam bawaan?">
      <template #body>
        <p class="text-sm">Semua mapel dan JJM di keenam kelas diganti dengan struktur bawaan aplikasi.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="resetOpen = false" />
          <UButton color="error" label="Kembalikan" @click="kembalikan" />
        </div>
      </template>
    </UModal>
  </div>
</template>
