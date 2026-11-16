<script setup lang="ts">
import type { TingkatKelas } from '~/utils/daftar1'
import { TINGKAT_LIST } from '~/utils/daftar1'
import { HARI, jumlahBarisJam, pengajarMapel, susunJadwal, waktuIstirahat, waktuJam, waktuKegiatanAwal } from '~/utils/jadwal'

const { skbm, hasil, bentrok, selisihJam, kelasRomawi } = useSkbmHalaman()
const toast = useToast()

const kelasAktif = ref<TingkatKelas>('1')
const kelasTabs = TINGKAT_LIST.map(t => ({ label: `Kelas ${kelasRomawi(t)}`, value: t }))
const konfirmasiSusun = ref(false)
const KOSONG = '__kosong__'

const p = computed(() => skbm.value.pengaturanJadwal)
const jadwalKelas = computed(() => skbm.value.jadwal?.[kelasAktif.value] ?? null)
/** Baris jam yang ditampilkan: sampai batas jam terpanjang, atau lebih bila jadwal sudah terisi lebih jauh. */
const barisJam = computed(() => {
  const n = jadwalKelas.value ? jumlahBarisJam(jadwalKelas.value) : 0
  return Math.max(n, ...p.value.maksJam)
})
const mapelItems = computed(() => [
  { label: '— kosong —', value: KOSONG },
  ...skbm.value.strukturJam[kelasAktif.value].filter(m => m.mapel).map(m => ({ label: m.mapel, value: m.mapel })),
])

/** Sel yang bentrok: kunci "kelas-hari-jam". */
const selBentrok = computed(() => new Set(bentrok.value.flatMap(b => b.kelas.map(k => `${k}-${b.hari}-${b.jam}`))))
const bentrokKelasAktif = computed(() => bentrok.value.filter(b => b.kelas.includes(kelasAktif.value)))

const rekapKelas = computed(() => {
  const t = kelasAktif.value
  return skbm.value.strukturJam[t].filter(m => m.mapel).map((m) => {
    const diJadwal = (skbm.value.jadwal?.[t] ?? []).flat().filter(x => x === m.mapel).length
    return { mapel: m.mapel, jjm: m.jjm, diJadwal, guru: pengajarMapel(hasil.value.baris, t, m.mapel)?.nama ?? '—' }
  })
})

function ubahSel(h: number, s: number, v: unknown) {
  const j = skbm.value.jadwal
  if (!j) return
  const baris = j[kelasAktif.value][h]!
  while (baris.length <= s) baris.push('')
  baris[s] = v === KOSONG ? '' : String(v)
}

function mintaSusun() {
  if (skbm.value.jadwal) konfirmasiSusun.value = true
  else susun()
}

function susun() {
  konfirmasiSusun.value = false
  const { jadwal, gagal } = susunJadwal(skbm.value.strukturJam, hasil.value.baris, skbm.value.pengaturanJadwal)
  skbm.value.jadwal = jadwal
  if (gagal.length) {
    toast.add({
      title: 'Sebagian jam tidak muat',
      description: gagal.map(g => `Kelas ${kelasRomawi(g.kelas)} ${g.mapel}: ${g.jam} jam`).join('; ') + '. Tambah batas jam per hari atau kurangi JJM.',
      color: 'warning',
      duration: 10000,
    })
  }
  else {
    toast.add({ title: 'Jadwal tersusun', description: 'Guru mapel tidak bentrok dan jumlah jam sesuai struktur JJM.', color: 'success' })
  }
}

const awal = computed(() => waktuKegiatanAwal(p.value))
const ist = computed(() => waktuIstirahat(p.value))
const adaKegiatanAwal = computed(() => p.value.durasiKegiatanAwal > 0 && p.value.kegiatanAwal.some(Boolean))
</script>

<template>
  <div class="space-y-4">
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-semibold">Pengaturan jam (5 hari pembelajaran)</p>
            <p class="text-xs text-muted">Batas jam per hari dipakai saat menyusun otomatis; total JJM tiap kelas dibagi serata mungkin.</p>
          </div>
          <UButton icon="i-lucide-wand-sparkles" :label="skbm.jadwal ? 'Susun Ulang Otomatis' : 'Susun Jadwal Otomatis'" @click="mintaSusun" />
        </div>
      </template>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Jam ke-1 mulai">
          <UInput v-model="skbm.pengaturanJadwal.jamMulai" type="time" class="w-full" />
        </UFormField>
        <UFormField label="Lama 1 jam pelajaran (menit)">
          <UInput v-model.number="skbm.pengaturanJadwal.durasi" type="number" min="20" max="60" class="w-full" />
        </UFormField>
        <UFormField label="Istirahat setelah jam ke-">
          <UInput v-model.number="skbm.pengaturanJadwal.istirahatSetelah" type="number" min="0" max="10" class="w-full" />
        </UFormField>
        <UFormField label="Lama istirahat (menit)">
          <UInput v-model.number="skbm.pengaturanJadwal.durasiIstirahat" type="number" min="0" max="90" class="w-full" />
        </UFormField>
      </div>
      <div class="mt-4 grid gap-3 sm:grid-cols-5">
        <div v-for="(hari, h) in HARI" :key="hari" class="space-y-2 rounded-lg border border-default p-2">
          <p class="text-sm font-medium">{{ hari }}</p>
          <UFormField label="Maks. jam">
            <UInput v-model.number="skbm.pengaturanJadwal.maksJam[h]" type="number" min="0" max="12" size="sm" class="w-full" />
          </UFormField>
          <UFormField label="Kegiatan awal">
            <UInput v-model="skbm.pengaturanJadwal.kegiatanAwal[h]" size="sm" placeholder="mis. Pembiasaan" class="w-full" />
          </UFormField>
        </div>
      </div>
    </UCard>

    <UEmpty
      v-if="!skbm.jadwal"
      icon="i-lucide-calendar-range"
      title="Jadwal belum disusun"
      description="Pastikan tugas guru dan struktur jam sudah benar, lalu klik Susun Jadwal Otomatis. Jam guru PAI, PJOK, dan guru mapel lain ditempatkan lebih dulu agar tidak bentrok."
      :actions="[{ label: 'Susun Jadwal Otomatis', icon: 'i-lucide-wand-sparkles', onClick: mintaSusun }]"
    />

    <template v-else>
      <UAlert
        v-if="bentrok.length"
        color="error"
        variant="subtle"
        icon="i-lucide-calendar-x"
        :title="`${bentrok.length} jadwal bentrok`"
      >
        <template #description>
          <ul class="list-disc space-y-0.5 pl-4">
            <li v-for="(b, i) in bentrok" :key="i">{{ HARI[b.hari] }} jam ke-{{ b.jam }}: {{ b.guru }} di Kelas {{ b.kelas.map(kelasRomawi).join(' dan ') }}</li>
          </ul>
        </template>
      </UAlert>
      <UAlert v-else color="success" variant="subtle" icon="i-lucide-calendar-check" title="Tidak ada guru yang bentrok" />

      <UAlert
        v-if="selisihJam.length"
        color="warning"
        variant="subtle"
        icon="i-lucide-scale"
        title="Jumlah jam di jadwal belum sama dengan struktur JJM"
      >
        <template #description>
          <ul class="list-disc space-y-0.5 pl-4">
            <li v-for="(s, i) in selisihJam" :key="i">Kelas {{ kelasRomawi(s.kelas) }} {{ s.mapel }}: {{ s.jadwal }} jam di jadwal, seharusnya {{ s.jjm }}</li>
          </ul>
        </template>
      </UAlert>

      <UCard :ui="{ body: 'p-0 sm:p-0 overflow-x-auto' }">
        <template #header>
          <UTabs v-model="kelasAktif" :items="kelasTabs" :content="false" size="xs" class="w-max" :ui="{ list: 'w-max', trigger: 'shrink-0' }" />
        </template>
        <table class="w-full min-w-205 border-collapse text-sm">
          <thead>
            <tr class="bg-elevated/60 text-xs text-muted">
              <th class="w-10 px-2 py-2 text-center">Jam</th>
              <th class="w-28 px-2 py-2 text-center">Waktu</th>
              <th v-for="hari in HARI" :key="hari" class="px-2 py-2 text-center">{{ hari }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="adaKegiatanAwal" class="border-t border-default bg-info/5 text-xs">
              <td class="px-2 py-1.5 text-center">–</td>
              <td class="px-2 py-1.5 text-center tabular-nums">{{ awal.mulai }}–{{ awal.selesai }}</td>
              <td v-for="(_, h) in HARI" :key="h" class="px-2 py-1.5 text-center">{{ skbm.pengaturanJadwal.kegiatanAwal[h] }}</td>
            </tr>
            <template v-for="s in barisJam" :key="s">
              <tr v-if="skbm.pengaturanJadwal.istirahatSetelah > 0 && s === skbm.pengaturanJadwal.istirahatSetelah + 1" class="border-t border-default bg-error/5 text-xs font-semibold">
                <td class="px-2 py-1.5 text-center">–</td>
                <td class="px-2 py-1.5 text-center tabular-nums">{{ ist.mulai }}–{{ ist.selesai }}</td>
                <td :colspan="HARI.length" class="px-2 py-1.5 text-center tracking-widest">ISTIRAHAT</td>
              </tr>
              <tr class="border-t border-default">
                <td class="px-2 py-1 text-center tabular-nums">{{ s }}</td>
                <td class="px-2 py-1 text-center text-xs tabular-nums text-muted">{{ waktuJam(skbm.pengaturanJadwal, s).mulai }}–{{ waktuJam(skbm.pengaturanJadwal, s).selesai }}</td>
                <td
                  v-for="(_, h) in HARI"
                  :key="h"
                  class="px-1 py-1"
                  :class="selBentrok.has(`${kelasAktif}-${h}-${s}`) ? 'bg-error/15' : ''"
                >
                  <USelect
                    :model-value="jadwalKelas?.[h]?.[s - 1] || KOSONG"
                    :items="mapelItems"
                    size="xs"
                    variant="ghost"
                    class="w-full"
                    :color="selBentrok.has(`${kelasAktif}-${h}-${s}`) ? 'error' : undefined"
                    :aria-label="`${HARI[h]} jam ke-${s}`"
                    @update:model-value="v => ubahSel(h, s - 1, v)"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </UCard>

      <UCard :ui="{ body: 'p-0 sm:p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold">Rekap Kelas {{ kelasRomawi(kelasAktif) }}</p>
            <UBadge v-if="bentrokKelasAktif.length" color="error" variant="subtle" :label="`${bentrokKelasAktif.length} bentrok`" />
          </div>
        </template>
        <table class="w-full min-w-120 border-collapse text-sm">
          <thead>
            <tr class="bg-elevated/60 text-xs text-muted">
              <th class="px-3 py-2 text-left">Mapel</th>
              <th class="px-3 py-2 text-center">JJM</th>
              <th class="px-3 py-2 text-center">Di jadwal</th>
              <th class="px-3 py-2 text-left">Guru</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rekapKelas" :key="r.mapel" class="border-t border-default">
              <td class="px-3 py-1.5">{{ r.mapel }}</td>
              <td class="px-3 py-1.5 text-center tabular-nums">{{ r.jjm }}</td>
              <td class="px-3 py-1.5 text-center tabular-nums" :class="r.diJadwal === r.jjm ? '' : 'font-semibold text-warning'">{{ r.diJadwal }}</td>
              <td class="px-3 py-1.5 text-muted">{{ r.guru }}</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </template>

    <UModal v-model:open="konfirmasiSusun" title="Susun ulang jadwal?">
      <template #body>
        <p class="text-sm">Jadwal yang ada, termasuk perubahan manual, diganti dengan susunan otomatis yang baru.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="konfirmasiSusun = false" />
          <UButton color="warning" label="Susun Ulang" @click="susun" />
        </div>
      </template>
    </UModal>
  </div>
</template>
