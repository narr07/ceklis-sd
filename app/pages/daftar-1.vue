<script setup lang="ts">
// Logika halaman ada di composables/useDaftar1Halaman.ts; tiap tab ada di components/daftar1/.
const {
  daftar1,
  memprosesSptjm,
  tabAktif,
  tabItems,
  ukuranKertas,
  ukuranKertasItems,
  sptjmFileInput,
  xlsxFileInput,
  resetModalOpen,
  memprosesXlsx,
  rekap,
  bbTbTerisiCount,
  onPilihSptjm,
  onPilihXlsx,
  unduhExcel,
  cetakLaporan,
  pdfLangsung,
  membuatPdf,
  simpanPdfLaporan,
  menuDriveDaftar1,
  tanggalLaporanDaftar1,
  tahunItems,
  bulanIni,
  pilihBulanIni,
} = sediakanDaftar1Halaman()
</script>

<template>
  <UDashboardPanel id="daftar-1">
    <template #header>
      <div class="no-print">
        <UDashboardNavbar
          title="Daftar 1: Laporan Bulanan SD"
          :ui="{ right: 'gap-1.5 flex-wrap' }"
        >
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #trailing>
            <UBadge
              :color="rekap.sumberSiswa === 'sptjm' ? 'success' : 'neutral'"
              variant="subtle"
              :label="rekap.sumberSiswa === 'sptjm' ? 'Sumber: SPTJM Dapodik' : 'Sumber: Input Manual'"
            />
          </template>

          <template #right>
            <!-- Input file tersembunyi dipicu oleh UButton karena Nuxt UI tidak menyediakan native file dialog. -->
            <input
              ref="sptjmFileInput"
              type="file"
              accept="application/pdf,.pdf"
              class="hidden"
              @change="onPilihSptjm"
            >
            <input
              ref="xlsxFileInput"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="hidden"
              @change="onPilihXlsx"
            >
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-file-up"
              :loading="memprosesSptjm"
              :label="rekap.sumberSiswa === 'sptjm' ? 'Perbarui SPTJM' : 'Impor SPTJM (PDF)'"
              class="shrink-0"
              @click="sptjmFileInput?.click()"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-sheet"
              :loading="memprosesXlsx"
              label="Impor Excel"
              class="shrink-0"
              @click="xlsxFileInput?.click()"
            />
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              icon="i-lucide-download"
              label="Unduh Excel (.xlsx)"
              class="shrink-0"
              @click="unduhExcel"
            />
            <UButton
              v-if="pdfLangsung"
              color="neutral"
              variant="soft"
              size="sm"
              icon="i-lucide-file-type"
              label="Simpan PDF"
              class="shrink-0"
              :loading="membuatPdf"
              @click="simpanPdfLaporan"
            />
            <SimpanKeDrive :items="menuDriveDaftar1" />
            <UButton
              color="neutral"
              variant="soft"
              size="sm"
              icon="i-lucide-printer"
              :label="pdfLangsung ? 'Cetak' : 'Cetak / PDF'"
              class="shrink-0"
              @click="cetakLaporan"
            />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar class="no-print overflow-x-auto">
          <UTabs
            v-model="tabAktif"
            :items="tabItems"
            :content="false"
            size="xs"
            class="w-max"
            :ui="{ list: 'w-max', trigger: 'shrink-0' }"
          />
          <template #right>
            <UButton
              color="error"
              variant="ghost"
              size="xs"
              icon="i-lucide-rotate-ccw"
              label="Reset"
              class="shrink-0"
              @click="resetModalOpen = true"
            />
          </template>
        </UDashboardToolbar>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 pb-8">
        <!-- Pengaturan Periode & Acuan Usia -->
        <UCard
          class="no-print"
          :ui="{ body: 'p-3 flex flex-wrap items-end gap-3' }"
        >
          <UFormField
            label="Bulan Laporan"
            class="w-36"
          >
            <USelect
              v-model="daftar1.bulan"
              :items="[...BULAN_DAFTAR1]"
              size="sm"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Tahun"
            class="w-28"
          >
            <USelect
              v-model="daftar1.tahun"
              :items="tahunItems"
              size="sm"
              class="w-full"
            />
          </UFormField>

          <UButton
            v-if="!bulanIni"
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-calendar-check"
            label="Bulan Ini"
            @click="pilihBulanIni"
          />

          <UFormField
            label="Tahun Pelajaran"
            class="w-32"
          >
            <UInput
              v-model="daftar1.tahunPelajaran"
              size="sm"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Tanggal Tanda Tangan"
            help="Usia siswa & masa kerja (TMT) dihitung sampai tanggal ini."
            class="w-56"
          >
            <UInput
              :model-value="tanggalLaporanDaftar1(daftar1)"
              icon="i-lucide-pen-line"
              size="sm"
              class="w-full"
              disabled
            />
          </UFormField>

          <UFormField
            label="Ukuran Kertas (Cetak)"
            class="w-56"
          >
            <USelect
              v-model="ukuranKertas"
              :items="ukuranKertasItems"
              size="sm"
              class="w-full"
            />
          </UFormField>
        </UCard>

        <!-- Ringkasan KPI singkat -->
        <div class="no-print grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Total Siswa Aktif</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ rekap.totalKelas.total }}</p>
            <p class="text-[11px] text-muted tabular-nums">L: {{ rekap.totalKelas.penghabisanL }} | P: {{ rekap.totalKelas.penghabisanP }}</p>
          </UCard>

          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Rentang Usia 5-14 Thn</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ rekap.umurGrandTotal.total }}</p>
            <p class="text-[11px] text-muted tabular-nums">Tanpa Tgl Lahir: {{ rekap.tanpaTglLahir }}</p>
          </UCard>

          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Jumlah GTK</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ rekap.jumlahGuru.jumlah }}</p>
            <p class="text-[11px] text-muted">Sumber: {{ rekap.sumberGuru === 'sptjm' ? 'SPTJM' : 'Profil/Excel' }}</p>
          </UCard>

          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Hari Efektif ({{ daftar1.bulan }})</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ rekap.hariEfektifBulanIni }}</p>
            <p class="text-[11px] text-muted">Hari kerja aktif</p>
          </UCard>

          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Kehadiran Murid</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ rekap.absensi.persenHadir.toFixed(1) }}%</p>
            <p class="text-[11px] text-muted tabular-nums">{{ rekap.absensi.rataHadir }} / {{ rekap.absensi.jumlahMurid }} hadir</p>
          </UCard>

          <UCard :ui="{ body: 'p-3.5' }">
            <p class="text-xs text-muted">Data BB / TB Terisi</p>
            <p class="mt-1 text-2xl font-bold tabular-nums">{{ bbTbTerisiCount }}</p>
            <p class="text-[11px] text-muted">Dari {{ rekap.siswa.length }} siswa</p>
          </UCard>
        </div>

        <UAlert
          v-if="rekap.tanpaTglLahir > 0"
          class="no-print"
          color="warning"
          variant="subtle"
          icon="i-lucide-calendar-off"
          :title="`${rekap.tanpaTglLahir} siswa belum memiliki tanggal lahir`"
          description="Siswa tanpa tanggal lahir tetap dihitung pada rekap kelas, namun belum masuk ke baris usia 5-14 tahun. Lengkapi tanggal lahirnya di tab Data Usia & BB/TB atau impor PDF SPTJM terbaru."
        />

        <!-- TAB 1: LAPORAN DAFTAR 1 -->
        <Daftar1TabRekap v-if="tabAktif === 'rekap'" />

        <!-- TAB 2: KEADAAN GURU (19 KOLOM) -->
        <Daftar1TabGuru v-else-if="tabAktif === 'guru'" />

        <!-- TAB 3: DATA USIA & BB/TB SISWA -->
        <Daftar1TabSiswa v-else-if="tabAktif === 'siswa'" />

        <!-- TAB 4: DAFTAR ABSEN KELAS -->
        <Daftar1TabAbsen v-else-if="tabAktif === 'absen'" />

        <Daftar1DialogEdit />
      </div>
    </template>
  </UDashboardPanel>
</template>

<style>
@media print {
  aside,
  header,
  nav,
  [role="banner"],
  .no-print {
    display: none !important;
  }

  html,
  body,
  #__nuxt {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
}
</style>
