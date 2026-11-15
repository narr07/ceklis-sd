<script setup lang="ts">
const { profil } = useProfil()
const { memproses, imporFileSptjm, hapusDataDapodik } = useSptjmImport()
const { bukaSpDatadik } = useDesktopBackend()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const tabAktif = ref<'ringkasan' | 'rombel' | 'sarpras' | 'pd'>('ringkasan')
const cariPd = ref('')
const filterRombel = ref('Semua')

const dapodik = computed(() => profil.value.dapodik)

const rombelOptions = computed(() => {
  const list = dapodik.value?.rombel.map(r => r.nama) ?? []
  return ['Semua', ...list]
})

const totalSiswa = computed(() => {
  const rs = dapodik.value?.rombel ?? []
  return rs.reduce(
    (acc, r) => ({
      l: acc.l + r.jumlahL,
      p: acc.p + r.jumlahP,
      total: acc.total + r.jumlahTotal,
    }),
    { l: 0, p: 0, total: 0 },
  )
})

const pdTersaring = computed(() => {
  const list = dapodik.value?.pesertaDidik ?? []
  const q = cariPd.value.trim().toLowerCase()
  return list.filter((pd) => {
    if (filterRombel.value !== 'Semua' && pd.rombel !== filterRombel.value) return false
    if (!q) return true
    return pd.nama.toLowerCase().includes(q)
      || pd.nisn.includes(q)
      || pd.nik.includes(q)
      || pd.namaIbu.toLowerCase().includes(q)
  })
})

function pilihFile() {
  fileInput.value?.click()
}

async function onPilihPdf(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await imporFileSptjm(file)
  input.value = ''
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-file-spreadsheet"
            class="size-5 text-primary"
          />
          <div>
            <p class="font-semibold">Impor Data SPTJM Dapodik (`sp.datadik`)</p>
            <p class="text-xs text-muted">
              Ekstrak otomatis profil sekolah, SK & rekening BOS, sarpras, GTK, rombel, dan peserta didik dari PDF SPTJM.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <!-- Input file native tersembunyi dipicu oleh UButton karena Nuxt UI tidak menyediakan komponen file picker native untuk membaca byte PDF lokal. -->
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf,.pdf"
            class="hidden"
            @change="onPilihPdf"
          >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            label="Unduh dari SP Datadik"
            @click="bukaSpDatadik().catch(e => toast.add({ title: 'Gagal membuka SP Datadik', description: String(e), color: 'warning' }))"
          />
          <UButton
            color="primary"
            icon="i-lucide-file-up"
            :loading="memproses"
            label="Impor SPTJM Dapodik (PDF)"
            @click="pilihFile"
          />
          <UButton
            v-if="dapodik"
            color="error"
            variant="ghost"
            size="sm"
            icon="i-lucide-trash-2"
            label="Hapus Lampiran"
            @click="hapusDataDapodik"
          />
        </div>
      </div>
    </template>

    <UAlert
      v-if="!dapodik"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Belum ada PDF SPTJM yang diimpor"
      description="Unduh SPTJM dari portal sp.datadik, lalu pilih file PDF-nya di tombol atas. Semua pembacaan dilakukan offline langsung di perangkat ini."
    />

    <div
      v-else
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <UBadge
          color="primary"
          variant="subtle"
          :label="`NPSN ${profil.npsn}`"
        />
        <UBadge
          v-if="dapodik.tanggalSptjm"
          color="neutral"
          variant="subtle"
          :label="`Tanggal SPTJM: ${dapodik.tanggalSptjm}`"
        />
        <UBadge
          color="success"
          variant="subtle"
          :label="`${dapodik.gtkDetail.length} GTK`"
        />
        <UBadge
          color="success"
          variant="subtle"
          :label="`${dapodik.rombel.length} Rombel`"
        />
        <UBadge
          color="success"
          variant="subtle"
          :label="`${dapodik.sarpras.length} Sarpras`"
        />
        <UBadge
          color="success"
          variant="subtle"
          :label="`${dapodik.pesertaDidik.length} Siswa`"
        />
        <UButton
          to="/daftar-1"
          color="primary"
          variant="soft"
          size="xs"
          icon="i-lucide-table-properties"
          label="Buka Rekap Daftar 1"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          size="sm"
          :variant="tabAktif === 'ringkasan' ? 'solid' : 'outline'"
          color="neutral"
          label="Ringkasan & BOS"
          @click="tabAktif = 'ringkasan'"
        />
        <UButton
          size="sm"
          :variant="tabAktif === 'rombel' ? 'solid' : 'outline'"
          color="neutral"
          :label="`Rombel & Rekap Siswa (${dapodik.rombel.length})`"
          @click="tabAktif = 'rombel'"
        />
        <UButton
          size="sm"
          :variant="tabAktif === 'sarpras' ? 'solid' : 'outline'"
          color="neutral"
          :label="`Sarana & Prasarana (${dapodik.sarpras.length})`"
          @click="tabAktif = 'sarpras'"
        />
        <UButton
          size="sm"
          :variant="tabAktif === 'pd' ? 'solid' : 'outline'"
          color="neutral"
          :label="`Peserta Didik (${dapodik.pesertaDidik.length})`"
          @click="tabAktif = 'pd'"
        />
      </div>

      <div
        v-if="tabAktif === 'ringkasan'"
        class="grid gap-3 rounded-lg border border-default p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <p class="text-xs text-muted">Status & Kepemilikan</p>
          <p class="font-medium">{{ dapodik.bentukPendidikan }} {{ dapodik.statusSekolah }} ({{ dapodik.statusKepemilikan || '-' }})</p>
        </div>
        <div>
          <p class="text-xs text-muted">SK Pendirian Sekolah</p>
          <p class="font-medium">{{ dapodik.skPendirian || '-' }} ({{ dapodik.tanggalSkPendirian || '-' }})</p>
        </div>
        <div>
          <p class="text-xs text-muted">Rekening BOS</p>
          <p class="font-mono font-medium">{{ dapodik.rekeningBos || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Bank & Cabang/Unit</p>
          <p class="font-medium">{{ dapodik.namaBank || '-' }} - {{ dapodik.namaKcp || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Atas Nama Rekening & MBS</p>
          <p class="font-medium">{{ dapodik.atasNamaRekening || '-' }} • MBS: {{ dapodik.mbs || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">Alamat Lengkap & Koordinat</p>
          <p class="font-medium">
            RT {{ dapodik.rt || '-' }} / RW {{ dapodik.rw || '-' }} {{ dapodik.dusun }} ({{ dapodik.lintang }}, {{ dapodik.bujur }})
          </p>
        </div>
      </div>

      <div
        v-else-if="tabAktif === 'rombel'"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full text-left text-sm">
          <thead class="border-b border-default bg-elevated text-xs uppercase text-muted">
            <tr>
              <th class="px-3 py-2">No</th>
              <th class="px-3 py-2">Rombel</th>
              <th class="px-3 py-2">Ruang Prasarana</th>
              <th class="px-3 py-2">Guru / Wali Kelas</th>
              <th class="px-3 py-2">Kurikulum</th>
              <th class="px-3 py-2 text-right">L</th>
              <th class="px-3 py-2 text-right">P</th>
              <th class="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="(r, idx) in dapodik.rombel"
              :key="r.no"
            >
              <td class="px-3 py-2">{{ idx + 1 }}</td>
              <td class="px-3 py-2 font-medium">{{ r.nama }}</td>
              <td class="px-3 py-2">{{ r.prasarana }}</td>
              <td class="px-3 py-2">{{ r.wali }}</td>
              <td class="px-3 py-2">{{ r.kurikulum }}</td>
              <td class="px-3 py-2 text-right">{{ r.jumlahL }}</td>
              <td class="px-3 py-2 text-right">{{ r.jumlahP }}</td>
              <td class="px-3 py-2 text-right font-semibold">{{ r.jumlahTotal }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t border-default bg-elevated font-semibold">
            <tr>
              <td
                colspan="5"
                class="px-3 py-2 text-right"
              >
                Jumlah Keseluruhan
              </td>
              <td class="px-3 py-2 text-right">{{ totalSiswa.l }}</td>
              <td class="px-3 py-2 text-right">{{ totalSiswa.p }}</td>
              <td class="px-3 py-2 text-right">{{ totalSiswa.total }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        v-else-if="tabAktif === 'sarpras'"
        class="overflow-x-auto rounded-lg border border-default"
      >
        <table class="w-full text-left text-sm">
          <thead class="border-b border-default bg-elevated text-xs uppercase text-muted">
            <tr>
              <th class="px-3 py-2">No</th>
              <th class="px-3 py-2">Jenis Prasarana</th>
              <th class="px-3 py-2">Bangunan</th>
              <th class="px-3 py-2">Nama Ruang</th>
              <th class="px-3 py-2">Lantai</th>
              <th class="px-3 py-2">Ukuran (P × L m)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="s in dapodik.sarpras"
              :key="s.no"
            >
              <td class="px-3 py-2">{{ s.no }}</td>
              <td class="px-3 py-2 font-medium">{{ s.jenis }}</td>
              <td class="px-3 py-2">{{ s.bangunan }}</td>
              <td class="px-3 py-2">{{ s.ruang }}</td>
              <td class="px-3 py-2">{{ s.lantai }}</td>
              <td class="px-3 py-2">{{ s.panjang }} × {{ s.lebar }} m</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="cariPd"
            icon="i-lucide-search"
            placeholder="Cari nama, NISN, NIK, atau nama ibu..."
            class="min-w-64 flex-1"
          />
          <USelect
            v-model="filterRombel"
            :items="rombelOptions"
            class="w-44"
          />
          <span class="text-xs text-muted">Menampilkan {{ pdTersaring.length }} siswa</span>
        </div>

        <div class="max-h-96 overflow-auto rounded-lg border border-default">
          <table class="w-full text-left text-sm">
            <thead class="sticky top-0 border-b border-default bg-elevated text-xs uppercase text-muted">
              <tr>
                <th class="px-3 py-2">No</th>
                <th class="px-3 py-2">Nama</th>
                <th class="px-3 py-2">L/P</th>
                <th class="px-3 py-2">Tgl Lahir</th>
                <th class="px-3 py-2">Nama Ibu</th>
                <th class="px-3 py-2">NIK</th>
                <th class="px-3 py-2">NISN</th>
                <th class="px-3 py-2">Rombel</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="pd in pdTersaring"
                :key="`${pd.no}-${pd.nisn || pd.nama}`"
              >
                <td class="px-3 py-2">{{ pd.no }}</td>
                <td class="px-3 py-2 font-medium">{{ pd.nama }}</td>
                <td class="px-3 py-2">{{ pd.jk }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ pd.tglLahir }}</td>
                <td class="px-3 py-2">{{ pd.namaIbu }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ pd.nik }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ pd.nisn }}</td>
                <td class="px-3 py-2">{{ pd.rombel }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </UCard>
</template>
