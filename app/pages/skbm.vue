<script setup lang="ts">
import { buildDocx } from '~/utils/docx'
import { buildSkbmBlocks } from '~/utils/skbm'
import { buildJadwalBlocks } from '~/utils/jadwal'

// Logika & data ada di composables/useSkbmHalaman.ts; tiap tab di components/skbm/.
const { profil, skbm, hasil, bentrok } = useSkbmHalaman()
const toast = useToast()

type Tab = 'identitas' | 'guru' | 'struktur' | 'siswa' | 'bimbingan' | 'jadwal' | 'pratinjau'
const tab = ref<Tab>('guru')
const tabItems = [
  { label: 'Identitas SK', value: 'identitas', icon: 'i-lucide-file-badge' },
  { label: 'Guru & Tugas', value: 'guru', icon: 'i-lucide-users' },
  { label: 'Struktur Jam', value: 'struktur', icon: 'i-lucide-list-ordered' },
  { label: 'Jumlah Siswa', value: 'siswa', icon: 'i-lucide-baby' },
  { label: 'Bimbingan', value: 'bimbingan', icon: 'i-lucide-tent' },
  { label: 'Jadwal Pelajaran', value: 'jadwal', icon: 'i-lucide-calendar-range' },
  { label: 'Pratinjau', value: 'pratinjau', icon: 'i-lucide-eye' },
]

const dokumen = ref<'sk' | 'jadwal'>('sk')
const dokumenItems = [
  { label: 'SK + Lampiran I–IV', value: 'sk' },
  { label: 'Jadwal Pelajaran', value: 'jadwal' },
]
const blokSk = computed(() => buildSkbmBlocks(profil.value, skbm.value, hasil.value))
const blokJadwal = computed(() => (skbm.value.jadwal
  ? buildJadwalBlocks(profil.value, skbm.value.jadwal, skbm.value.pengaturanJadwal, hasil.value, skbm.value)
  : []))

const { isDesktop, simpanPdf } = useCetakDokumen()
const membuatPdf = ref<'sk' | 'jadwal' | null>(null)

async function pdf(jenis: 'sk' | 'jadwal') {
  if (jenis === 'jadwal' && !skbm.value.jadwal) {
    toast.add({ title: 'Jadwal belum disusun', description: 'Buka tab Jadwal Pelajaran lalu klik Susun Jadwal Otomatis.', color: 'warning' })
    tab.value = 'jadwal'
    return
  }
  membuatPdf.value = jenis
  try {
    const path = await simpanPdf(
      namaBerkas(jenis === 'sk' ? 'SK_Beban_Mengajar' : 'Jadwal_Pelajaran'),
      jenis === 'sk' ? blokSk.value : blokJadwal.value,
    )
    if (path) toast.add({ title: 'PDF tersimpan', description: path, color: 'success', icon: 'i-lucide-check' })
  }
  catch (e) {
    toast.add({ title: 'Gagal membuat PDF', description: String(e), color: 'error' })
  }
  finally {
    membuatPdf.value = null
  }
}

const menuPdf = [[
  { label: 'SK + Lampiran I–IV', icon: 'i-lucide-file-badge', onSelect: () => pdf('sk') },
  { label: 'Jadwal Pelajaran', icon: 'i-lucide-calendar-range', onSelect: () => pdf('jadwal') },
]]

const drive = useGoogleDrive()
const folderDrive = computed(() => folderPeriodeDrive(skbm.value.tahunAjaran, skbm.value.semester))
function keDrive(jenis: 'sk' | 'jadwal', format: 'pdf' | 'docx') {
  if (jenis === 'jadwal' && !skbm.value.jadwal) {
    toast.add({ title: 'Jadwal belum disusun', description: 'Buka tab Jadwal Pelajaran lalu klik Susun Jadwal Otomatis.', color: 'warning' })
    tab.value = 'jadwal'
    return
  }
  const nama = namaBerkas(jenis === 'sk' ? 'SK_Beban_Mengajar' : 'Jadwal_Pelajaran')
  const blok = jenis === 'sk' ? blokSk.value : blokJadwal.value
  if (format === 'pdf') return drive.simpanPdf(nama, folderDrive.value, blok)
  return drive.simpanBerkas(() => buildDocx(blok, profil.value), nama, 'docx', folderDrive.value)
}
const menuDrive = [
  [
    { type: 'label' as const, label: 'SK + Lampiran I–IV' },
    { label: 'PDF', icon: 'i-lucide-file-type', onSelect: () => keDrive('sk', 'pdf') },
    { label: 'Word (.docx)', icon: 'i-lucide-file-text', onSelect: () => keDrive('sk', 'docx') },
  ],
  [
    { type: 'label' as const, label: 'Jadwal Pelajaran' },
    { label: 'PDF', icon: 'i-lucide-file-type', onSelect: () => keDrive('jadwal', 'pdf') },
    { label: 'Word (.docx)', icon: 'i-lucide-file-text', onSelect: () => keDrive('jadwal', 'docx') },
  ],
]

const mengunduh = ref<'sk' | 'jadwal' | null>(null)
const namaBerkas = (awal: string) =>
  `${awal}_${profil.value.sekolah}_${skbm.value.tahunAjaran}_Semester_${skbm.value.semester === 'genap' ? '2' : '1'}`
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')

async function unduh(jenis: 'sk' | 'jadwal') {
  if (jenis === 'jadwal' && !skbm.value.jadwal) {
    toast.add({ title: 'Jadwal belum disusun', description: 'Buka tab Jadwal Pelajaran lalu klik Susun Jadwal Otomatis.', color: 'warning' })
    tab.value = 'jadwal'
    return
  }
  mengunduh.value = jenis
  try {
    const blob = await buildDocx(jenis === 'sk' ? blokSk.value : blokJadwal.value, profil.value)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${namaBerkas(jenis === 'sk' ? 'SK_Beban_Mengajar' : 'Jadwal_Pelajaran')}.docx`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast.add({ title: 'Dokumen diunduh', description: 'Buka di Word/LibreOffice untuk dicetak atau disunting.', color: 'success', icon: 'i-lucide-check' })
  }
  catch (e) {
    toast.add({ title: 'Gagal membuat dokumen', description: String(e), color: 'error' })
  }
  finally {
    mengunduh.value = null
  }
}
</script>

<template>
  <UDashboardPanel id="skbm">
    <template #header>
      <UDashboardNavbar title="SK Beban Mengajar & Jadwal" :ui="{ right: 'gap-1.5 flex-wrap' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge
            v-if="skbm.jadwal"
            :color="bentrok.length ? 'error' : 'success'"
            variant="subtle"
            :label="bentrok.length ? `${bentrok.length} bentrok` : 'Jadwal tanpa bentrok'"
          />
        </template>

        <template #right>
          <UDropdownMenu :items="menuPdf">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-file-type"
              trailing-icon="i-lucide-chevron-down"
              :label="isDesktop ? 'Simpan PDF' : 'Cetak / PDF'"
              :loading="!!membuatPdf"
            />
          </UDropdownMenu>
          <SimpanKeDrive :items="menuDrive" />
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-calendar-range"
            label="Unduh Jadwal"
            :loading="mengunduh === 'jadwal'"
            @click="unduh('jadwal')"
          />
          <UButton
            size="sm"
            icon="i-lucide-file-down"
            label="Unduh SK (.docx)"
            :loading="mengunduh === 'sk'"
            @click="unduh('sk')"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="overflow-x-auto">
        <UTabs v-model="tab" :items="tabItems" :content="false" size="xs" class="w-max" :ui="{ list: 'w-max', trigger: 'shrink-0' }" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-4 pb-8">
        <UAlert
          v-if="profilMasihContoh(profil)"
          color="warning"
          variant="subtle"
          icon="i-lucide-info"
          title="Profil masih berisi data contoh"
          description="Impor SPTJM Dapodik di halaman Profil agar daftar guru, jumlah siswa, dan kop surat terisi data sekolah Anda."
          :actions="[{ label: 'Buka Profil', to: '/profil', color: 'warning', variant: 'outline' }]"
        />

        <SkbmTabIdentitas v-if="tab === 'identitas'" />
        <SkbmTabGuru v-else-if="tab === 'guru'" />
        <SkbmTabStruktur v-else-if="tab === 'struktur'" />
        <SkbmTabSiswa v-else-if="tab === 'siswa'" />
        <SkbmTabBimbingan v-else-if="tab === 'bimbingan'" />
        <SkbmTabJadwal v-else-if="tab === 'jadwal'" />
        <div v-else class="space-y-4">
          <UTabs v-model="dokumen" :items="dokumenItems" :content="false" size="sm" class="w-max" />
          <UEmpty
            v-if="dokumen === 'jadwal' && !skbm.jadwal"
            icon="i-lucide-calendar-range"
            title="Jadwal belum disusun"
            :actions="[{ label: 'Ke tab Jadwal Pelajaran', onClick: () => { tab = 'jadwal' } }]"
          />
          <DocPreview v-else :blocks="dokumen === 'sk' ? blokSk : blokJadwal" :profil="profil" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
