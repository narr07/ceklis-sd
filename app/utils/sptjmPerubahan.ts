import type { DataDapodikSptjm, SptjmGtk, SptjmPesertaDidik } from '~/utils/sptjm'
import type { Daftar1State } from '~/utils/daftar1'
import { kunciSiswaRow, normalisasiKunciSiswa, normalisasiTingkat } from '~/utils/daftar1'

/** Perubahan satu siswa yang tetap terdaftar (naik kelas / pindah rombel). */
export interface SiswaPindah {
  nama: string
  dari: string
  ke: string
}

/** Ringkasan perbedaan SPTJM lama (yang sedang dipakai) dengan SPTJM baru yang akan diterapkan. */
export interface PembaruanSptjm {
  tanggalLama: string
  tanggalBaru: string
  /** SPTJM baru bertanggal lebih lama dari yang sedang dipakai. */
  baruLebihLama: boolean
  siswaMasuk: SptjmPesertaDidik[]
  /** Siswa yang tidak ada lagi di SPTJM baru; `lulus` = sebelumnya di kelas 6. */
  siswaKeluar: Array<SptjmPesertaDidik & { lulus: boolean }>
  naikKelas: SiswaPindah[]
  pindahRombel: SiswaPindah[]
  siswaTetap: number
  /** Jumlah siswa baru per tingkat, mis. { '1': 28, '4': 1 }. */
  masukPerTingkat: Record<string, number>
  gtkMasuk: SptjmGtk[]
  gtkKeluar: SptjmGtk[]
  rombelLama: number
  rombelBaru: number
}

const isiValid = (v: string | undefined) => {
  const s = String(v || '').trim()
  return s && s !== '-' ? s : ''
}

/** Kunci pencocokan siswa: NISN, lalu NIK, lalu nama + tanggal lahir. */
export function kunciSiswaSptjm(pd: Pick<SptjmPesertaDidik, 'nama' | 'nisn' | 'nik' | 'tglLahir'>): string {
  const nisn = isiValid(pd.nisn)
  if (/^\d{6,}$/.test(nisn)) return `NISN:${nisn}`
  const nik = isiValid(pd.nik)
  if (/^\d{10,}$/.test(nik)) return `NIK:${nik}`
  return `NAMA:${normalisasiKunciSiswa(pd.nama)}|${String(pd.tglLahir || '').trim()}`
}

/** Kunci pencocokan GTK: NIK, NIP, NUPTK, lalu nama. */
export function kunciGtkSptjm(g: Pick<SptjmGtk, 'nama' | 'nik' | 'nip' | 'nuptk'>): string {
  const nik = isiValid(g.nik)
  if (nik) return `NIK:${nik}`
  const nip = isiValid(g.nip)
  if (nip) return `NIP:${nip.replace(/\s+/g, '')}`
  const nuptk = isiValid(g.nuptk)
  if (nuptk) return `NUPTK:${nuptk}`
  return `NAMA:${normalisasiKunciSiswa(g.nama)}`
}

/** Tanggal SPTJM "dd-mm-yyyy" menjadi angka yyyymmdd untuk dibandingkan; 0 bila tidak dikenali. */
function angkaTanggal(t: string): number {
  const m = String(t || '').match(/^(\d{2})-(\d{2})-(\d{4})$/)
  return m ? Number(`${m[3]}${m[2]}${m[1]}`) : 0
}

const tingkatDari = (pd: SptjmPesertaDidik) => normalisasiTingkat(pd.tingkat, pd.rombel)
const labelKelas = (pd: SptjmPesertaDidik) => pd.rombel || `Kelas ${tingkatDari(pd)}`

export function bandingkanSptjm(lama: DataDapodikSptjm, baru: DataDapodikSptjm): PembaruanSptjm {
  const petaLama = new Map(lama.pesertaDidik.map(pd => [kunciSiswaSptjm(pd), pd]))
  const petaBaru = new Map(baru.pesertaDidik.map(pd => [kunciSiswaSptjm(pd), pd]))

  const siswaMasuk: SptjmPesertaDidik[] = []
  const naikKelas: SiswaPindah[] = []
  const pindahRombel: SiswaPindah[] = []
  let siswaTetap = 0
  const masukPerTingkat: Record<string, number> = {}

  for (const [k, pd] of petaBaru) {
    const sebelumnya = petaLama.get(k)
    if (!sebelumnya) {
      siswaMasuk.push(pd)
      const t = tingkatDari(pd)
      masukPerTingkat[t] = (masukPerTingkat[t] || 0) + 1
      continue
    }
    const tLama = Number(tingkatDari(sebelumnya))
    const tBaru = Number(tingkatDari(pd))
    const perubahan = { nama: pd.nama, dari: labelKelas(sebelumnya), ke: labelKelas(pd) }
    if (tBaru > tLama) naikKelas.push(perubahan)
    else if (perubahan.dari !== perubahan.ke) pindahRombel.push(perubahan)
    else siswaTetap++
  }

  const siswaKeluar = [...petaLama]
    .filter(([k]) => !petaBaru.has(k))
    .map(([, pd]) => ({ ...pd, lulus: tingkatDari(pd) === '6' }))

  const gtkLama = new Map(lama.gtkDetail.map(g => [kunciGtkSptjm(g), g]))
  const gtkBaru = new Map(baru.gtkDetail.map(g => [kunciGtkSptjm(g), g]))

  const tLama = angkaTanggal(lama.tanggalSptjm)
  const tBaru = angkaTanggal(baru.tanggalSptjm)

  return {
    tanggalLama: lama.tanggalSptjm,
    tanggalBaru: baru.tanggalSptjm,
    baruLebihLama: Boolean(tLama && tBaru && tBaru < tLama),
    siswaMasuk,
    siswaKeluar,
    naikKelas,
    pindahRombel,
    siswaTetap,
    masukPerTingkat,
    gtkMasuk: [...gtkBaru].filter(([k]) => !gtkLama.has(k)).map(([, g]) => g),
    gtkKeluar: [...gtkLama].filter(([k]) => !gtkBaru.has(k)).map(([, g]) => g),
    rombelLama: lama.rombel.length,
    rombelBaru: baru.rombel.length,
  }
}

/**
 * Hapus isian Daftar 1 per siswa (BB/TB, agama) milik siswa yang sudah keluar/lulus,
 * supaya data lama tidak terbawa bila ada siswa baru bernama sama.
 * Mengembalikan jumlah entri yang dihapus.
 */
export function bersihkanDaftar1SiswaKeluar(
  state: Daftar1State,
  keluar: SptjmPesertaDidik[],
  masihAktif: SptjmPesertaDidik[],
): number {
  // Kunci yang masih dipakai siswa aktif (mis. nama sama dengan siswa yang lulus) tidak dihapus.
  const dipakai = new Set(masihAktif.flatMap(pd => [kunciSiswaRow(pd), normalisasiKunciSiswa(pd.nama)]))
  let jumlah = 0
  for (const pd of keluar) {
    for (const k of new Set([kunciSiswaRow(pd), normalisasiKunciSiswa(pd.nama)])) {
      if (dipakai.has(k)) continue
      if (k in state.bbTbByKey) {
        Reflect.deleteProperty(state.bbTbByKey, k)
        jumlah++
      }
      if (k in state.agamaByKey) {
        Reflect.deleteProperty(state.agamaByKey, k)
        jumlah++
      }
    }
  }
  return jumlah
}
