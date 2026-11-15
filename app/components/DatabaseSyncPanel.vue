<script setup lang="ts">
import type { BackupEntry, StorageStatus } from '~/composables/useDesktopBackend'
import { KonflikSinkronError } from '~/composables/useDesktopBackend'

const toast = useToast()
const { profil } = useProfil()
const { syncConfig } = useSyncConfig()
const {
  isDesktop,
  isWebNitro,
  getStorageStatus,
  saveDatabase,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  exportDatabaseFile,
  importDatabaseFile,
  openDataFolder,
  kirimKeServer,
  ambilDariServer,
} = useDesktopBackend()

const targetServerUrl = computed(() =>
  syncConfig.value.serverUrl.trim() || (isWebNitro.value ? '/api/ceklis' : ''),
)

const runtimeBadgeLabel = computed(() => {
  if (isDesktop.value) return 'Software Desktop (Tauri Frontend + Rust)'
  if (isWebNitro.value) return 'Website + Server Sinkron'
  return 'Situs Statis (Data di Browser)'
})

const runtimeAlertTitle = computed(() => {
  if (isDesktop.value) return 'Software desktop offline dengan database di disk laptop'
  if (isWebNitro.value) return 'Website dengan server sinkronisasi (/api/ceklis) dan penyimpanan browser'
  return 'Situs statis: data hanya tersimpan di browser perangkat ini'
})

const runtimeAlertDescription = computed(() => {
  if (isDesktop.value) {
    return 'Seluruh profil, checklist, catatan, dan isian template disimpan ke disk laptop. Salinan bisa dikirim ke server sekolah bila diperlukan.'
  }
  if (isWebNitro.value) {
    return 'Perubahan tersimpan otomatis di browser perangkat ini dan dapat dikirim ke server (/api/ceklis) dengan token khusus NPSN sekolah agar bisa dibuka dari perangkat lain.'
  }
  return 'Data tersimpan di browser perangkat ini dan bisa hilang bila data situs dibersihkan. Unduh file database (.json) secara berkala sebagai cadangan.'
})

const status = ref<StorageStatus | null>(null)
const backups = ref<BackupEntry[]>([])
const busy = ref(false)
const syncBusy = ref<'push' | 'pull' | null>(null)
const restoreTarget = ref<BackupEntry | null>(null)
const deleteTarget = ref<BackupEntry | null>(null)
const confirmPullOpen = ref(false)
const konflik = ref<{ serverUpdatedAt: string } | null>(null)
const webImportInput = ref<HTMLInputElement | null>(null)

function formatUkuran(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatWaktu(iso?: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  }
  catch { return iso }
}

async function muatInfoDesktop() {
  if (!isDesktop.value) return
  try {
    const [st, list] = await Promise.all([getStorageStatus(), listBackups()])
    status.value = st
    backups.value = list
  }
  catch (e) {
    toast.add({ title: 'Gagal membaca status penyimpanan', description: String(e), color: 'error' })
  }
}

onMounted(() => {
  muatInfoDesktop()
})

async function simpanDanBackup() {
  if (!isDesktop.value) return
  busy.value = true
  try {
    const snap = kumpulkanDatabaseSnapshot()
    await saveDatabase(snap as unknown as Record<string, unknown>)
    const entry = await createBackup()
    await muatInfoDesktop()
    toast.add({ title: 'Backup lokal dibuat', description: entry.filename, color: 'success' })
  }
  catch (e) {
    toast.add({ title: 'Gagal membuat backup', description: String(e), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function bukaFolder() {
  try {
    await openDataFolder()
  }
  catch (e) {
    toast.add({ title: 'Gagal membuka folder data', description: String(e), color: 'error' })
  }
}

async function eksporDb() {
  const snap = kumpulkanDatabaseSnapshot() as unknown as Record<string, unknown>
  const defaultName = `ceklis-sd-${profil.value.npsn || 'sekolah'}.json`

  if (isDesktop.value) {
    busy.value = true
    try {
      const savedPath = await exportDatabaseFile(snap, defaultName)
      if (savedPath) {
        toast.add({ title: 'Database diekspor', description: savedPath, color: 'success' })
      }
    }
    catch (e) {
      toast.add({ title: 'Gagal mengekspor database', description: String(e), color: 'error' })
    }
    finally {
      busy.value = false
    }
    return
  }

  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  toast.add({ title: 'Database lengkap diunduh', color: 'success' })
}

async function imporDbDesktop() {
  busy.value = true
  try {
    const imported = await importDatabaseFile()
    if (!imported) return
    terapkanDatabaseSnapshot(imported)
    await muatInfoDesktop()
    toast.add({ title: 'Database diimpor', description: 'Backup pengaman otomatis tersimpan sebelum menimpa data lama.', color: 'success' })
  }
  catch (e) {
    toast.add({ title: 'Gagal mengimpor database', description: String(e), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

function imporDbWeb(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  f.text().then((txt) => {
    try {
      const parsed = JSON.parse(txt)
      if (!terapkanDatabaseSnapshot(parsed)) throw new Error('Struktur JSON tidak dikenali.')
      toast.add({ title: 'Database berhasil diimpor', description: 'Data di perangkat ini diganti dengan isi file.', color: 'success' })
    }
    catch (err) {
      toast.add({ title: 'File database tidak valid', description: String(err), color: 'error' })
    }
  }).finally(() => {
    if (webImportInput.value) webImportInput.value.value = ''
  })
}

async function konfirmasiPulihkan() {
  if (!restoreTarget.value) return
  const filename = restoreTarget.value.filename
  busy.value = true
  try {
    const data = await restoreBackup(filename)
    terapkanDatabaseSnapshot(data)
    restoreTarget.value = null
    await muatInfoDesktop()
    toast.add({ title: 'Backup dipulihkan', description: `${filename} telah diterapkan.`, color: 'success' })
  }
  catch (e) {
    toast.add({ title: 'Gagal memulihkan backup', description: String(e), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function konfirmasiHapusBackup() {
  if (!deleteTarget.value) return
  const filename = deleteTarget.value.filename
  busy.value = true
  try {
    await deleteBackup(filename)
    deleteTarget.value = null
    await muatInfoDesktop()
    toast.add({ title: 'Backup dihapus', description: filename, color: 'neutral' })
  }
  catch (e) {
    toast.add({ title: 'Gagal menghapus backup', description: String(e), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function kirimServer(force = false) {
  if (!targetServerUrl.value) {
    toast.add({ title: 'URL server belum diisi', color: 'warning' })
    return
  }
  syncBusy.value = 'push'
  try {
    const snap = kumpulkanDatabaseSnapshot() as unknown as Record<string, unknown>
    const res = await kirimKeServer(targetServerUrl.value, syncConfig.value.syncToken, snap, {
      npsn: profil.value.npsn,
      sekolah: profil.value.sekolah,
      baseUpdatedAt: syncConfig.value.serverUpdatedAt,
      force,
    })
    syncConfig.value.serverUpdatedAt = res.serverUpdatedAt
    syncConfig.value.lastSyncedAt = new Date().toISOString()
    konflik.value = null
    await muatInfoDesktop()
    toast.add({ title: 'Database terkirim ke server', description: `NPSN ${profil.value.npsn} · ${formatWaktu(res.serverUpdatedAt)}`, color: 'success' })
  }
  catch (e) {
    if (e instanceof KonflikSinkronError) {
      konflik.value = { serverUpdatedAt: e.serverUpdatedAt }
      return
    }
    toast.add({ title: 'Gagal mengirim ke server', description: e instanceof Error ? e.message : String(e), color: 'error' })
  }
  finally {
    syncBusy.value = null
  }
}

async function tarikServer() {
  if (!targetServerUrl.value) {
    toast.add({ title: 'URL server belum diisi', color: 'warning' })
    return
  }
  syncBusy.value = 'pull'
  try {
    const res = await ambilDariServer(targetServerUrl.value, syncConfig.value.syncToken, profil.value.npsn)
    terapkanDatabaseSnapshot(res.data)
    syncConfig.value.serverUpdatedAt = res.serverUpdatedAt
    syncConfig.value.lastSyncedAt = new Date().toISOString()
    confirmPullOpen.value = false
    konflik.value = null
    await muatInfoDesktop()
    toast.add({
      title: 'Database diambil dari server',
      description: isDesktop.value ? 'Backup "sebelum-sinkron" dibuat sebelum data lokal diganti.' : 'Data di perangkat ini diganti dengan versi server.',
      color: 'success',
    })
  }
  catch (e) {
    toast.add({ title: 'Gagal mengambil dari server', description: e instanceof Error ? e.message : String(e), color: 'error' })
  }
  finally {
    syncBusy.value = null
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon :name="isDesktop ? 'i-lucide-hard-drive' : isWebNitro ? 'i-lucide-server' : 'i-lucide-globe'" class="size-5 text-primary" />
          <p class="font-semibold">Database Lokal & Sinkronisasi Server</p>
        </div>
        <UBadge :color="isDesktop ? 'primary' : isWebNitro ? 'info' : 'neutral'" variant="subtle">
          {{ runtimeBadgeLabel }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-5">
      <UAlert
        :color="isDesktop ? 'primary' : 'info'"
        variant="subtle"
        :icon="isDesktop ? 'i-lucide-database' : 'i-lucide-server'"
        :title="runtimeAlertTitle"
        :description="runtimeAlertDescription"
      />

      <div v-if="isDesktop && status" class="grid gap-3 rounded-lg border border-default bg-elevated/40 p-3 text-sm sm:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs text-muted">Lokasi file database</p>
          <p class="break-all font-mono text-xs text-highlighted">{{ status.dbPath }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs text-muted">Status file & integritas</p>
          <p class="text-xs">
            {{ status.exists ? `${formatUkuran(status.sizeBytes)} · Diperbarui ${formatWaktu(status.updatedAt)}` : 'Belum dibuat' }}
          </p>
          <p v-if="status.checksum" class="font-mono text-xs text-muted" title="Sidik BLAKE3 untuk mendeteksi file rusak, bukan pengaman dari pengubahan sengaja.">
            BLAKE3: {{ status.checksum.slice(0, 16) }}…
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <template v-if="isDesktop">
          <UButton icon="i-lucide-archive" label="Buat Backup Lokal" :loading="busy" @click="simpanDanBackup" />
          <UButton icon="i-lucide-folder-open" color="neutral" variant="outline" label="Buka Folder Data" @click="bukaFolder" />
          <UButton icon="i-lucide-download" color="neutral" variant="outline" label="Ekspor Database (.json)" :loading="busy" @click="eksporDb" />
          <UButton icon="i-lucide-upload" color="neutral" variant="outline" label="Impor Database (.json)" :loading="busy" @click="imporDbDesktop" />
          <USwitch
            v-model="syncConfig.autoBackup"
            label="Backup harian otomatis"
            description="Saat aplikasi dibuka, buat backup bila backup terakhir lebih dari 24 jam lalu."
            class="basis-full pt-1"
          />
        </template>
        <template v-else>
          <UButton icon="i-lucide-download" color="neutral" variant="outline" label="Unduh Database Lengkap (.json)" @click="eksporDb" />
          <!-- Native file input diperlukan karena Nuxt UI tidak memiliki trigger file dialog tersembunyi untuk mode web -->
          <input ref="webImportInput" type="file" accept="application/json" class="hidden" @change="imporDbWeb">
          <UButton icon="i-lucide-upload" color="neutral" variant="outline" label="Impor Database (.json)" @click="webImportInput?.click()" />
        </template>
      </div>

      <div class="space-y-3 border-t border-default pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-medium">Sinkronisasi Server Sekolah (Opsional)</p>
            <p class="text-xs text-muted">Kirim atau ambil salinan database (NPSN {{ profil.npsn || '-' }}) ke server sekolah. Token & URL hanya disimpan di perangkat ini, tidak ikut ekspor/backup.</p>
          </div>
          <span v-if="syncConfig.lastSyncedAt" class="text-xs text-muted">
            Terakhir sinkron: {{ formatWaktu(syncConfig.lastSyncedAt) }}
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="URL Endpoint Server">
            <UInput
              v-model="syncConfig.serverUrl"
              :placeholder="isWebNitro ? 'Default server Nitro: /api/ceklis' : 'https://server-sekolah.sch.id/api/ceklis'"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Token Sekolah" hint="Wajib" help="Token khusus NPSN sekolah ini dari pengelola server.">
            <UInput v-model="syncConfig.syncToken" type="password" placeholder="Token khusus NPSN sekolah" autocomplete="off" class="w-full" />
          </UFormField>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-cloud-upload"
            :label="isWebNitro && !syncConfig.serverUrl.trim() ? 'Kirim ke Server Nitro' : 'Kirim ke Server'"
            :loading="syncBusy === 'push'"
            :disabled="!targetServerUrl"
            @click="kirimServer()"
          />
          <UButton
            icon="i-lucide-cloud-download"
            color="neutral"
            variant="outline"
            :label="isWebNitro && !syncConfig.serverUrl.trim() ? 'Ambil dari Server Nitro' : 'Ambil dari Server'"
            :loading="syncBusy === 'pull'"
            :disabled="!targetServerUrl"
            @click="confirmPullOpen = true"
          />
        </div>
      </div>

      <div v-if="isDesktop" class="space-y-2 border-t border-default pt-4">
        <p class="font-medium">Riwayat Backup Lokal ({{ backups.length }})</p>
        <UEmpty
          v-if="!backups.length"
          icon="i-lucide-archive"
          title="Belum ada snapshot backup"
          description="Klik Buat Backup Lokal untuk menyimpan salinan cadangan di folder aplikasi."
        />
        <div v-else class="divide-y divide-default rounded-lg border border-default">
          <div v-for="b in backups" :key="b.filename" class="flex flex-wrap items-center justify-between gap-2 p-2.5 text-sm">
            <div class="min-w-0 space-y-0.5">
              <p class="truncate font-mono text-xs font-medium">{{ b.filename }}</p>
              <p class="text-xs text-muted">
                {{ formatWaktu(b.createdAt) }} · {{ formatUkuran(b.sizeBytes) }}
                <span v-if="b.checksum" class="font-mono"> · {{ b.checksum.slice(0, 10) }}</span>
              </p>
            </div>
            <div class="flex gap-1.5">
              <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-rotate-ccw" label="Pulihkan" @click="restoreTarget = b" />
              <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" aria-label="Hapus backup" @click="deleteTarget = b" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal :open="!!restoreTarget" title="Pulihkan backup lokal?" @update:open="v => { if (!v) restoreTarget = null }">
      <template #body>
        <p class="text-sm">
          Database lokal saat ini akan diganti dengan isi dari
          <span class="font-mono font-semibold">{{ restoreTarget?.filename }}</span>.
          Aplikasi akan membuat backup pengaman otomatis terlebih dahulu sebelum memulihkan.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="restoreTarget = null" />
          <UButton label="Pulihkan Backup" :loading="busy" @click="konfirmasiPulihkan" />
        </div>
      </template>
    </UModal>

    <UModal :open="!!deleteTarget" title="Hapus file backup?" @update:open="v => { if (!v) deleteTarget = null }">
      <template #body>
        <p class="text-sm">
          File backup <span class="font-mono font-semibold">{{ deleteTarget?.filename }}</span> akan dihapus permanen dari folder backup lokal.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="deleteTarget = null" />
          <UButton color="error" label="Hapus Permanen" :loading="busy" @click="konfirmasiHapusBackup" />
        </div>
      </template>
    </UModal>

    <UModal :open="!!konflik" title="Data di server sudah berubah" @update:open="v => { if (!v) konflik = null }">
      <template #body>
        <div class="space-y-2 text-sm">
          <p>
            Data NPSN {{ profil.npsn }} di server sudah diubah dari perangkat lain
            <template v-if="konflik?.serverUpdatedAt">({{ formatWaktu(konflik.serverUpdatedAt) }})</template>
            sejak perangkat ini terakhir sinkron.
          </p>
          <p class="text-muted">
            Pilih <strong>Ambil data server</strong> untuk memakai versi server (data perangkat ini diganti), atau
            <strong>Timpa server</strong> bila versi perangkat ini yang benar; perubahan dari perangkat lain akan hilang.
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="konflik = null" />
          <UButton color="neutral" variant="outline" icon="i-lucide-cloud-download" label="Ambil data server" :loading="syncBusy === 'pull'" @click="tarikServer" />
          <UButton color="error" icon="i-lucide-cloud-upload" label="Timpa server" :loading="syncBusy === 'push'" @click="kirimServer(true)" />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="confirmPullOpen" title="Ambil database dari server?">
      <template #body>
        <p class="text-sm">
          Data dari <span class="font-mono text-xs">{{ targetServerUrl }}</span> akan <strong>mengganti</strong> data di perangkat ini.
          <template v-if="isDesktop">Backup lokal otomatis dibuat terlebih dahulu sebelum data diperbarui.</template>
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Batal" @click="confirmPullOpen = false" />
          <UButton label="Ambil & Terapkan" :loading="syncBusy === 'pull'" @click="tarikServer" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
