import type { TingkatKelas } from '~/utils/daftar1'
import { ROMAWI_MAP, TINGKAT_LIST } from '~/utils/daftar1'
import type { BarisSkbm, JenisTugas, TugasGuru } from '~/utils/skbm'
import { hitungSkbm, kelasDenganMapel } from '~/utils/skbm'
import { cekBentrok, cekJumlahJam } from '~/utils/jadwal'

/** State & turunan halaman SK Beban Mengajar; dipakai halaman dan komponen tab di components/skbm. */
export function useSkbmHalaman() {
  const { profil } = useProfil()
  const { skbm } = useSkbm()

  const hasil = computed(() => hitungSkbm(profil.value, skbm.value))
  const bentrok = computed(() => (skbm.value.jadwal ? cekBentrok(skbm.value.jadwal, hasil.value.baris) : []))
  const selisihJam = computed(() => (skbm.value.jadwal ? cekJumlahJam(skbm.value.jadwal, skbm.value.strukturJam) : []))

  const kelasItems = TINGKAT_LIST.map(t => ({ label: `Kelas ${ROMAWI_MAP[t]}`, value: t }))
  const semuaMapel = computed(() => [...new Set(TINGKAT_LIST.flatMap(t => skbm.value.strukturJam[t].map(m => m.mapel).filter(Boolean)))])

  /** Simpan perubahan tugas satu guru (data tebakan otomatis ikut disalin agar tidak hilang). */
  function ubahTugas(b: BarisSkbm, patch: Partial<TugasGuru>) {
    skbm.value.tugas[b.kunci] = { ...b.tugas, ...patch }
  }

  function gantiJenis(b: BarisSkbm, jenis: JenisTugas) {
    const tetap = { jenisGuru: undefined, bimbingan: b.tugas.bimbingan, sasaran: b.tugas.sasaran }
    if (jenis === 'mapel') {
      const mapel = b.tugas.mapel ?? semuaMapel.value.find(m => /pjok|pai/i.test(m)) ?? semuaMapel.value[0]
      skbm.value.tugas[b.kunci] = { jenis, mapel, kelasMapel: mapel ? kelasDenganMapel(mapel, skbm.value.strukturJam) : [], ...tetap }
    }
    else if (jenis === 'kelas') {
      skbm.value.tugas[b.kunci] = { jenis, kelas: b.tugas.kelas, ...tetap }
    }
    else {
      skbm.value.tugas[b.kunci] = { jenis, ...tetap }
    }
  }

  function gantiMapel(b: BarisSkbm, mapel: string) {
    ubahTugas(b, { mapel, kelasMapel: kelasDenganMapel(mapel, skbm.value.strukturJam) })
  }

  const kelasRomawi = (t: TingkatKelas) => ROMAWI_MAP[t]

  return { profil, skbm, hasil, bentrok, selisihJam, kelasItems, semuaMapel, ubahTugas, gantiJenis, gantiMapel, kelasRomawi }
}
