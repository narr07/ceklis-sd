import { invoke } from '@tauri-apps/api/core'
import { URL_SP_DATADIK } from '~/utils/profil'

export interface StorageStatus {
  dbPath: string
  backupsDir: string
  exists: boolean
  sizeBytes: number
  updatedAt: string | null
  checksum: string | null
  backupCount: number
}

export interface BackupEntry {
  filename: string
  createdAt: string
  sizeBytes: number
  checksum: string
}

export interface SyncEnvelope {
  schemaVersion: number
  npsn: string
  sekolah: string
  updatedAt: string
  /** BLAKE3 isi `data`; hanya mendeteksi file rusak/terpotong, bukan bukti keaslian. */
  checksum: string
  data: Record<string, unknown>
}

/** Server menolak kiriman karena datanya sudah diubah perangkat lain sejak sinkron terakhir. */
export class KonflikSinkronError extends Error {
  constructor(public serverUpdatedAt: string, message: string) {
    super(message)
    this.name = 'KonflikSinkronError'
  }
}

/** Kata sandi sinkron Drive belum tersimpan di komputer ini; minta pengguna mengetiknya. */
export class PerluSandiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PerluSandiError'
  }
}

/** Kata sandi salah (atau berkas di Drive rusak), sehingga database tidak bisa dibuka. */
export class SandiSalahError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SandiSalahError'
  }
}

export interface StatusGoogle {
  /** Build ini punya Client ID Google (installer resmi). */
  tersedia: boolean
  terhubung: boolean
  email: string
  nama: string
  /** Kata sandi sinkron database tersimpan di Credential Manager komputer ini. */
  adaSandi: boolean
}

export interface InfoDatabaseDrive {
  /** Versi berkas di Drive; dipakai mendeteksi perubahan dari perangkat lain. */
  versi: string
  diubah: string
}

export interface HasilUnggahDrive {
  nama: string
  tautan: string
  diperbarui: boolean
}

/** Ubah galat string dari Rust yang berpenanda menjadi kelas galat yang bisa dikenali UI. */
function galatDrive(e: unknown): Error {
  const pesan = e instanceof Error ? e.message : String(e)
  if (pesan.startsWith('KONFLIK: ')) {
    return new KonflikSinkronError(pesan.slice(9).trim(), 'Database di Google Drive sudah diubah dari perangkat lain sejak sinkron terakhir.')
  }
  if (pesan.startsWith('PERLU_SANDI: ')) return new PerluSandiError(pesan.slice(13))
  if (pesan.startsWith('SANDI_SALAH: ')) return new SandiSalahError(pesan.slice(13))
  return new Error(pesan)
}

export type AppTarget = 'desktop' | 'static' | 'web'

/**
 * Satu-satunya tempat pemanggilan `invoke` ke backend Rust dan permintaan HTTP sinkronisasi.
 * Halaman/komponen memanggil fungsi di sini, tidak memanggil `invoke`/`fetch` sinkron sendiri.
 */
export function useDesktopBackend() {
  const config = useRuntimeConfig()
  const appTarget = computed(() => config.public.appTarget as AppTarget)
  const isDesktopTarget = computed(() => appTarget.value === 'desktop')
  const isDesktop = computed(() => import.meta.client && '__TAURI_INTERNALS__' in window)
  /** Website dengan server Nitro (`nuxt build`) yang menyediakan endpoint `/api/ceklis`. */
  const isWebNitro = computed(() => !isDesktop.value && appTarget.value === 'web')

  const getStorageStatus = () => invoke<StorageStatus>('get_storage_status')
  const loadDatabase = () => invoke<Record<string, unknown> | null>('load_database')
  const saveDatabase = (data: Record<string, unknown>) => invoke<StorageStatus>('save_database', { data })
  const createBackup = () => invoke<BackupEntry>('create_backup')
  const autoBackupIfDue = () => invoke<BackupEntry | null>('auto_backup_if_due')
  const listBackups = () => invoke<BackupEntry[]>('list_backups')
  const restoreBackup = (filename: string) => invoke<Record<string, unknown>>('restore_backup', { filename })
  const deleteBackup = async (filename: string) => { await invoke('delete_backup', { filename }) }
  const exportDatabaseFile = (data: Record<string, unknown>, defaultName: string) =>
    invoke<string | null>('export_database_file', { data, defaultName })
  const importDatabaseFile = () => invoke<Record<string, unknown> | null>('import_database_file')
  const prepareSyncEnvelope = (npsn: string, sekolah: string) =>
    invoke<SyncEnvelope>('prepare_sync_envelope', { npsn, sekolah })
  const applySyncEnvelope = (envelope: SyncEnvelope) =>
    invoke<Record<string, unknown>>('apply_sync_envelope', { envelope })
  const openDataFolder = async () => { await invoke('open_data_folder') }

  /** Simpan halaman yang sedang tampil sebagai PDF (dialog simpan dari Windows). */
  const simpanPdf = (namaBerkas: string) => invoke<string | null>('simpan_pdf', { namaBerkas })

  /* ── Google Drive milik sekolah (khusus desktop) ── */
  const googleStatus = () => invoke<StatusGoogle>('google_status')
  /** Buka login Google di browser; selesai setelah pengguna memberi izin (maks. 5 menit). */
  const googleMasuk = () => invoke<StatusGoogle>('google_masuk')
  const googleBatalMasuk = async () => { await invoke('google_batal_masuk') }
  const googlePutus = () => invoke<StatusGoogle>('google_putus')
  const driveAturSandi = async (sandi: string) => { await invoke('drive_atur_sandi', { sandi }) }
  const driveLupakanSandi = async () => { await invoke('drive_lupakan_sandi') }
  const driveInfoDatabase = (npsn: string) => invoke<InfoDatabaseDrive | null>('drive_info_database', { npsn })
  const driveBukaFolder = async () => { await invoke('drive_buka_folder') }

  /** Simpan database ke disk lalu kirim salinan terenkripsi ke Drive. */
  async function driveKirimDatabase(
    snapshot: Record<string, unknown>,
    meta: { npsn: string, sekolah: string, versiDasar: string, paksa?: boolean },
  ): Promise<InfoDatabaseDrive> {
    await saveDatabase(snapshot)
    try {
      return await invoke<InfoDatabaseDrive>('drive_kirim_database', {
        npsn: meta.npsn,
        sekolah: meta.sekolah,
        versiDasar: meta.versiDasar,
        paksa: Boolean(meta.paksa),
      })
    }
    catch (e) { throw galatDrive(e) }
  }

  /** Ambil database dari Drive; Rust membuat backup "sebelum-sinkron" sebelum mengganti data lokal. */
  async function driveAmbilDatabase(npsn: string, sandi?: string) {
    try {
      return await invoke<{ data: Record<string, unknown>, versi: string, diubah: string }>(
        'drive_ambil_database',
        { npsn, sandi: sandi || null },
      )
    }
    catch (e) { throw galatDrive(e) }
  }

  /** Unggah berkas buatan frontend (.docx/.xlsx) ke `Ceklis SD/Dokumen/<folder>`. */
  async function driveSimpanBerkas(blob: Blob, nama: string, ekstensi: 'docx' | 'xlsx', folder: string) {
    return invoke<HasilUnggahDrive>('drive_simpan_berkas', new Uint8Array(await blob.arrayBuffer()), {
      headers: {
        'x-nama': encodeURIComponent(nama),
        'x-ekstensi': ekstensi,
        'x-folder': encodeURIComponent(folder),
      },
    })
  }

  /** Buat PDF dari dokumen yang sedang disiapkan untuk dicetak, lalu unggah ke Drive. */
  const driveSimpanPdf = (namaBerkas: string, folder: string) =>
    invoke<HasilUnggahDrive>('drive_simpan_pdf', { namaBerkas, folder })

  /** Buka SP Datadik (tempat mengunduh PDF SPTJM) di browser bawaan. */
  async function bukaSpDatadik() {
    if (isDesktop.value) {
      await invoke('open_sp_datadik')
      return
    }
    window.open(URL_SP_DATADIK, '_blank', 'noopener')
  }

  function validateServerUrl(raw: string): URL {
    const trimmed = raw.trim()
    if (trimmed.startsWith('/')) {
      if (!isWebNitro.value) {
        throw new Error(isDesktop.value
          ? 'Pada software desktop, masukkan URL server lengkap (https://...).'
          : 'Versi situs statis tidak punya server sendiri; masukkan URL server lengkap (https://...).')
      }
      return new URL(trimmed, window.location.origin)
    }

    let parsed: URL
    try {
      parsed = new URL(trimmed)
    }
    catch {
      throw new Error('URL server sinkronisasi tidak valid.')
    }
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocal)) {
      throw new Error('URL server wajib memakai HTTPS (kecuali localhost untuk pengembangan).')
    }
    return parsed
  }

  function headerDasar(npsn: string, token: string): Record<string, string> {
    if (!token.trim()) throw new Error('Token sekolah wajib diisi. Minta token khusus NPSN sekolah Anda kepada pengelola server.')
    return {
      'X-School-NPSN': npsn,
      'Authorization': `Bearer ${token.trim()}`,
    }
  }

  async function pesanGalat(res: Response) {
    try {
      const body = await res.json() as { statusMessage?: string, message?: string }
      return body.statusMessage || body.message || res.statusText
    }
    catch {
      return res.statusText
    }
  }

  /**
   * Kirim database ke server. `baseUpdatedAt` adalah versi server terakhir yang diketahui perangkat ini;
   * server menolak (409) bila datanya sudah berubah sejak itu, kecuali `force` bernilai true.
   */
  async function kirimKeServer(
    serverUrl: string,
    token: string,
    snapshot: Record<string, unknown>,
    meta: { npsn: string, sekolah: string, baseUpdatedAt: string, force?: boolean },
  ): Promise<{ serverUpdatedAt: string }> {
    const url = validateServerUrl(serverUrl)
    if (!meta.npsn.trim()) throw new Error('NPSN sekolah belum diisi di Profil.')
    const headers = { ...headerDasar(meta.npsn, token), 'Content-Type': 'application/json' }

    let envelope: SyncEnvelope
    if (isDesktop.value) {
      await saveDatabase(snapshot)
      envelope = await prepareSyncEnvelope(meta.npsn, meta.sekolah)
    }
    else {
      envelope = {
        schemaVersion: 1,
        npsn: meta.npsn,
        sekolah: meta.sekolah,
        updatedAt: new Date().toISOString(),
        checksum: '',
        data: snapshot,
      }
    }

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...envelope, baseUpdatedAt: meta.baseUpdatedAt || '', force: Boolean(meta.force) }),
    })
    if (res.status === 409) {
      let serverUpdatedAt = ''
      try { serverUpdatedAt = String((await res.clone().json() as { data?: { serverUpdatedAt?: string } }).data?.serverUpdatedAt || '') }
      catch { /* abaikan */ }
      throw new KonflikSinkronError(serverUpdatedAt, await pesanGalat(res))
    }
    if (!res.ok) {
      throw new Error(`Server menolak pengiriman (${res.status}): ${await pesanGalat(res)}`)
    }
    const body = await res.json() as { updatedAt?: string }
    return { serverUpdatedAt: String(body.updatedAt || '') }
  }

  async function ambilDariServer(
    serverUrl: string,
    token: string,
    npsn: string,
  ): Promise<{ data: Record<string, unknown>, serverUpdatedAt: string }> {
    const url = validateServerUrl(serverUrl)
    if (!npsn.trim()) throw new Error('NPSN sekolah belum diisi di Profil.')
    url.searchParams.set('npsn', npsn.trim())

    const res = await fetch(url.toString(), { method: 'GET', headers: { ...headerDasar(npsn, token), Accept: 'application/json' } })
    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari server (${res.status}): ${await pesanGalat(res)}`)
    }

    const body = await res.json() as Record<string, unknown>
    const raw = (body.envelope && typeof body.envelope === 'object' ? body.envelope : body) as Partial<SyncEnvelope>
    if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw) || !raw.data || typeof raw.data !== 'object') {
      // Jangan pernah menulis respons yang tidak dikenali ke database lokal.
      throw new Error('Respons server bukan paket database Ceklis SD yang valid; data lokal tidak diubah.')
    }
    if (String(raw.npsn || '') !== npsn.trim()) {
      throw new Error(`Paket dari server milik NPSN ${raw.npsn || '-'}, bukan ${npsn}; data lokal tidak diubah.`)
    }

    const env: SyncEnvelope = {
      schemaVersion: Number(raw.schemaVersion || 1),
      npsn: String(raw.npsn),
      sekolah: String(raw.sekolah || ''),
      updatedAt: String(raw.updatedAt || ''),
      checksum: String(raw.checksum || ''),
      data: raw.data,
    }
    if (isDesktop.value) {
      // Rust membuat backup "sebelum-sinkron" dan memeriksa checksum sebelum menimpa database.
      const applied = await applySyncEnvelope(env)
      return { data: applied, serverUpdatedAt: env.updatedAt }
    }
    return { data: env.data, serverUpdatedAt: env.updatedAt }
  }

  return {
    appTarget,
    isDesktop,
    isDesktopTarget,
    isWebNitro,
    getStorageStatus,
    loadDatabase,
    saveDatabase,
    createBackup,
    autoBackupIfDue,
    listBackups,
    restoreBackup,
    deleteBackup,
    exportDatabaseFile,
    importDatabaseFile,
    prepareSyncEnvelope,
    applySyncEnvelope,
    openDataFolder,
    bukaSpDatadik,
    simpanPdf,
    googleStatus,
    googleMasuk,
    googleBatalMasuk,
    googlePutus,
    driveAturSandi,
    driveLupakanSandi,
    driveInfoDatabase,
    driveKirimDatabase,
    driveAmbilDatabase,
    driveSimpanBerkas,
    driveSimpanPdf,
    driveBukaFolder,
    kirimKeServer,
    ambilDariServer,
  }
}
