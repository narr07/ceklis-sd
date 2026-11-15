<script setup lang="ts">
import type { Profil } from '~/utils/profil'
import { namaBergelar, profilMasihContoh } from '~/utils/profil'

const { profil, reset } = useProfil()
const toast = useToast()

const seksi = ref<'semua' | 'identitas' | 'gtk' | 'sptjm' | 'database'>('semua')
const seksiItems = [
  { label: 'Semua Bagian', value: 'semua' },
  { label: 'Identitas & Kop Surat', value: 'identitas' },
  { label: 'Data GTK', value: 'gtk' },
  { label: 'Impor SPTJM Dapodik', value: 'sptjm' },
  { label: 'Database & Sinkronisasi', value: 'database' },
]

const resetModalOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const grup: { judul: string, fields: [keyof Profil, string][] }[] = [
  { judul: 'Identitas sekolah', fields: [['npsn', 'NPSN'], ['alamat', 'Alamat/blok'], ['desa', 'Desa'], ['kecamatan', 'Kecamatan'], ['kabupaten', 'Kabupaten'], ['kodepos', 'Kode pos'], ['email', 'E-mail'], ['website', 'Website']] },
  { judul: 'Pejabat & penandatangan', fields: [['kepsek', 'Kepala sekolah'], ['nipKepsek', 'NIP kepala sekolah'], ['bendahara', 'Bendahara BOSP'], ['nipBendahara', 'NIP bendahara'], ['operator', 'Operator Dapodik'], ['nipOperator', 'NIP/NUPTK operator'], ['komite', 'Ketua komite sekolah']] },
  { judul: 'Penomoran', fields: [['kota', 'Tempat penandatanganan'], ['kodeSurat', 'Kode sekolah pada nomor surat']] },
]

function tambahGtk() { profil.value.gtk.push({ nama: '', nip: '', nuptk: '', jk: 'L', jabatan: 'Guru Kelas', tmt: '', tmtSekolah: '' }) }

function ekspor() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(profil.value, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `profil-${profil.value.npsn}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
function impor(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  f.text().then((t) => {
    try { profil.value = { ...profil.value, ...JSON.parse(t) }; toast.add({ title: 'Profil diimpor', color: 'success' }) }
    catch { toast.add({ title: 'File tidak valid', color: 'error' }) }
  }).finally(() => {
    input.value = ''
  })
}
function jalankanReset() {
  reset()
  resetModalOpen.value = false
  toast.add({ title: 'Profil dikembalikan ke data contoh', color: 'neutral' })
}
</script>

<template>
  <UDashboardPanel id="profil">
    <template #header>
      <UDashboardNavbar title="Profil & Database Sekolah" :ui="{ right: 'gap-1.5' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="primary" variant="subtle">
            NPSN {{ profil.npsn || '-' }}
          </UBadge>
        </template>

        <template #right>
          <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-download" label="Ekspor JSON" @click="ekspor" />
          <!-- Input file native tersembunyi dipicu oleh UButton karena Nuxt UI tidak memiliki komponen file dialog native. -->
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="impor">
          <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-upload" label="Impor JSON" @click="fileInput?.click()" />
          <UButton color="error" variant="ghost" size="sm" icon="i-lucide-rotate-ccw" label="Data Contoh" @click="resetModalOpen = true" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="overflow-x-auto">
        <UTabs v-model="seksi" :items="seksiItems" :content="false" size="xs" class="w-max" :ui="{ list: 'w-max', trigger: 'shrink-0' }" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <p class="text-sm text-muted">
          Data sekolah, pejabat penandatangan, dan kop surat dipakai di seluruh template dokumen. Perubahan tersimpan otomatis di penyimpanan lokal perangkat.
        </p>

        <UAlert
          v-if="profilMasihContoh(profil)"
          color="warning"
          variant="subtle"
          icon="i-lucide-info"
          title="Profil masih berisi data contoh"
          description="Nama sekolah, pejabat, dan GTK di bawah ini hanya placeholder. Cara tercepat: unduh PDF SPTJM sekolah Anda dari SP Datadik, lalu impor di bagian Impor SPTJM Dapodik. Bisa juga diisi manual atau dari file database (.json)."
          :actions="[{ label: 'Impor SPTJM Dapodik', color: 'warning', variant: 'outline', onClick: () => { seksi = 'sptjm' } }]"
        />

        <DatabaseSyncPanel v-if="seksi === 'semua' || seksi === 'database'" />

        <SptjmImportPanel v-if="seksi === 'semua' || seksi === 'sptjm'" />

        <div v-if="seksi === 'semua' || seksi === 'identitas'" class="grid gap-6 lg:grid-cols-2">
          <UCard v-for="g in grup" :key="g.judul">
            <template #header>
              <p class="font-semibold">{{ g.judul }}</p>
            </template>
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField v-for="[k, label] in g.fields" :key="k" :label="label">
                <UInput v-model="(profil[k] as string)" class="w-full" />
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <p class="font-semibold">Kop surat & logo</p>
            </template>
            <KopSuratEditor preview />
          </UCard>
        </div>

        <UCard v-if="seksi === 'semua' || seksi === 'gtk'">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold">Guru & tenaga kependidikan ({{ profil.gtk.length }})</p>
              <UButton size="sm" icon="i-lucide-plus" label="Tambah" @click="tambahGtk" />
            </div>
          </template>
          <UEmpty
            v-if="!profil.gtk.length"
            icon="i-lucide-users"
            title="Belum ada data guru & tenaga kependidikan"
            description="Tambahkan baris manual atau impor otomatis dari file PDF SPTJM Dapodik."
            :actions="[{ label: 'Tambah GTK', color: 'primary', variant: 'outline', onClick: tambahGtk }]"
          />
          <div v-else class="space-y-2">
            <UAlert
              v-if="profil.gtk.some(g => !g.tmt || !namaBergelar(g.nama))"
              color="warning"
              variant="subtle"
              icon="i-lucide-user-pen"
              title="Lengkapi gelar dan TMT setiap guru"
              description="SPTJM Dapodik tidak memuat gelar dan TMT. Tambahkan gelar langsung di kolom nama (mis. Drs. Ahmad, S.Pd.), lalu isi TMT Pengangkatan agar masa kerja di Daftar 1 terhitung otomatis."
            />
            <div v-for="(g, i) in profil.gtk" :key="i" class="space-y-2 rounded-lg border border-default p-3">
              <div class="grid grid-cols-2 items-end gap-2 md:grid-cols-12">
                <UFormField label="Nama & gelar" class="col-span-2 md:col-span-6">
                  <UInput v-model="g.nama" placeholder="mis. Drs. Ahmad, S.Pd." class="w-full" :color="namaBergelar(g.nama) ? undefined : 'warning'" :highlight="!namaBergelar(g.nama)" />
                </UFormField>
                <UFormField label="L/P" class="md:col-span-2">
                  <USelect v-model="g.jk" :items="['L', 'P']" class="w-full" />
                </UFormField>
                <UFormField label="Jabatan" class="md:col-span-3">
                  <UInput v-model="g.jabatan" class="w-full" />
                </UFormField>
                <div class="flex justify-end md:col-span-1">
                  <UButton color="error" variant="ghost" icon="i-lucide-trash-2" :aria-label="`Hapus ${g.nama || 'GTK'}`" @click="profil.gtk.splice(i, 1)" />
                </div>
              </div>
              <div class="grid grid-cols-2 items-end gap-2 md:grid-cols-12">
                <UFormField label="NIP" class="md:col-span-3">
                  <UInput v-model="g.nip" class="w-full font-mono" />
                </UFormField>
                <UFormField label="NUPTK" class="md:col-span-3">
                  <UInput v-model="g.nuptk" class="w-full font-mono" />
                </UFormField>
                <UFormField label="TMT Pengangkatan" class="md:col-span-3">
                  <UInput v-model="g.tmt" type="date" class="w-full" :color="g.tmt ? undefined : 'warning'" :highlight="!g.tmt" />
                </UFormField>
                <UFormField label="TMT di Sekolah Ini" class="md:col-span-3">
                  <UInput v-model="g.tmtSekolah" type="date" class="w-full" />
                </UFormField>
              </div>
            </div>
          </div>
        </UCard>
        <UModal v-model:open="resetModalOpen" title="Kembalikan profil ke data contoh?">
          <template #body>
            <p class="text-sm text-default">
              Seluruh identitas sekolah, kop surat, daftar GTK, dan lampiran SPTJM pada perangkat ini akan diganti dengan data contoh bawaan. Ekspor database dulu bila ingin menyimpan salinan.
            </p>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="outline" label="Batal" @click="resetModalOpen = false" />
              <UButton color="error" label="Ganti dengan Data Contoh" @click="jalankanReset" />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
