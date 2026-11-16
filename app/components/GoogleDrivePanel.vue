<script setup lang="ts">
import type { InfoDatabaseDrive } from '~/composables/useDesktopBackend'
import { KonflikSinkronError, PerluSandiError, SandiSalahError } from '~/composables/useDesktopBackend'

const toast = useToast()
const { profil } = useProfil()
const { syncConfig } = useSyncConfig()
const backend = useDesktopBackend()
const { isDesktop } = backend
const { status, muatStatus } = useGoogleDrive()

const menghubungkan = ref(false)
const putusOpen = ref(false)
const memutus = ref(false)
const infoDrive = ref<InfoDatabaseDrive | null>(null)
const memuatInfo = ref(false)
const sibuk = ref<'kirim' | 'ambil' | 'sandi' | null>(null)
const konflik = ref<{ diubah: string } | null>(null)
const ambilOpen = ref(false)
const lupakanOpen = ref(false)

const sandiBaru = ref('')
const sandiUlang = ref('')
const SANDI_MIN = 8
const sandiValid = computed(() => sandiBaru.value.length >= SANDI_MIN && sandiBaru.value === sandiUlang.value)

/** Modal kata sandi saat mengambil database di komputer yang belum menyimpan kata sandi. */
const mintaSandi = ref<{ alasan: string } | null>(null)
const sandiAmbil = ref('')

/** Di komputer baru Profil masih kosong: NPSN diketik manual untuk mengambil data dari Drive. */
const npsnManual = ref('')
const npsnProfil = computed(() => profil.value.npsn.trim())
const npsn = computed(() => npsnProfil.value || npsnManual.value.trim())

function formatWaktu(iso?: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  }
  catch { return iso }
}

const pesan = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function muatInfo() {
  if (!status.value?.terhubung || !npsn.value) {
    infoDrive.value = null
    return
  }
  memuatInfo.value = true
  try {
    infoDrive.value = await backend.driveInfoDatabase(npsn.value)
  }
  catch (e) {
    toast.add({ title: 'Gagal membaca Google Drive', description: pesan(e), color: 'error' })
    await muatStatus()
  }
  finally {
    memuatInfo.value = false
  }
}

onMounted(async () => {
  await muatStatus()
  await muatInfo()
})

async function hubungkan() {
  menghubungkan.value = true
  try {
    status.value = await backend.googleMasuk()
    toast.add({ title: 'Google Drive terhubung', description: status.value.email, color: 'success', icon: 'i-lucide-cloud-check' })
    await muatInfo()
  }
  catch (e) {
    toast.add({ title: 'Google Drive belum terhubung', description: pesan(e), color: 'warning' })
  }
  finally {
    menghubungkan.value = false
  }
}

async function bukaFolder() {
  try {
    await backend.driveBukaFolder()
  }
  catch (e) {
    toast.add({ title: 'Gagal membuka Google Drive', description: pesan(e), color: 'error' })
  }
}

async function batalHubungkan() {
  await backend.googleBatalMasuk()
}

async function putuskan() {
  memutus.value = true
  try {
    status.value = await backend.googlePutus()
    infoDrive.value = null
    syncConfig.value.driveVersi = ''
    putusOpen.value = false
    toast.add({ title: 'Google Drive diputuskan', description: 'Token dan kata sandi sinkron dihapus dari komputer ini. Berkas di Drive tetap ada.', color: 'neutral' })
  }
  catch (e) {
    toast.add({ title: 'Gagal memutuskan Google Drive', description: pesan(e), color: 'error' })
  }
  finally {
    memutus.value = false
  }
}

async function simpanSandi() {
  if (!sandiValid.value) return
  sibuk.value = 'sandi'
  try {
    await backend.driveAturSandi(sandiBaru.value)
    sandiBaru.value = ''
    sandiUlang.value = ''
    await muatStatus()
    toast.add({ title: 'Kata sandi sinkron disimpan', description: 'Tersimpan di Credential Manager Windows komputer ini.', color: 'success' })
  }
  catch (e) {
    toast.add({ title: 'Gagal menyimpan kata sandi', description: pesan(e), color: 'error' })
  }
  finally {
    sibuk.value = null
  }
}

async function lupakanSandi() {
  try {
    await backend.driveLupakanSandi()
    lupakanOpen.value = false
    await muatStatus()
    toast.add({ title: 'Kata sandi dihapus dari komputer ini', color: 'neutral' })
  }
  catch (e) {
    toast.add({ title: 'Gagal menghapus kata sandi', description: pesan(e), color: 'error' })
  }
}

async function kirim(paksa = false) {
  if (!npsn.value) {
    toast.add({ title: 'NPSN belum diisi', description: 'Lengkapi NPSN di Profil terlebih dahulu.', color: 'warning' })
    return
  }
  sibuk.value = 'kirim'
  try {
    const snap = kumpulkanDatabaseSnapshot() as unknown as Record<string, unknown>
    const info = await backend.driveKirimDatabase(snap, {
      npsn: npsn.value,
      sekolah: profil.value.sekolah,
      versiDasar: syncConfig.value.driveVersi,
      paksa,
    })
    infoDrive.value = info
    syncConfig.value.driveVersi = info.versi
    syncConfig.value.driveTerakhir = new Date().toISOString()
    konflik.value = null
    toast.add({ title: 'Database terkirim ke Google Drive', description: 'Tersimpan terenkripsi di folder Ceklis SD.', color: 'success', icon: 'i-lucide-cloud-check' })
  }
  catch (e) {
    if (e instanceof KonflikSinkronError) {
      konflik.value = { diubah: e.serverUpdatedAt }
      return
    }
    toast.add({ title: 'Gagal mengirim ke Google Drive', description: pesan(e), color: 'error' })
    await muatStatus()
  }
  finally {
    sibuk.value = null
  }
}

async function ambil(sandi?: string) {
  sibuk.value = 'ambil'
  try {
    const res = await backend.driveAmbilDatabase(npsn.value, sandi)
    terapkanDatabaseSnapshot(res.data)
    syncConfig.value.driveVersi = res.versi
    syncConfig.value.driveTerakhir = new Date().toISOString()
    infoDrive.value = { versi: res.versi, diubah: res.diubah }
    ambilOpen.value = false
    konflik.value = null
    mintaSandi.value = null
    sandiAmbil.value = ''
    await muatStatus()
    toast.add({ title: 'Database diambil dari Google Drive', description: 'Backup "sebelum-sinkron" dibuat sebelum data lokal diganti.', color: 'success' })
  }
  catch (e) {
    if (e instanceof PerluSandiError || e instanceof SandiSalahError) {
      ambilOpen.value = false
      konflik.value = null
      mintaSandi.value = { alasan: e.message }
      return
    }
    toast.add({ title: 'Gagal mengambil dari Google Drive', description: pesan(e), color: 'error' })
  }
  finally {
    sibuk.value = null
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-cloud" class="size-5 text-primary" />
          <p class="font-semibold">Google Drive Sekolah</p>
        </div>
        <UBadge v-if="status?.terhubung" color="success" variant="subtle" icon="i-lucide-check" :label="status.email || 'Terhubung'" />
      </div>
    </template>

    <UAlert
      v-if="!isDesktop"
      color="neutral"
      variant="subtle"
      icon="i-lucide-monitor"
      title="Tersedia di aplikasi desktop"
      description="Penyimpanan ke Google Drive sekolah hanya ada di aplikasi Ceklis SD untuk Windows."
    />

    <USkeleton v-else-if="!status" class="h-24" />

    <UAlert
      v-else-if="!status.tersedia"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Google Drive tidak tersedia di build ini"
      description="Pasang installer resmi dari ceklis.permadi.dev untuk memakai Google Drive."
    />

    <div v-else-if="!status.terhubung" class="space-y-4">
      <ul class="list-disc space-y-1 pl-5 text-sm text-muted">
        <li>Dokumen (PDF, Word, Excel) dan salinan database disimpan di <strong class="text-highlighted">Google Drive akun sekolah Anda sendiri</strong>, di folder <em>Ceklis SD</em>.</li>
        <li>Aplikasi hanya bisa membuka berkas yang dibuatnya sendiri, tidak bisa melihat isi Drive lainnya.</li>
        <li>Database dienkripsi di komputer ini dengan kata sandi sekolah sebelum diunggah.</li>
      </ul>
      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide-log-in" label="Hubungkan Google Drive" :loading="menghubungkan" @click="hubungkan" />
        <UButton v-if="menghubungkan" color="neutral" variant="ghost" label="Batal" @click="batalHubungkan" />
      </div>
      <p v-if="menghubungkan" class="text-xs text-muted">
        Halaman login Google terbuka di browser. Pilih akun sekolah, lalu izinkan akses Drive. Setelah selesai, kembali ke aplikasi ini.
      </p>
      <p class="text-xs text-muted">
        Lihat <ULink to="https://ceklis.permadi.dev/privasi/" target="_blank" class="underline">kebijakan privasi</ULink>.
      </p>
    </div>

    <div v-else class="space-y-5">
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-folder-open" color="neutral" variant="outline" label="Buka Folder di Drive" @click="bukaFolder" />
        <UButton icon="i-lucide-unplug" color="error" variant="ghost" label="Putuskan" @click="putusOpen = true" />
      </div>

      <div class="space-y-3 border-t border-default pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-medium">Sinkron Database (terenkripsi)</p>
            <p class="text-xs text-muted">
              Untuk memindahkan data ke komputer lain atau sebagai cadangan. Semua komputer sekolah memakai kata sandi yang sama.
            </p>
          </div>
          <span v-if="syncConfig.driveTerakhir" class="text-xs text-muted">Terakhir sinkron: {{ formatWaktu(syncConfig.driveTerakhir) }}</span>
        </div>

        <form v-if="!npsnProfil" class="flex flex-wrap items-end gap-2" @submit.prevent="muatInfo">
          <UFormField label="NPSN sekolah" help="Profil di komputer ini masih kosong. Ketik NPSN untuk mencari salinan database sekolah di Drive.">
            <UInput v-model="npsnManual" inputmode="numeric" placeholder="8 digit NPSN" class="w-44" />
          </UFormField>
          <UButton type="submit" color="neutral" variant="outline" icon="i-lucide-search" label="Cari di Drive" :disabled="!npsnManual.trim()" :loading="memuatInfo" />
        </form>

        <p class="text-sm">
          <USkeleton v-if="memuatInfo" class="h-4 w-56" />
          <template v-else-if="!npsn">NPSN belum diisi.</template>
          <template v-else-if="infoDrive">Salinan NPSN {{ npsn }} di Drive: diubah {{ formatWaktu(infoDrive.diubah) }}.</template>
          <template v-else>Belum ada salinan database NPSN {{ npsn }} di Drive.</template>
        </p>

        <div v-if="!status?.adaSandi" class="space-y-3 rounded-lg border border-default p-3">
          <p class="text-sm">
            <template v-if="infoDrive">Database sekolah ini sudah ada di Drive. Klik <strong>Ambil dari Drive</strong> lalu masukkan kata sandi yang dipakai sebelumnya, atau buat kata sandi di bawah bila ingin menimpa.</template>
            <template v-else>Buat kata sandi sinkron untuk sekolah ini.</template>
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Kata sandi sinkron" :hint="`Min. ${SANDI_MIN} karakter`">
              <UInput v-model="sandiBaru" type="password" autocomplete="new-password" class="w-full" />
            </UFormField>
            <UFormField label="Ulangi kata sandi" :error="sandiUlang && sandiUlang !== sandiBaru ? 'Belum sama' : undefined">
              <UInput v-model="sandiUlang" type="password" autocomplete="new-password" class="w-full" />
            </UFormField>
          </div>
          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-key-round"
            description="Catat kata sandi ini di tempat aman. Kata sandi yang hilang tidak dapat dipulihkan, dan database di Drive tidak bisa dibuka tanpanya."
          />
          <UButton icon="i-lucide-key-round" label="Simpan Kata Sandi" :disabled="!sandiValid" :loading="sibuk === 'sandi'" @click="simpanSandi" />
        </div>
        <div v-else class="flex flex-wrap items-center gap-2 text-sm">
          <UBadge color="neutral" variant="subtle" icon="i-lucide-key-round" label="Kata sandi tersimpan di komputer ini" />
          <UButton size="xs" color="neutral" variant="link" label="Lupakan" @click="lupakanOpen = true" />
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-cloud-upload"
            label="Kirim ke Drive"
            :disabled="!status?.adaSandi || !npsnProfil"
            :loading="sibuk === 'kirim'"
            @click="kirim()"
          />
          <UButton
            icon="i-lucide-cloud-download"
            color="neutral"
            variant="outline"
            label="Ambil dari Drive"
            :disabled="!infoDrive"
            :loading="sibuk === 'ambil'"
            @click="ambilOpen = true"
          />
        </div>
      </div>
    </div>

    <UModal v-model:open="putusOpen" title="Putuskan Google Drive?">
      <template #body>
        <p class="text-sm">
          Token akses dan kata sandi sinkron akan dihapus dari komputer ini, dan izin aplikasi dicabut dari akun Google.
          Berkas yang sudah ada di folder <em>Ceklis SD</em> di Drive <strong>tidak</strong> dihapus.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="putusOpen = false" />
          <UButton color="error" label="Putuskan" :loading="memutus" @click="putuskan" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="lupakanOpen" title="Lupakan kata sandi di komputer ini?">
      <template #body>
        <p class="text-sm">Kata sandi dihapus dari komputer ini saja. Untuk mengirim atau mengambil database lagi, kata sandi harus diketik ulang.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="lupakanOpen = false" />
          <UButton color="error" label="Lupakan" @click="lupakanSandi" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="ambilOpen" title="Ambil database dari Google Drive?">
      <template #body>
        <p class="text-sm">
          Data di komputer ini akan <strong>diganti</strong> dengan salinan dari Drive ({{ formatWaktu(infoDrive?.diubah) }}).
          Backup lokal otomatis dibuat terlebih dahulu.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="ambilOpen = false" />
          <UButton label="Ambil & Terapkan" :loading="sibuk === 'ambil'" @click="ambil()" />
        </div>
      </template>
    </UModal>

    <UModal :open="!!mintaSandi" title="Masukkan kata sandi sinkron" @update:open="v => { if (!v) { mintaSandi = null; sandiAmbil = '' } }">
      <template #body>
        <form class="space-y-3" @submit.prevent="ambil(sandiAmbil)">
          <p class="text-sm text-muted">{{ mintaSandi?.alasan }}</p>
          <UFormField label="Kata sandi sinkron sekolah">
            <UInput v-model="sandiAmbil" type="password" autocomplete="current-password" autofocus class="w-full" />
          </UFormField>
          <p class="text-xs text-muted">Bila benar, kata sandi disimpan di komputer ini dan data lokal diganti dengan salinan dari Drive (backup dibuat dulu).</p>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="mintaSandi = null; sandiAmbil = ''" />
          <UButton label="Buka & Terapkan" :disabled="sandiAmbil.length < SANDI_MIN" :loading="sibuk === 'ambil'" @click="ambil(sandiAmbil)" />
        </div>
      </template>
    </UModal>

    <UModal :open="!!konflik" title="Database di Drive sudah berubah" @update:open="v => { if (!v) konflik = null }">
      <template #body>
        <div class="space-y-2 text-sm">
          <p>
            Salinan NPSN {{ npsn }} di Google Drive diubah dari komputer lain ({{ formatWaktu(konflik?.diubah) }})
            sejak komputer ini terakhir sinkron.
          </p>
          <p class="text-muted">
            Pilih <strong>Ambil dari Drive</strong> untuk memakai versi Drive (data komputer ini diganti), atau
            <strong>Timpa Drive</strong> bila versi komputer ini yang benar; perubahan dari komputer lain akan hilang.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="konflik = null" />
          <UButton color="neutral" variant="outline" icon="i-lucide-cloud-download" label="Ambil dari Drive" :loading="sibuk === 'ambil'" @click="ambil()" />
          <UButton color="error" icon="i-lucide-cloud-upload" label="Timpa Drive" :loading="sibuk === 'kirim'" @click="kirim(true)" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
