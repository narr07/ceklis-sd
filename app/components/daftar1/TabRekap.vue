<script setup lang="ts">
// Tab "Laporan Daftar 1": ringkasan rekap dan lembar cetak. State & aksi dibagi dengan halaman lewat pakaiDaftar1Halaman().
const {
  AGAMA_LIST,
  ROMAWI_MAP,
  TINGKAT_LIST,
  profil,
  daftar1,
  ukuranKertas,
  editLaporanOpen,
  sarprasModalOpen,
  rekap,
  angkaNolAtauStrip,
  labelAcuanDaftar1,
  tanggalLaporanDaftar1,
} = pakaiDaftar1Halaman()
</script>

<template>
<div
  class="space-y-4"
>
  <div class="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default bg-default px-3.5 py-2.5">
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <UBadge
        color="primary"
        variant="subtle"
        :label="ukuranKertas === 'A4' ? 'Kertas: A4 (297 x 210 mm)' : 'Kertas: F4 / Folio (330 x 215 mm)'"
      />
      <span class="text-muted">
        Pratinjau 2 halaman lanskap sesuai standar cetak Laporan Bulanan Sekolah Dasar (Daftar 1).
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        :color="editLaporanOpen ? 'primary' : 'neutral'"
        variant="outline"
        size="xs"
        :icon="editLaporanOpen ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
        :label="editLaporanOpen ? 'Tutup Editor Mutasi & Absensi' : 'Edit Mutasi, Absensi & Sarpras'"
        @click="editLaporanOpen = !editLaporanOpen"
      />
      <UButton
        color="neutral"
        variant="outline"
        size="xs"
        icon="i-lucide-building-2"
        label="Ubah Identitas & Sarpras"
        @click="sarprasModalOpen = true"
      />
    </div>
  </div>

  <Daftar1PrintSheet
    :profil="profil"
    :daftar1="daftar1"
    :rekap="rekap"
    :ukuran-kertas="ukuranKertas"
  />

  <div
    v-if="editLaporanOpen"
    class="no-print space-y-6"
  >
    <div class="rounded-lg border border-default bg-default p-4 print:border-0 print:p-0">
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-default pb-3">
      <div>
        <h2 class="text-base font-bold tracking-tight">LAPORAN BULANAN SEKOLAH DASAR (DAFTAR 1)</h2>
        <p class="text-xs text-muted">
          Tahun Pelajaran {{ daftar1.tahunPelajaran }} | Bulan: {{ daftar1.bulan }} {{ daftar1.tahun }}
        </p>
      </div>
      <div class="no-print flex flex-wrap items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-lucide-building-2"
          label="Ubah Identitas & Sarpras"
          @click="sarprasModalOpen = true"
        />
      </div>
    </div>

    <div class="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
      <div><span class="text-muted">Sekolah Dasar:</span> <strong>{{ profil.sekolah }}</strong></div>
      <div><span class="text-muted">Tahun Pendirian:</span> <strong>{{ daftar1.sarpras.tahunPendirian }}</strong></div>
      <div><span class="text-muted">NSS / NPSN:</span> <strong>{{ daftar1.sarpras.nss }} / {{ profil.npsn }}</strong></div>
      <div><span class="text-muted">Status:</span> <strong>{{ daftar1.sarpras.statusKepemilikanSekolah }} | {{ daftar1.sarpras.kategoriWilayahSekolah }}</strong></div>
      <div><span class="text-muted">Alamat:</span> <strong>{{ profil.alamat }}</strong></div>
      <div><span class="text-muted">Desa / Kelurahan:</span> <strong>{{ profil.desa }} ({{ daftar1.sarpras.kategoriDesa }})</strong></div>
      <div><span class="text-muted">Kecamatan:</span> <strong>{{ profil.kecamatan }}</strong></div>
      <div><span class="text-muted">Kabupaten / Prov:</span> <strong>{{ profil.kabupaten }}, {{ profil.dapodik?.propinsi || 'Jawa Barat' }}</strong></div>
    </div>
  </div>

  <div class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
    <!-- Kolom Kiri: Tabel Murid, Umur, Agama -->
    <div class="space-y-6">
      <!-- Tabel 1: Banyaknya Murid -->
      <UCard :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-sm">1. Banyaknya Murid (Mutasi per Kelas)</p>
            <span class="text-xs text-muted">Isi Keluar / Masuk bulan ini</span>
          </div>
        </template>
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr class="bg-elevated/60 text-center">
              <th
                rowspan="2"
                class="border border-default px-2 py-1.5 text-left min-w-36"
              >
                Uraian
              </th>
              <th
                v-for="t in TINGKAT_LIST"
                :key="`h-${t}`"
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                {{ ROMAWI_MAP[t] }}
              </th>
              <th
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="border border-default px-2 py-1 font-semibold"
              >
                Total
              </th>
            </tr>
            <tr class="bg-elevated/40 text-center">
              <template
                v-for="t in TINGKAT_LIST"
                :key="`lp-${t}`"
              >
                <th class="border border-default px-1 py-1 w-9">L</th>
                <th class="border border-default px-1 py-1 w-9">P</th>
              </template>
              <th class="border border-default px-1 py-1 w-10">L</th>
              <th class="border border-default px-1 py-1 w-10">P</th>
            </tr>
          </thead>
          <tbody class="tabular-nums text-center">
            <tr>
              <td class="border border-default px-2 py-1.5 text-left font-medium">Jumlah Bulan Lalu</td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`bl-${t}`"
              >
                <td class="border border-default px-1 py-1">{{ rekap.perKelas[t].bulanLaluL }}</td>
                <td class="border border-default px-1 py-1">{{ rekap.perKelas[t].bulanLaluP }}</td>
              </template>
              <td class="border border-default px-1 py-1 font-semibold bg-elevated/30">{{ rekap.totalKelas.bulanLaluL }}</td>
              <td class="border border-default px-1 py-1 font-semibold bg-elevated/30">{{ rekap.totalKelas.bulanLaluP }}</td>
              <td class="border border-default px-2 py-1 font-bold bg-elevated/30">{{ rekap.totalKelas.bulanLaluL + rekap.totalKelas.bulanLaluP }}</td>
            </tr>

            <tr>
              <td class="border border-default px-2 py-1 text-left">Keluar Dalam Bulan Ini</td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`kl-${t}`"
              >
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerKelas[t].keluarL"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerKelas[t].keluarP"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.keluarL) }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.keluarP) }}</td>
              <td class="border border-default px-2 py-1 font-semibold bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.keluarL + rekap.totalKelas.keluarP) }}</td>
            </tr>

            <tr>
              <td class="border border-default px-2 py-1 text-left">Masuk Dalam Bulan Ini</td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`ms-${t}`"
              >
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerKelas[t].masukL"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerKelas[t].masukP"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.masukL) }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.masukP) }}</td>
              <td class="border border-default px-2 py-1 font-semibold bg-elevated/30">{{ angkaNolAtauStrip(rekap.totalKelas.masukL + rekap.totalKelas.masukP) }}</td>
            </tr>

            <tr class="font-semibold">
              <td class="border border-default px-2 py-1.5 text-left">Jumlah Penghabisan</td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`ph-${t}`"
              >
                <td class="border border-default px-1 py-1">{{ rekap.perKelas[t].penghabisanL }}</td>
                <td class="border border-default px-1 py-1">{{ rekap.perKelas[t].penghabisanP }}</td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/50">{{ rekap.totalKelas.penghabisanL }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/50">{{ rekap.totalKelas.penghabisanP }}</td>
              <td class="border border-default px-2 py-1 font-bold bg-elevated/50">{{ rekap.totalKelas.total }}</td>
            </tr>

            <tr class="bg-elevated/60 font-bold">
              <td class="border border-default px-2 py-1.5 text-left">Jumlah Bulan Ini</td>
              <td
                v-for="t in TINGKAT_LIST"
                :key="`jb-${t}`"
                colspan="2"
                class="border border-default px-1 py-1"
              >
                {{ rekap.perKelas[t].total }}
              </td>
              <td
                colspan="3"
                class="border border-default px-2 py-1 text-primary"
              >
                {{ rekap.totalKelas.total }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <!-- Tabel 2: Menurut Umur -->
      <UCard :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-sm">2. Banyaknya Murid Menurut Umur (Otomatis)</p>
            <span class="text-xs text-muted">Usia per {{ labelAcuanDaftar1(daftar1) }}</span>
          </div>
        </template>
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr class="bg-elevated/60 text-center">
              <th
                rowspan="2"
                class="border border-default px-2 py-1.5 text-left min-w-28"
              >
                Umur
              </th>
              <th
                v-for="t in TINGKAT_LIST"
                :key="`uh-${t}`"
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                {{ ROMAWI_MAP[t] }}
              </th>
              <th
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="border border-default px-2 py-1 font-semibold"
              >
                Total
              </th>
            </tr>
            <tr class="bg-elevated/40 text-center">
              <template
                v-for="t in TINGKAT_LIST"
                :key="`ulp-${t}`"
              >
                <th class="border border-default px-1 py-1 w-9">L</th>
                <th class="border border-default px-1 py-1 w-9">P</th>
              </template>
              <th class="border border-default px-1 py-1 w-10">L</th>
              <th class="border border-default px-1 py-1 w-10">P</th>
            </tr>
          </thead>
          <tbody class="tabular-nums text-center">
            <tr
              v-for="ur in rekap.umurRows"
              :key="ur.umur"
            >
              <td class="border border-default px-2 py-1 text-left font-medium">
                {{ ur.umur }} tahun
              </td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`u-${ur.umur}-${t}`"
              >
                <td
                  class="border border-default px-1 py-1"
                  :class="ur.perKelas[t].l === 0 ? 'text-muted/50' : ''"
                >
                  {{ ur.perKelas[t].l }}
                </td>
                <td
                  class="border border-default px-1 py-1"
                  :class="ur.perKelas[t].p === 0 ? 'text-muted/50' : ''"
                >
                  {{ ur.perKelas[t].p }}
                </td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30 font-medium">{{ angkaNolAtauStrip(ur.totalL) }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30 font-medium">{{ angkaNolAtauStrip(ur.totalP) }}</td>
              <td class="border border-default px-2 py-1 bg-elevated/30 font-semibold">{{ angkaNolAtauStrip(ur.total) }}</td>
            </tr>
            <tr class="bg-elevated/50 font-semibold">
              <td class="border border-default px-2 py-1.5 text-left">Jumlah</td>
              <template
                v-for="t in TINGKAT_LIST"
                :key="`uj-${t}`"
              >
                <td class="border border-default px-1 py-1">{{ rekap.umurJumlahPerKelas[t].l }}</td>
                <td class="border border-default px-1 py-1">{{ rekap.umurJumlahPerKelas[t].p }}</td>
              </template>
              <td class="border border-default px-1 py-1">{{ rekap.umurGrandTotal.l }}</td>
              <td class="border border-default px-1 py-1">{{ rekap.umurGrandTotal.p }}</td>
              <td class="border border-default px-2 py-1 font-bold">{{ rekap.umurGrandTotal.total }}</td>
            </tr>
            <tr class="bg-elevated/60 font-bold">
              <td class="border border-default px-2 py-1.5 text-left">Total per Kelas</td>
              <td
                v-for="t in TINGKAT_LIST"
                :key="`ut-${t}`"
                colspan="2"
                class="border border-default px-1 py-1"
              >
                {{ rekap.umurJumlahPerKelas[t].total }}
              </td>
              <td
                colspan="3"
                class="border border-default px-2 py-1 text-primary"
              >
                {{ rekap.umurGrandTotal.total }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>

      <!-- Tabel 3: Menurut Agama -->
      <UCard :ui="{ body: 'p-0 overflow-x-auto' }">
        <template #header>
          <p class="font-semibold text-sm">3. Banyaknya Murid Menurut Agama</p>
        </template>
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr class="bg-elevated/60 text-center">
              <th
                rowspan="2"
                class="border border-default px-2 py-1.5 text-left min-w-36"
              >
                Uraian
              </th>
              <th
                v-for="ag in AGAMA_LIST"
                :key="`ah-${ag.key}`"
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                {{ ag.label }}
              </th>
              <th
                colspan="2"
                class="border border-default px-1 py-1 font-semibold"
              >
                Jumlah
              </th>
              <th
                rowspan="2"
                class="border border-default px-2 py-1 font-semibold"
              >
                Total
              </th>
            </tr>
            <tr class="bg-elevated/40 text-center">
              <template
                v-for="ag in AGAMA_LIST"
                :key="`alp-${ag.key}`"
              >
                <th class="border border-default px-1 py-1 w-9">L</th>
                <th class="border border-default px-1 py-1 w-9">P</th>
              </template>
              <th class="border border-default px-1 py-1 w-10">L</th>
              <th class="border border-default px-1 py-1 w-10">P</th>
            </tr>
          </thead>
          <tbody class="tabular-nums text-center">
            <tr>
              <td class="border border-default px-2 py-1 text-left">Jumlah Bulan Lalu</td>
              <template
                v-for="ag in AGAMA_LIST"
                :key="`abl-${ag.key}`"
              >
                <td class="border border-default px-1 py-1">{{ rekap.perAgama[ag.key].bulanLaluL }}</td>
                <td class="border border-default px-1 py-1">{{ rekap.perAgama[ag.key].bulanLaluP }}</td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.bulanLaluL }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.bulanLaluP }}</td>
              <td class="border border-default px-2 py-1 font-semibold bg-elevated/30">{{ rekap.totalAgama.bulanLaluL + rekap.totalAgama.bulanLaluP }}</td>
            </tr>
            <tr>
              <td class="border border-default px-2 py-1 text-left">Keluar Dalam Bulan Ini</td>
              <template
                v-for="ag in AGAMA_LIST"
                :key="`akl-${ag.key}`"
              >
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerAgama[ag.key].keluarL"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerAgama[ag.key].keluarP"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.keluarL }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.keluarP }}</td>
              <td class="border border-default px-2 py-1 bg-elevated/30">{{ rekap.totalAgama.keluarL + rekap.totalAgama.keluarP }}</td>
            </tr>
            <tr>
              <td class="border border-default px-2 py-1 text-left">Masuk Dalam Bulan Ini</td>
              <template
                v-for="ag in AGAMA_LIST"
                :key="`ams-${ag.key}`"
              >
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerAgama[ag.key].masukL"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
                <td class="border border-default p-0.5">
                  <input
                    v-model.number="daftar1.mutasiPerAgama[ag.key].masukP"
                    type="number"
                    min="0"
                    class="w-full rounded bg-transparent text-center py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                </td>
              </template>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.masukL }}</td>
              <td class="border border-default px-1 py-1 bg-elevated/30">{{ rekap.totalAgama.masukP }}</td>
              <td class="border border-default px-2 py-1 bg-elevated/30">{{ rekap.totalAgama.masukL + rekap.totalAgama.masukP }}</td>
            </tr>
            <tr class="bg-elevated/60 font-bold">
              <td class="border border-default px-2 py-1.5 text-left">Jumlah Penghabisan</td>
              <template
                v-for="ag in AGAMA_LIST"
                :key="`aph-${ag.key}`"
              >
                <td class="border border-default px-1 py-1">{{ rekap.perAgama[ag.key].penghabisanL }}</td>
                <td class="border border-default px-1 py-1">{{ rekap.perAgama[ag.key].penghabisanP }}</td>
              </template>
              <td class="border border-default px-1 py-1">{{ rekap.totalAgama.penghabisanL }}</td>
              <td class="border border-default px-1 py-1">{{ rekap.totalAgama.penghabisanP }}</td>
              <td class="border border-default px-2 py-1 text-primary">{{ rekap.totalAgama.total }}</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </div>

    <!-- Kolom Kanan: Bagian A-I & TTD -->
    <div class="space-y-4">
      <UCard :ui="{ body: 'space-y-4 text-xs' }">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-sm">A - F. Tanah, Gedung, Air & Mebeler</p>
            <UButton
              class="no-print"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              label="Edit"
              @click="sarprasModalOpen = true"
            />
          </div>
        </template>

        <div>
          <p class="font-semibold mb-1">A. Tanah</p>
          <div class="grid grid-cols-4 gap-2 rounded border border-default p-2 tabular-nums">
            <div><span class="text-muted block">Luas (m²)</span><strong>{{ daftar1.sarpras.tanahLuasM2 }}</strong></div>
            <div><span class="text-muted block">No. Persil</span><strong>{{ daftar1.sarpras.tanahNoPersil || '-' }}</strong></div>
            <div><span class="text-muted block">Tahun</span><strong>{{ daftar1.sarpras.tanahTahun || '-' }}</strong></div>
            <div><span class="text-muted block">Harga (Rp)</span><strong>{{ daftar1.sarpras.tanahHarga.toLocaleString('id-ID') }}</strong></div>
          </div>
        </div>

        <div>
          <p class="font-semibold mb-1">B. Bangunan / Ruangan (Bgn / Rgn)</p>
          <table class="w-full border-collapse text-center tabular-nums">
            <thead>
              <tr class="bg-elevated/50">
                <th class="border border-default px-1 py-1">Baik</th>
                <th class="border border-default px-1 py-1">Sedang</th>
                <th class="border border-default px-1 py-1">Rusak</th>
                <th class="border border-default px-1 py-1">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-default px-1 py-1">{{ daftar1.sarpras.bangunanBaik.bgn }} / {{ daftar1.sarpras.bangunanBaik.rgn }}</td>
                <td class="border border-default px-1 py-1">{{ daftar1.sarpras.bangunanSedang.bgn }} / {{ daftar1.sarpras.bangunanSedang.rgn }}</td>
                <td class="border border-default px-1 py-1">{{ daftar1.sarpras.bangunanRusak.bgn }} / {{ daftar1.sarpras.bangunanRusak.rgn }}</td>
                <td class="border border-default px-1 py-1 font-semibold">{{ rekap.bangunanJumlah.bgn }} / {{ rekap.bangunanJumlah.rgn }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap justify-between gap-2 rounded border border-default px-2.5 py-1.5">
          <span><strong>C. Sewa/Numpang:</strong> Rp {{ daftar1.sarpras.menyewaRp.toLocaleString('id-ID') }} / {{ daftar1.sarpras.menumpangDi || '-' }}</span>
          <span><strong>E. Air Bersih:</strong> {{ daftar1.sarpras.airBersih || '-' }}</span>
        </div>

        <div>
          <p class="font-semibold mb-1">D. Jenis / Sifat Bangunan</p>
          <table class="w-full border-collapse tabular-nums">
            <thead>
              <tr class="bg-elevated/50 text-center">
                <th class="border border-default px-2 py-1 text-left">Jenis</th>
                <th class="border border-default px-1.5 py-1">P</th>
                <th class="border border-default px-1.5 py-1">SP</th>
                <th class="border border-default px-1.5 py-1">Dr</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="jb in daftar1.sarpras.jenisBangunan"
                :key="jb.nama"
              >
                <td class="border border-default px-2 py-1">{{ jb.nama }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ jb.permanen || '-' }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ jb.semi || '-' }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ jb.darurat || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <p class="font-semibold mb-1">F. Perkakas / Mebeler</p>
          <table class="w-full border-collapse tabular-nums">
            <thead>
              <tr class="bg-elevated/50 text-center">
                <th class="border border-default px-2 py-1 text-left">Barang</th>
                <th class="border border-default px-1.5 py-1">Baik</th>
                <th class="border border-default px-1.5 py-1">Sedang</th>
                <th class="border border-default px-1.5 py-1">Rusak</th>
                <th class="border border-default px-1.5 py-1">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in rekap.mebelerTotal"
                :key="m.nama"
              >
                <td class="border border-default px-2 py-1">{{ m.nama }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ m.baik }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ m.sedang }}</td>
                <td class="border border-default px-1.5 py-1 text-center">{{ m.rusak }}</td>
                <td class="border border-default px-1.5 py-1 text-center font-semibold">{{ m.jumlah }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <UCard :ui="{ body: 'space-y-4 text-xs' }">
        <template #header>
          <p class="font-semibold text-sm">G - I. Guru, Hari Efektif & Absensi Murid</p>
        </template>

        <div>
          <p class="font-semibold mb-1">G. Jumlah Guru (Otomatis dari Data GTK)</p>
          <table class="w-full border-collapse text-center tabular-nums">
            <thead>
              <tr class="bg-elevated/50">
                <th class="border border-default px-1 py-1">Kepsek</th>
                <th class="border border-default px-1 py-1">Gr Kelas</th>
                <th class="border border-default px-1 py-1">PAI</th>
                <th class="border border-default px-1 py-1">PJOK</th>
                <th class="border border-default px-1 py-1">TKS/PW</th>
                <th class="border border-default px-1 py-1">Tendik</th>
                <th class="border border-default px-1 py-1">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr class="font-semibold">
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.kepalaSekolah }}</td>
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.guruKelas }}</td>
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.guruAgama }}</td>
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.guruPenjas }}</td>
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.guruKelasTks }}</td>
                <td class="border border-default px-1 py-1.5">{{ rekap.jumlahGuru.tendik }}</td>
                <td class="border border-default px-1 py-1.5 text-primary">{{ rekap.jumlahGuru.jumlah }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField :label="`H. Hari Efektif (${daftar1.bulan})`">
            <UInput
              v-model.number="daftar1.hariEfektif[daftar1.bulan]"
              type="number"
              min="0"
              max="31"
              size="xs"
            />
          </UFormField>

          <UFormField label="Tanggal Pengesahan Laporan" help="Otomatis tanggal terakhir bulan laporan.">
            <UInput :model-value="tanggalLaporanDaftar1(daftar1)" size="xs" disabled />
          </UFormField>
        </div>

        <div>
          <p class="font-semibold mb-1.5">I. Absensi Murid Bulan Ini</p>
          <div class="grid grid-cols-3 gap-2">
            <UFormField label="Sakit (Org)">
              <UInput
                v-model.number="daftar1.absensi.sakit"
                type="number"
                min="0"
                size="xs"
              />
            </UFormField>
            <UFormField label="Ijin (Org)">
              <UInput
                v-model.number="daftar1.absensi.ijin"
                type="number"
                min="0"
                size="xs"
              />
            </UFormField>
            <UFormField label="Lain-lain (Org)">
              <UInput
                v-model.number="daftar1.absensi.lainLain"
                type="number"
                min="0"
                size="xs"
              />
            </UFormField>
          </div>
          <div class="mt-2 flex items-center justify-between rounded bg-elevated/50 px-3 py-2 font-medium tabular-nums">
            <span>Rata-rata Kehadiran: <strong>{{ rekap.absensi.rataHadir }} Orang</strong></span>
            <span class="text-primary font-bold">{{ rekap.absensi.persenHadir.toFixed(2) }} % Hadir</span>
          </div>
        </div>

        <div class="border-t border-default pt-3 text-right">
          <p>{{ tanggalTtdDaftar1(profil, daftar1) }}</p>
          <p class="text-muted">Kepala {{ profil.sekolah }}</p>
          <p class="mt-10 font-bold underline">{{ profil.kepsek }}</p>
          <p class="text-muted">NIP {{ profil.nipKepsek }}</p>
        </div>
      </UCard>
    </div>
  </div>
  </div>
</div>
</template>
