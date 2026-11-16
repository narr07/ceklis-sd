<script setup lang="ts">
/**
 * Konfirmasi pembaruan SPTJM (mis. awal tahun ajaran: kelas 6 lulus, siswa baru kelas 1 masuk).
 * Muncul saat PDF SPTJM diimpor padahal sudah ada SPTJM sebelumnya.
 */
const { tertunda, konfirmasiPembaruan, batalPembaruan } = useSptjmImport()

const bersihkan = ref(true)
const menerapkan = ref(false)

const r = computed(() => tertunda.value?.ringkasan ?? null)
const lulus = computed(() => r.value?.siswaKeluar.filter(s => s.lulus) ?? [])
const keluarLain = computed(() => r.value?.siswaKeluar.filter(s => !s.lulus) ?? [])
const rincianMasuk = computed(() =>
  Object.entries(r.value?.masukPerTingkat ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([t, n]) => `Kelas ${t}: ${n}`)
    .join(' · '),
)

const daftarRinci = computed(() => {
  const x = r.value
  if (!x) return []
  return [
    { label: `Siswa baru (${x.siswaMasuk.length})`, isi: x.siswaMasuk.map(s => `${s.nama} (${s.rombel || s.tingkat})`) },
    { label: `Lulus dari kelas 6 (${lulus.value.length})`, isi: lulus.value.map(s => s.nama) },
    { label: `Keluar/mutasi (${keluarLain.value.length})`, isi: keluarLain.value.map(s => `${s.nama} (${s.rombel || s.tingkat})`) },
    { label: `Naik kelas (${x.naikKelas.length})`, isi: x.naikKelas.map(s => `${s.nama}: ${s.dari} → ${s.ke}`) },
    { label: `Pindah rombel (${x.pindahRombel.length})`, isi: x.pindahRombel.map(s => `${s.nama}: ${s.dari} → ${s.ke}`) },
    { label: `GTK baru (${x.gtkMasuk.length})`, isi: x.gtkMasuk.map(g => g.nama) },
    { label: `GTK tidak ada lagi (${x.gtkKeluar.length})`, isi: x.gtkKeluar.map(g => g.nama) },
  ].filter(d => d.isi.length)
})

async function terapkan() {
  menerapkan.value = true
  try {
    await konfirmasiPembaruan({ bersihkanSiswaKeluar: bersihkan.value })
  }
  finally {
    menerapkan.value = false
  }
}
</script>

<template>
  <UModal
    :open="!!tertunda"
    :title="tertunda?.ringkasan ? 'Perbarui data dari SPTJM baru' : 'SPTJM dari sekolah lain'"
    :description="tertunda?.ringkasan ? `SPTJM ${tertunda.ringkasan.tanggalLama || '-'} → ${tertunda.ringkasan.tanggalBaru || '-'}` : undefined"
    :ui="{ content: 'sm:max-w-2xl' }"
    @update:open="v => { if (!v) batalPembaruan() }"
  >
    <template #body>
      <div v-if="tertunda && !r" class="space-y-3 text-sm">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="`SPTJM ini milik NPSN ${tertunda.npsnBaru}, bukan ${tertunda.npsnLama}`"
          description="Bila diterapkan, identitas sekolah, GTK, rombel, dan peserta didik di Profil diganti dengan data sekolah tersebut. Gelar dan TMT GTK tidak dibawa."
        />
      </div>

      <div v-else-if="r" class="space-y-4 text-sm">
        <UAlert
          v-if="r.baruLebihLama"
          color="warning"
          variant="subtle"
          icon="i-lucide-calendar-x"
          title="SPTJM ini lebih lama dari yang sedang dipakai"
          :description="`Tanggal SPTJM baru ${r.tanggalBaru}, sedangkan yang dipakai sekarang ${r.tanggalLama}. Pastikan file yang dipilih benar.`"
        />

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs text-muted">Siswa baru</p>
            <p class="text-xl font-bold tabular-nums text-success">+{{ r.siswaMasuk.length }}</p>
            <p v-if="rincianMasuk" class="text-[11px] text-muted">{{ rincianMasuk }}</p>
          </div>
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs text-muted">Lulus / keluar</p>
            <p class="text-xl font-bold tabular-nums text-error">−{{ r.siswaKeluar.length }}</p>
            <p class="text-[11px] text-muted">Lulus kelas 6: {{ lulus.length }}</p>
          </div>
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs text-muted">Naik kelas</p>
            <p class="text-xl font-bold tabular-nums">{{ r.naikKelas.length }}</p>
            <p class="text-[11px] text-muted">Pindah rombel: {{ r.pindahRombel.length }}</p>
          </div>
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs text-muted">GTK</p>
            <p class="text-xl font-bold tabular-nums">+{{ r.gtkMasuk.length }} / −{{ r.gtkKeluar.length }}</p>
            <p class="text-[11px] text-muted">Rombel: {{ r.rombelLama }} → {{ r.rombelBaru }}</p>
          </div>
        </div>

        <UAccordion
          v-if="daftarRinci.length"
          type="multiple"
          :items="daftarRinci.map((d, i) => ({ label: d.label, value: String(i), slot: 'rinci' as const, isi: d.isi }))"
        >
          <template #rinci="{ item }">
            <ul class="max-h-48 list-disc space-y-0.5 overflow-y-auto pb-2 pl-5 text-xs">
              <li v-for="n in item.isi" :key="n">{{ n }}</li>
            </ul>
          </template>
        </UAccordion>
        <p v-else class="text-muted">Tidak ada perubahan siswa maupun GTK.</p>

        <UCheckbox
          v-if="r.siswaKeluar.length"
          v-model="bersihkan"
          label="Hapus isian BB/TB dan agama siswa yang lulus/keluar di Daftar 1"
          description="Isian siswa yang masih aktif tetap dipertahankan."
        />

        <ul class="list-disc space-y-1 pl-5 text-xs text-muted">
          <li>Gelar dan TMT GTK yang sudah diisi di Profil tetap dipertahankan.</li>
          <li>Jumlah siswa per rombel di Daftar 1 dan SK Beban Mengajar mengikuti SPTJM baru.</li>
          <li>Setelah ini, periksa wali kelas dan tugas guru di SK Beban Mengajar, serta periode tahun ajaran.</li>
          <li>Di aplikasi desktop, backup lokal dibuat otomatis sebelum data diperbarui.</li>
        </ul>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Batal" @click="batalPembaruan" />
        <UButton
          :color="r ? 'primary' : 'warning'"
          icon="i-lucide-refresh-cw"
          :label="r ? 'Terapkan Pembaruan' : 'Ganti dengan Sekolah Ini'"
          :loading="menerapkan"
          @click="terapkan"
        />
      </div>
    </template>
  </UModal>
</template>
