import type { Profil } from '~/utils/profil'
import { profilAwal } from '~/utils/profil'
import type { Daftar1State } from '~/utils/daftar1'
import { cloneDaftar1DefaultState, mergeDaftar1State } from '~/utils/daftar1'
import type { Peran, Semester } from '~/data/checklists'
import { daftarTahunAjaran, periodeSekarang } from '~/utils/tanggal'

/**
 * Pesan galat terakhir saat menulis ke localStorage (mis. kuota penuh karena logo besar).
 * Ref tingkat modul sengaja dipakai agar bisa diisi dari watcher/callback di luar konteks setup;
 * hanya ditulis di klien, sehingga tidak berbagi state antar-request SSR.
 */
export const galatPenyimpanan = ref<string | null>(null)

const PREFIX_PROGRESS = 'ceklis:progress:'
const PREFIX_ISIAN = 'ceklis:isian:'

function load<T>(key: string, fallback: T): T {
  if (import.meta.server) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  }
  catch { return fallback }
}

/** Simpan ke localStorage; mengembalikan `false` dan mengisi `galatPenyimpanan` bila gagal. */
export function simpanLokal(key: string, val: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(val))
    return true
  }
  catch (err) {
    const penuh = err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)
    galatPenyimpanan.value = penuh
      ? 'Penyimpanan browser penuh, sehingga perubahan terakhir TIDAK tersimpan. Perkecil ukuran logo kop surat atau ekspor database lalu bersihkan data lama.'
      : `Perubahan terakhir tidak dapat disimpan di perangkat ini (${err instanceof Error ? err.message : String(err)}).`
    return false
  }
}

function hapusKunciBerawalan(prefix: string) {
  try {
    const hapus: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) hapus.push(k)
    }
    for (const k of hapus) localStorage.removeItem(k)
  }
  catch { /* localStorage diblokir */ }
}

export interface SyncConfig {
  serverUrl: string
  syncToken: string
  lastSyncedAt: string
  /** Versi (`updatedAt`) data server yang terakhir dikirim/diambil perangkat ini; dipakai deteksi konflik. */
  serverUpdatedAt: string
  autoBackup: boolean
}

export interface Status { done: Record<string, boolean>, notes: Record<string, string> }
export interface Periode { ta: string, semester: Semester }

/**
 * Isi database sekolah. Konfigurasi sinkronisasi (URL & token) sengaja TIDAK ikut,
 * karena itu pengaturan perangkat dan token tidak boleh tersebar lewat file ekspor/backup/server.
 */
export interface DatabaseSnapshot {
  schemaVersion: number
  exportedAt: string
  profil: Profil
  periode: Periode
  progress: Record<string, Status>
  isian: Record<string, Record<string, string>>
  daftar1?: Daftar1State
}

const DEFAULT_SYNC: SyncConfig = {
  serverUrl: '',
  syncToken: '',
  lastSyncedAt: '',
  serverUpdatedAt: '',
  autoBackup: true,
}

const periodeAwal = (): Periode => periodeSekarang()

export function tandaiPerubahanDb() {
  const rev = useState<number>('db-revision', () => 0)
  rev.value++
}

/* ── Profil sekolah ── */
export function useProfil() {
  const profil = useState<Profil>('profil', () => load('ceklis:profil', structuredClone(profilAwal)))
  watch(profil, (v) => {
    simpanLokal('ceklis:profil', v)
    tandaiPerubahanDb()
  }, { deep: true })
  const reset = () => { profil.value = structuredClone(profilAwal) }
  return { profil, reset }
}

/* ── Periode aktif ── */
export function usePeriode() {
  const periode = useState<Periode>('periode', () => load('ceklis:periode', periodeAwal()))
  watch(periode, (v) => {
    simpanLokal('ceklis:periode', v)
    tandaiPerubahanDb()
  }, { deep: true })
  const tahunAnggaran = computed(() => {
    const [a, b] = periode.value.ta.split('/')
    return periode.value.semester === 'ganjil' ? a : b
  })
  const pilihanTa = computed(() => daftarTahunAjaran(new Date(), [periode.value.ta]))
  return { periode, tahunAnggaran, pilihanTa }
}

/* ── Konfigurasi sinkronisasi server (opsional, khusus perangkat ini) ── */
export function useSyncConfig() {
  const syncConfig = useState<SyncConfig>('sync-config', () => load('ceklis:sync', { ...DEFAULT_SYNC }))
  // Bukan bagian database sekolah, jadi tidak memicu penyimpanan database ke disk.
  watch(syncConfig, v => simpanLokal('ceklis:sync', v), { deep: true })
  return { syncConfig }
}

/* ── Data Daftar 1 (Laporan Bulanan Sekolah Dasar) ── */
export function useDaftar1() {
  const hydrated = useState<boolean>('client-hydrated', () => false)
  const daftar1 = useState<Daftar1State>('daftar1', () =>
    hydrated.value
      ? mergeDaftar1State(load('ceklis:daftar1', cloneDaftar1DefaultState()))
      : cloneDaftar1DefaultState(),
  )
  watch(daftar1, (v) => {
    if (!import.meta.client || !hydrated.value) return
    simpanLokal('ceklis:daftar1', v)
    tandaiPerubahanDb()
  }, { deep: true })
  const reset = () => {
    daftar1.value = cloneDaftar1DefaultState()
    if (import.meta.client) {
      simpanLokal('ceklis:daftar1', daftar1.value)
      tandaiPerubahanDb()
    }
  }
  return { daftar1, reset }
}

/* ── Progres checklist ── */
export function useProgress(peran: MaybeRef<Peran>) {
  const { periode } = usePeriode()
  const key = computed(() => `${PREFIX_PROGRESS}${unref(peran)}:${periode.value.ta}:${periode.value.semester}`)
  const state = useState<Record<string, Status>>('progress', () => ({}))
  const hydrated = useState<boolean>('client-hydrated', () => false)
  const ensure = (k: string) => {
    if (!state.value[k]) {
      state.value[k] = hydrated.value ? load<Status>(k, { done: {}, notes: {} }) : { done: {}, notes: {} }
    }
    return state.value[k]!
  }
  const status = computed(() => ensure(key.value))
  watch(() => state.value[key.value], (v) => {
    if (v && hydrated.value) {
      simpanLokal(key.value, v)
      tandaiPerubahanDb()
    }
  }, { deep: true })
  const toggle = (id: string, v: boolean) => { status.value.done[id] = v }
  const setNote = (id: string, v: string) => { status.value.notes[id] = v }
  const reset = () => {
    state.value[key.value] = { done: {}, notes: {} }
    simpanLokal(key.value, state.value[key.value])
    tandaiPerubahanDb()
  }
  return { status, toggle, setNote, reset, key }
}

export function bacaProgres(peran: Peran, ta: string, semester: Semester): Status {
  return load<Status>(`${PREFIX_PROGRESS}${peran}:${ta}:${semester}`, { done: {}, notes: {} })
}

export function bacaProgresTerhidrasi(peran: Peran, ta: string, semester: Semester): Status {
  const hydrated = useState<boolean>('client-hydrated', () => false)
  const state = useState<Record<string, Status>>('progress', () => ({}))
  const key = `${PREFIX_PROGRESS}${peran}:${ta}:${semester}`
  if (!hydrated.value) return state.value[key] ?? { done: {}, notes: {} }
  return state.value[key] ?? bacaProgres(peran, ta, semester)
}

/* ── Snapshot database lengkap untuk disk lokal, file ekspor, dan sinkronisasi server ── */
export function kumpulkanDatabaseSnapshot(): DatabaseSnapshot {
  const { profil } = useProfil()
  const { periode } = usePeriode()
  const { daftar1 } = useDaftar1()

  const progress: Record<string, Status> = {}
  const isian: Record<string, Record<string, string>> = {}

  if (import.meta.client) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        if (k.startsWith(PREFIX_PROGRESS)) {
          const raw = localStorage.getItem(k)
          if (raw) progress[k] = JSON.parse(raw) as Status
        }
        else if (k.startsWith(PREFIX_ISIAN)) {
          const raw = localStorage.getItem(k)
          if (raw) isian[k] = JSON.parse(raw) as Record<string, string>
        }
      }
    }
    catch { /* abaikan error parsing lokal */ }
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profil: structuredClone(toRaw(profil.value)),
    periode: structuredClone(toRaw(periode.value)),
    progress,
    isian,
    daftar1: structuredClone(toRaw(daftar1.value)),
  }
}

/**
 * Terapkan isi database dari file impor, backup, atau server.
 * Bagian yang ada di payload MENGGANTI data lokal (bukan digabung), supaya hasil pulih/impor
 * sama persis dengan sumbernya. Field `sync` dari file lama diabaikan.
 */
export function terapkanDatabaseSnapshot(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const obj = raw as Record<string, unknown>

  // Mendukung file ekspor SyncEnvelope ({ schemaVersion, data }) jika diteruskan langsung
  const payload = ('data' in obj && obj.data && typeof obj.data === 'object')
    ? obj.data as Record<string, unknown>
    : obj

  const { profil } = useProfil()
  const { periode } = usePeriode()
  const progressState = useState<Record<string, Status>>('progress', () => ({}))

  // Mendukung format lama profil-only (langsung field sekolah/npsn)
  if ('sekolah' in payload && !('profil' in payload)) {
    profil.value = { ...structuredClone(profilAwal), ...(payload as Partial<Profil>) }
    simpanLokal('ceklis:profil', profil.value)
    return true
  }

  const dikenali = ['profil', 'periode', 'progress', 'isian', 'daftar1'].some(k => k in payload)
  if (!dikenali) return false

  if (payload.profil && typeof payload.profil === 'object') {
    profil.value = { ...structuredClone(profilAwal), ...(payload.profil as Partial<Profil>) }
    simpanLokal('ceklis:profil', profil.value)
  }

  if (payload.periode && typeof payload.periode === 'object') {
    const p = payload.periode as Partial<Periode>
    periode.value = {
      ta: typeof p.ta === 'string' ? p.ta : periode.value.ta,
      semester: p.semester === 'genap' ? 'genap' : 'ganjil',
    }
    simpanLokal('ceklis:periode', periode.value)
  }

  if (payload.progress && typeof payload.progress === 'object') {
    hapusKunciBerawalan(PREFIX_PROGRESS)
    const baru: Record<string, Status> = {}
    const progMap = payload.progress as Record<string, Status>
    for (const [k, v] of Object.entries(progMap)) {
      if (k.startsWith(PREFIX_PROGRESS) && v && typeof v === 'object') {
        const clean: Status = {
          done: v.done && typeof v.done === 'object' ? v.done : {},
          notes: v.notes && typeof v.notes === 'object' ? v.notes : {},
        }
        simpanLokal(k, clean)
        baru[k] = clean
      }
    }
    progressState.value = baru
  }

  if (payload.isian && typeof payload.isian === 'object') {
    hapusKunciBerawalan(PREFIX_ISIAN)
    const isianMap = payload.isian as Record<string, Record<string, string>>
    for (const [k, v] of Object.entries(isianMap)) {
      if (k.startsWith(PREFIX_ISIAN) && v && typeof v === 'object') {
        simpanLokal(k, v)
      }
    }
  }

  if (payload.daftar1 && typeof payload.daftar1 === 'object') {
    const { daftar1 } = useDaftar1()
    daftar1.value = mergeDaftar1State(payload.daftar1 as Partial<Daftar1State>)
    simpanLokal('ceklis:daftar1', daftar1.value)
  }

  tandaiPerubahanDb()
  return true
}

export function useDatabaseSync() {
  const { isDesktop, loadDatabase, saveDatabase, autoBackupIfDue } = useDesktopBackend()
  const initialized = useState<boolean>('desktop-db-initialized', () => false)
  const syncingDisk = useState<boolean>('desktop-db-saving', () => false)
  const dbRev = useState<number>('db-revision', () => 0)
  let suppressSave = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function hydrateBrowserStorage() {
    if (!import.meta.client) return
    const { profil } = useProfil()
    const { periode } = usePeriode()
    const { syncConfig } = useSyncConfig()
    const { daftar1 } = useDaftar1()
    const progressState = useState<Record<string, Status>>('progress', () => ({}))
    const hydrated = useState<boolean>('client-hydrated', () => false)

    suppressSave = true
    profil.value = load('ceklis:profil', structuredClone(profilAwal))
    periode.value = load('ceklis:periode', periodeAwal())
    syncConfig.value = load('ceklis:sync', { ...DEFAULT_SYNC })
    daftar1.value = mergeDaftar1State(load('ceklis:daftar1', cloneDaftar1DefaultState()))

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k || !k.startsWith(PREFIX_PROGRESS)) continue
        progressState.value[k] = load<Status>(k, { done: {}, notes: {} })
      }
    }
    catch { /* abaikan error parsing localStorage */ }

    for (const peran of ['kepsek', 'operator', 'bendahara'] as Peran[]) {
      const activeKey = `${PREFIX_PROGRESS}${peran}:${periode.value.ta}:${periode.value.semester}`
      progressState.value[activeKey] = load<Status>(activeKey, { done: {}, notes: {} })
    }

    hydrated.value = true
  }

  async function initStorage() {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    hydrateBrowserStorage()
    const siap = useState<boolean>('storage-siap', () => false)

    if (!isDesktop.value) {
      await nextTick()
      suppressSave = false
      siap.value = true
      return
    }

    try {
      // Di desktop, file database di disk adalah sumber kebenaran; localStorage WebView hanya cache.
      const existing = await loadDatabase()
      if (existing) {
        terapkanDatabaseSnapshot(existing)
        await nextTick()
      }
      else {
        const snap = kumpulkanDatabaseSnapshot()
        await saveDatabase(snap as unknown as Record<string, unknown>)
      }

      const { syncConfig } = useSyncConfig()
      if (syncConfig.value.autoBackup) {
        await autoBackupIfDue().catch(err => console.error('Backup harian otomatis gagal:', err))
      }
    }
    catch (err) {
      console.error('Gagal menginisialisasi database lokal:', err)
      galatPenyimpanan.value = `Database lokal gagal dimuat: ${String(err)}`
    }
    finally {
      await nextTick()
      suppressSave = false
      siap.value = true
    }

    watch(dbRev, () => {
      if (suppressSave || !isDesktop.value) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          syncingDisk.value = true
          const snap = kumpulkanDatabaseSnapshot()
          await saveDatabase(snap as unknown as Record<string, unknown>)
        }
        catch (err) {
          console.error('Gagal menyimpan database lokal:', err)
          galatPenyimpanan.value = `Database lokal gagal disimpan ke disk: ${String(err)}`
        }
        finally {
          syncingDisk.value = false
        }
      }, 400)
    })
  }

  return { initStorage, initDesktopStorage: initStorage, syncingDisk }
}
