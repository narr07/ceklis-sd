import type { Gtk } from '~/utils/profil'
import { namaBergelar, profilKosong, profilMasihContoh } from '~/utils/profil'
import { parseSptjmPdf } from '~/utils/sptjm'

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

  async function imporFileSptjm(file: File): Promise<boolean> {
    memproses.value = true
    try {
      const buf = await file.arrayBuffer()
      const { profilPatch, dapodik: dataBaru } = await parseSptjmPdf(buf)

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

      toast.add({
        title: 'SPTJM Dapodik berhasil diimpor',
        description: `${dataBaru.gtkDetail.length} GTK, ${dataBaru.rombel.length} rombel, ${dataBaru.sarpras.length} ruang sarpras, dan ${dataBaru.pesertaDidik.length} peserta didik dimuat.`,
        color: 'success',
      })
      return true
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

  function hapusDataDapodik() {
    if (!profil.value.dapodik) return
    const next = { ...profil.value }
    delete next.dapodik
    profil.value = next
    tandaiPerubahanDb()
    toast.add({ title: 'Lampiran data SPTJM dihapus dari profil', color: 'neutral' })
  }

  return { memproses, imporFileSptjm, hapusDataDapodik }
}
