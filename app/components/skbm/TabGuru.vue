<script setup lang="ts">
import type { JenisTugas } from '~/utils/skbm'
import type { TingkatKelas } from '~/utils/daftar1'
import { TINGKAT_LIST } from '~/utils/daftar1'

const { hasil, skbm, kelasItems, semuaMapel, ubahTugas, gantiJenis, gantiMapel, kelasRomawi } = useSkbmHalaman()

const jenisItems: { label: string, value: JenisTugas }[] = [
  { label: 'Kepala Sekolah', value: 'kepsek' },
  { label: 'Guru Kelas', value: 'kelas' },
  { label: 'Guru Mata Pelajaran', value: 'mapel' },
  { label: 'Belum ditentukan', value: 'lain' },
]
const angka = (n: number) => (n ? n : '')
</script>

<template>
  <div class="space-y-4">
    <UEmpty
      v-if="!hasil.baris.length"
      icon="i-lucide-users"
      title="Belum ada data guru"
      description="Isi daftar GTK di halaman Profil atau impor SPTJM Dapodik lebih dulu."
      :actions="[{ label: 'Buka Profil', to: '/profil', color: 'primary', variant: 'outline' }]"
    />

    <template v-else>
      <UAlert
        v-if="hasil.peringatan.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        title="Perlu dicek"
      >
        <template #description>
          <ul class="list-disc space-y-0.5 pl-4">
            <li v-for="(p, i) in hasil.peringatan" :key="i">{{ p }}</li>
          </ul>
        </template>
      </UAlert>

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold">Tugas mengajar ({{ hasil.baris.length }} GTK)</p>
            <p class="text-xs text-muted">Tugas awal ditebak dari jabatan di Profil; ubah bila perlu. Nama & NIP diubah di Profil.</p>
          </div>
        </template>
        <div class="divide-y divide-default">
          <div v-for="b in hasil.baris" :key="b.kunci" class="grid gap-3 p-3 lg:grid-cols-12">
            <div class="lg:col-span-3">
              <p class="font-medium text-highlighted">{{ b.nama }}</p>
              <p class="font-mono text-xs text-muted">{{ b.nip || 'tanpa NIP' }}</p>
              <UInput v-model="b.gtk.pangkat" size="xs" placeholder="Pangkat/golongan" class="mt-1.5 w-full" />
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:col-span-6">
              <UFormField label="Tugas">
                <USelect :model-value="b.tugas.jenis" :items="jenisItems" class="w-full" @update:model-value="v => gantiJenis(b, v as JenisTugas)" />
              </UFormField>
              <UFormField v-if="b.tugas.jenis === 'kelas'" label="Kelas">
                <USelect :model-value="b.tugas.kelas" :items="kelasItems" placeholder="Pilih kelas" class="w-full" @update:model-value="v => ubahTugas(b, { kelas: v as TingkatKelas })" />
              </UFormField>
              <template v-else-if="b.tugas.jenis === 'mapel'">
                <UFormField label="Mata pelajaran">
                  <USelect :model-value="b.tugas.mapel" :items="semuaMapel" placeholder="Pilih mapel" class="w-full" @update:model-value="v => gantiMapel(b, String(v))" />
                </UFormField>
                <UFormField label="Mengajar di kelas" class="sm:col-span-2">
                  <USelectMenu
                    :model-value="b.tugas.kelasMapel ?? []"
                    :items="kelasItems"
                    value-key="value"
                    multiple
                    class="w-full"
                    @update:model-value="v => ubahTugas(b, { kelasMapel: [...(v as TingkatKelas[])].sort() })"
                  />
                </UFormField>
              </template>
              <UFormField v-if="b.tugas.jenis !== 'kepsek' && b.tugas.jenis !== 'lain'" label="Jenis guru" class="sm:col-span-2">
                <UInput :model-value="b.tugas.jenisGuru ?? ''" :placeholder="b.jenisGuru" class="w-full" @update:model-value="v => ubahTugas(b, { jenisGuru: String(v) })" />
              </UFormField>
            </div>
            <div class="flex flex-wrap items-start gap-2 lg:col-span-3 lg:justify-end">
              <UBadge color="neutral" variant="subtle" :label="b.tugasLabel" />
              <UBadge :color="b.totalJam ? 'primary' : 'neutral'" variant="subtle" :label="`${b.totalJam} jam/minggu`" />
            </div>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0 overflow-x-auto' }">
        <template #header>
          <p class="font-semibold">Pemetaan jam mengajar per rombel (Lampiran I)</p>
        </template>
        <table class="w-full min-w-180 border-collapse text-sm">
          <thead>
            <tr class="bg-elevated/60 text-xs text-muted">
              <th class="px-3 py-2 text-left">Guru</th>
              <th class="px-2 py-2 text-left">Tugas</th>
              <th v-for="t in TINGKAT_LIST" :key="t" class="px-2 py-2 text-center">Kls {{ kelasRomawi(t) }}</th>
              <th class="px-3 py-2 text-center">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in hasil.baris" :key="b.kunci" class="border-t border-default">
              <td class="px-3 py-1.5">{{ b.nama }}</td>
              <td class="px-2 py-1.5 text-muted">{{ b.tugasLabel }}</td>
              <td v-for="t in TINGKAT_LIST" :key="t" class="px-2 py-1.5 text-center tabular-nums">{{ angka(b.jam[t]) }}</td>
              <td class="px-3 py-1.5 text-center font-semibold tabular-nums">{{ angka(b.totalJam) }}</td>
            </tr>
            <tr class="border-t border-default bg-elevated/40 text-xs">
              <td class="px-3 py-1.5 font-medium" colspan="2">JJM per kelas (struktur jam)</td>
              <td v-for="t in TINGKAT_LIST" :key="t" class="px-2 py-1.5 text-center tabular-nums">{{ hasil.jjmKelas[t] }}</td>
              <td class="px-3 py-1.5 text-center tabular-nums">{{ TINGKAT_LIST.reduce((a, t) => a + hasil.jjmKelas[t], 0) }}</td>
            </tr>
          </tbody>
        </table>
        <p class="px-3 py-2 text-xs text-muted">
          Di tiap kelas, jam mapel diberikan ke guru mapelnya (mis. PAIBP, PJOK); sisanya menjadi beban guru kelas.
          {{ skbm.jadwal ? '' : 'Susun jadwal di tab Jadwal Pelajaran.' }}
        </p>
      </UCard>
    </template>
  </div>
</template>
