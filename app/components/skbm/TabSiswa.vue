<script setup lang="ts">
import { TINGKAT_LIST } from '~/utils/daftar1'

const { skbm, hasil, kelasRomawi } = useSkbmHalaman()

const manual = computed({
  get: () => skbm.value.siswaManual !== null,
  set: (v: boolean) => {
    // Saat beralih ke manual, mulai dari angka yang sedang tampil (hasil SPTJM).
    skbm.value.siswaManual = v
      ? Object.fromEntries(TINGKAT_LIST.map(t => [t, { l: hasil.value.siswaKelas[t].l, p: hasil.value.siswaKelas[t].p }])) as typeof skbm.value.siswaManual
      : null
  },
})
const sumberLabel = computed(() => ({ manual: 'Isian manual', sptjm: 'Dihitung dari SPTJM Dapodik', kosong: 'Belum ada data SPTJM' })[hasil.value.sumberSiswa])
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-3">
    <UCard class="lg:col-span-2" :ui="{ body: 'p-0 sm:p-0 overflow-x-auto' }">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-semibold">Jumlah siswa per rombel (Lampiran II)</p>
            <p class="text-xs text-muted">{{ sumberLabel }}</p>
          </div>
          <USwitch v-model="manual" label="Isi manual" />
        </div>
      </template>
      <table class="w-full min-w-120 border-collapse text-sm">
        <thead>
          <tr class="bg-elevated/60 text-xs text-muted">
            <th class="px-3 py-2 text-left">Kelas</th>
            <th class="px-3 py-2 text-center">L</th>
            <th class="px-3 py-2 text-center">P</th>
            <th class="px-3 py-2 text-center">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in TINGKAT_LIST" :key="t" class="border-t border-default">
            <td class="px-3 py-1.5">Kelas {{ kelasRomawi(t) }}</td>
            <template v-if="skbm.siswaManual">
              <td class="px-3 py-1"><UInput v-model.number="skbm.siswaManual[t].l" type="number" min="0" size="sm" class="mx-auto w-20" :aria-label="`Laki-laki kelas ${kelasRomawi(t)}`" /></td>
              <td class="px-3 py-1"><UInput v-model.number="skbm.siswaManual[t].p" type="number" min="0" size="sm" class="mx-auto w-20" :aria-label="`Perempuan kelas ${kelasRomawi(t)}`" /></td>
            </template>
            <template v-else>
              <td class="px-3 py-1.5 text-center tabular-nums">{{ hasil.siswaKelas[t].l }}</td>
              <td class="px-3 py-1.5 text-center tabular-nums">{{ hasil.siswaKelas[t].p }}</td>
            </template>
            <td class="px-3 py-1.5 text-center font-semibold tabular-nums">{{ hasil.siswaKelas[t].total }}</td>
          </tr>
          <tr class="border-t border-default bg-elevated/40 font-semibold">
            <td class="px-3 py-1.5">Total</td>
            <td class="px-3 py-1.5 text-center tabular-nums">{{ hasil.totalSiswa.l }}</td>
            <td class="px-3 py-1.5 text-center tabular-nums">{{ hasil.totalSiswa.p }}</td>
            <td class="px-3 py-1.5 text-center tabular-nums">{{ hasil.totalSiswa.total }}</td>
          </tr>
        </tbody>
      </table>
    </UCard>

    <UCard>
      <template #header>
        <p class="font-semibold">Peserta pramuka</p>
      </template>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between"><dt>Siaga putra (Kelas I–III)</dt><dd class="font-semibold tabular-nums">{{ hasil.pramuka.siagaPutra }}</dd></div>
        <div class="flex justify-between"><dt>Siaga putri (Kelas I–III)</dt><dd class="font-semibold tabular-nums">{{ hasil.pramuka.siagaPutri }}</dd></div>
        <div class="flex justify-between"><dt>Penggalang putra (Kelas IV–VI)</dt><dd class="font-semibold tabular-nums">{{ hasil.pramuka.penggalangPutra }}</dd></div>
        <div class="flex justify-between"><dt>Penggalang putri (Kelas IV–VI)</dt><dd class="font-semibold tabular-nums">{{ hasil.pramuka.penggalangPutri }}</dd></div>
        <div class="flex justify-between border-t border-default pt-2"><dt>Jumlah</dt><dd class="font-semibold tabular-nums">{{ hasil.totalSiswa.total }}</dd></div>
      </dl>
    </UCard>
  </div>
</template>
