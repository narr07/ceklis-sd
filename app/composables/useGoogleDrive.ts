import type { Block } from '~/utils/blocks'
import type { HasilUnggahDrive, StatusGoogle } from '~/composables/useDesktopBackend'

/** Nama subfolder dokumen per periode, mis. "2026-2027 Semester 1". */
export function folderPeriodeDrive(ta: string, semester: string) {
  return `${ta.replace('/', '-')} Semester ${semester === 'genap' ? '2' : '1'}`
}

/**
 * Google Drive milik sekolah (khusus aplikasi desktop): status sambungan bersama dan
 * penyimpanan dokumen ke folder `Ceklis SD/Dokumen/<folder>` di Drive.
 */
export function useGoogleDrive() {
  const backend = useDesktopBackend()
  const toast = useToast()
  const status = useState<StatusGoogle | null>('google-drive-status', () => null)
  const menyimpan = useState<string | null>('google-drive-menyimpan', () => null)
  const { siapkan, selesai } = useCetakDokumen()

  /** Siap menyimpan dokumen: aplikasi desktop dan akun Google sudah terhubung. */
  const siap = computed(() => backend.isDesktop.value && !!status.value?.terhubung)

  async function muatStatus() {
    if (!backend.isDesktop.value) return
    try {
      status.value = await backend.googleStatus()
    }
    catch (e) {
      toast.add({ title: 'Gagal membaca status Google Drive', description: String(e), color: 'error' })
    }
  }

  function beritahu(h: HasilUnggahDrive, folder: string) {
    toast.add({
      title: h.diperbarui ? 'Berkas di Google Drive diperbarui' : 'Tersimpan di Google Drive',
      description: `Ceklis SD/Dokumen/${folder ? `${folder}/` : ''}${h.nama}`,
      color: 'success',
      icon: 'i-lucide-cloud-check',
    })
  }

  async function jalankan(kunci: string, kerja: () => Promise<HasilUnggahDrive>, folder: string) {
    menyimpan.value = kunci
    try {
      beritahu(await kerja(), folder)
    }
    catch (e) {
      toast.add({ title: 'Gagal menyimpan ke Google Drive', description: e instanceof Error ? e.message : String(e), color: 'error' })
      // Sambungan dicabut/kedaluwarsa: segarkan status agar UI menampilkan tombol hubungkan.
      await muatStatus()
    }
    finally {
      menyimpan.value = null
    }
  }

  /**
   * Simpan dokumen sebagai PDF ke Drive. Tanpa `blocks`, halaman yang sedang tampil yang dicetak
   * (mis. lembar Daftar 1).
   */
  async function simpanPdf(namaBerkas: string, folder: string, blocks?: Block[]) {
    await jalankan(`pdf:${namaBerkas}`, async () => {
      if (blocks) await siapkan(blocks)
      try {
        return await backend.driveSimpanPdf(namaBerkas, folder)
      }
      finally {
        if (blocks) selesai()
      }
    }, folder)
  }

  /** Simpan berkas buatan aplikasi (.docx/.xlsx) ke Drive. */
  async function simpanBerkas(buat: () => Blob | Promise<Blob>, namaBerkas: string, ekstensi: 'docx' | 'xlsx', folder: string) {
    await jalankan(`${ekstensi}:${namaBerkas}`, async () => backend.driveSimpanBerkas(await buat(), namaBerkas, ekstensi, folder), folder)
  }

  return { status, siap, menyimpan, muatStatus, simpanPdf, simpanBerkas }
}
