import type { Gtk, Profil } from '~/utils/profil'
import { namaBergelar, profilKosong, profilMasihContoh } from '~/utils/profil'
import type { DataDapodikSptjm } from '~/utils/sptjm'
import { parseSptjmPdf } from '~/utils/sptjm'
import type { PembaruanSptjm } from '~/utils/sptjmPerubahan'
import { bandingkanSptjm, bersihkanDaftar1SiswaKeluar } from '~/utils/sptjmPerubahan'

/** SPTJM yang sudah dibaca dan menunggu konfirmasi pembaruan (sudah ada SPTJM sebelumnya). */
export interface SptjmTertunda {
  profilPatch: Partial<Profil>
  dataBaru: DataDapodikSptjm
  /** Perbandingan dengan SPTJM yang sedang dipakai; null bila SPTJM milik sekolah lain. */
  ringkasan: PembaruanSptjm | null
  npsnLama: string
  npsnBaru: string
}

function gabungGtkPertahankanGelar(baru: Gtk[], lama: Gtk[], samaSekolah: boolean): Gtk[] {
  if (!samaSekolah) return baru
  return baru.map((item) => {
    const cocok = lama.find(l =>
      (item.nip && item.nip !== '-' && l.nip === item.nip)
      || (item.nuptk && item.nuptk !== '-' && l.nuptk === item.nuptk),
    )
    if (!cocok) return item
    // Nama yang sudah diberi gelar manual ("Drs. Ahmad, S.Pd.") tetap dipakai; SPTJM tidak memuat gelar.
    const punyaGelar = namaBergelar(cocok.nama) && !namaBergelar(item.nama)
    return {
      ...item,
      // TMT tidak ada di SPTJM, jadi isian manual sebelumnya dipertahankan.
      ...(cocok.tmt ? { tmt: cocok.tmt } : {}),
      ...(cocok.tmtSekolah ? { tmtSekolah: cocok.tmtSekolah } : {}),

      nama: punyaGelar ? cocok.nama : item.nama,
      jabatan: cocok.jabatan && cocok.jabatan !== 'Guru Kelas' ? cocok.jabatan : item.jabatan,
    }
  })
}

export function useSptjmImport() {
  const { profil } = useProfil()
  const toast = useToast()
  const memproses = ref(false)

  const tertunda = useState<SptjmTertunda | null>('sptjm-tertunda', () => null)
  const { daftar1 } = useDaftar1()

  /** Terapkan SPTJM ke Profil. Gelar & TMT GTK sekolah yang sama dipertahankan. */
  function terapkan(profilPatch: Partial<Profil>, dataBaru: DataDapodikSptjm) {
    // Impor pertama di atas profil contoh: mulai dari profil kosong (logo kop tetap dipertahankan),
    // supaya nama placeholder tidak tercampur dengan data asli sekolah.
    if (profilMasihContoh(profil.value)) {
      profil.value = { ...profilKosong(), logoKiri: profil.value.logoKiri, logoKanan: profil.value.logoKanan }
    }

    const samaSekolah = Boolean(
      profilPatch.npsn
      && profil.value.npsn
      && profilPatch.npsn === profil.value.npsn,
    )

    const pertahankanKepsek = samaSekolah
      && profilPatch.nipKepsek
      && profil.value.nipKepsek === profilPatch.nipKepsek
      && profil.value.kepsek.includes(',')

    const gtkGabung = profilPatch.gtk
      ? gabungGtkPertahankanGelar(profilPatch.gtk, profil.value.gtk, samaSekolah)
      : profil.value.gtk

    profil.value = {
      ...profil.value,
      ...profilPatch,
      kepsek: pertahankanKepsek ? profil.value.kepsek : (profilPatch.kepsek ?? profil.value.kepsek),
      gtk: gtkGabung,
      dapodik: dataBaru,
    }
    tandaiPerubahanDb()
  }

  function beritahuBerhasil(dataBaru: DataDapodikSptjm, judul = 'SPTJM Dapodik berhasil diimpor') {
    toast.add({
      title: judul,
      description: `${dataBaru.gtkDetail.length} GTK, ${dataBaru.rombel.length} rombel, ${dataBaru.sarpras.length} ruang sarpras, dan ${dataBaru.pesertaDidik.length} peserta didik dimuat.`,
      color: 'success',
    })
  }

  /**
   * Baca PDF SPTJM. Impor pertama langsung diterapkan; bila sudah ada SPTJM sebelumnya,
   * perubahan (siswa baru/lulus/naik kelas, GTK masuk/keluar) ditampilkan dulu untuk dikonfirmasi.
   * @returns true bila data langsung diterapkan, false bila gagal atau menunggu konfirmasi.
   */
  async function imporFileSptjm(file: File): Promise<boolean> {
    memproses.value = true
    try {
      const buf = await file.arrayBuffer()
      const { profilPatch, dapodik: dataBaru } = await parseSptjmPdf(buf)

      const lama = profil.value.dapodik
      if (!lama || profilMasihContoh(profil.value)) {
        terapkan(profilPatch, dataBaru)
        beritahuBerhasil(dataBaru)
        return true
      }

      const npsnLama = profil.value.npsn.trim()
      const npsnBaru = String(profilPatch.npsn || '').trim()
      const sekolahLain = Boolean(npsnLama && npsnBaru && npsnLama !== npsnBaru)
      tertunda.value = {
        profilPatch,
        dataBaru,
        ringkasan: sekolahLain ? null : bandingkanSptjm(lama, dataBaru),
        npsnLama,
        npsnBaru,
      }
      return false
    }
    catch (err) {
      toast.add({
        title: 'Gagal membaca PDF SPTJM',
        description: err instanceof Error ? err.message : 'Pastikan file berasal dari ekspor SPTJM sp.datadik.',
        color: 'error',
      })
      return false
    }
    finally {
      memproses.value = false
    }
  }

  /** Terapkan SPTJM yang tertunda setelah dikonfirmasi; backup lokal dibuat dulu di aplikasi desktop. */
  async function konfirmasiPembaruan(opsi: { bersihkanSiswaKeluar: boolean }) {
    const t = tertunda.value
    if (!t) return
    const backend = useDesktopBackend()
    if (backend.isDesktop.value) {
      try {
        await backend.saveDatabase(kumpulkanDatabaseSnapshot() as unknown as Record<string, unknown>)
        await backend.createBackup()
      }
      catch (e) {
        toast.add({ title: 'Backup sebelum pembaruan gagal', description: String(e), color: 'error' })
        return
      }
    }

    terapkan(t.profilPatch, t.dataBaru)
    let dibersihkan = 0
    if (opsi.bersihkanSiswaKeluar && t.ringkasan) {
      dibersihkan = bersihkanDaftar1SiswaKeluar(daftar1.value, t.ringkasan.siswaKeluar, t.dataBaru.pesertaDidik)
    }
    tertunda.value = null
    beritahuBerhasil(t.dataBaru, 'Data SPTJM diperbarui')
    if (dibersihkan) {
      toast.add({ title: 'Isian Daftar 1 siswa yang keluar dibersihkan', description: `${dibersihkan} isian BB/TB/agama dihapus.`, color: 'neutral' })
    }
  }

  function batalPembaruan() {
    tertunda.value = null
  }

  function hapusDataDapodik() {
    if (!profil.value.dapodik) return
    const next = { ...profil.value }
    delete next.dapodik
    profil.value = next
    tandaiPerubahanDb()
    toast.add({ title: 'Lampiran data SPTJM dihapus dari profil', color: 'neutral' })
  }

  return { memproses, tertunda, imporFileSptjm, konfirmasiPembaruan, batalPembaruan, hapusDataDapodik }
}
