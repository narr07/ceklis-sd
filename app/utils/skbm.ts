import type { Block, Sign } from './blocks'
import type { Gtk, Profil } from './profil'
import { namaSekolahPendek } from './profil'
import { hariIni, periodeSekarang, tglPanjang } from './tanggal'
import { ROMAWI_MAP, TINGKAT_LIST, normalisasiKunciGuru, normalisasiTingkat, type TingkatKelas } from './daftar1'
import type { Jadwal, PengaturanJadwal } from './jadwal'
import { HARI, mergePengaturanJadwal, pengaturanJadwalAwal } from './jadwal'

/* ───────────── Model data ───────────── */

export type JenisTugas = 'kepsek' | 'kelas' | 'mapel' | 'lain'

export interface TugasGuru {
  jenis: JenisTugas
  /** Guru kelas: kelas yang diampu. */
  kelas?: TingkatKelas
  /** Guru mata pelajaran: nama mapel (harus sama dengan nama di struktur jam). */
  mapel?: string
  /** Guru mata pelajaran: kelas-kelas yang diajar. */
  kelasMapel?: TingkatKelas[]
  /** Teks "Jenis Guru" pengganti (kosong = otomatis). */
  jenisGuru?: string
  /** Lampiran III: tugas membimbing, satu per baris. */
  bimbingan?: string
  /** Lampiran III: sasaran bimbingan. */
  sasaran?: string
}

export interface MapelJam {
  mapel: string
  jjm: number
}

export type SemesterSkbm = 'ganjil' | 'genap'

export interface SkbmState {
  nomor: string
  /** Tanggal penetapan (YYYY-MM-DD). */
  tanggal: string
  /** Tempat penetapan; kosong = kecamatan/kota di Profil. */
  tempat: string
  semester: SemesterSkbm
  tahunAjaran: string
  /** Boleh memuat {sekolah}, diganti nama sekolah. */
  menimbang: string
  /** Satu dasar hukum per baris. */
  mengingat: string
  /** Satu tujuan tembusan per baris; boleh memuat {kabupaten}. */
  tembusan: string
  /** Jumlah jam pelajaran per minggu (JJM) tiap mapel per kelas. */
  strukturJam: Record<TingkatKelas, MapelJam[]>
  /** Jumlah siswa diisi manual; null = dihitung dari SPTJM. */
  siswaManual: Record<TingkatKelas, { l: number, p: number }> | null
  /** Tugas tiap guru, dikunci dengan `kunciGtk`. */
  tugas: Record<string, TugasGuru>
  /** Jadwal pelajaran 5 hari; null = belum disusun. */
  jadwal: Jadwal | null
  pengaturanJadwal: PengaturanJadwal
}

/* ───────────── Nilai bawaan ───────────── */

const SD_RENDAH = (bIndo: number, mtk: number): MapelJam[] => [
  { mapel: 'PAIBP', jjm: 4 },
  { mapel: 'Pendidikan Pancasila', jjm: 5 },
  { mapel: 'Bahasa Indonesia', jjm: bIndo },
  { mapel: 'Matematika', jjm: mtk },
  { mapel: 'PJOK', jjm: 4 },
  { mapel: 'Seni dan Budaya', jjm: 4 },
  { mapel: 'Bahasa Daerah', jjm: 2 },
]
const SD_ATAS = (): MapelJam[] => [
  { mapel: 'PAIBP', jjm: 4 },
  { mapel: 'Pendidikan Pancasila', jjm: 5 },
  { mapel: 'Bahasa Indonesia', jjm: 7 },
  { mapel: 'Matematika', jjm: 6 },
  { mapel: 'IPAS', jjm: 6 },
  { mapel: 'PJOK', jjm: 4 },
  { mapel: 'Seni dan Budaya', jjm: 4 },
  { mapel: 'Bahasa Inggris', jjm: 2 },
  { mapel: 'Bahasa Daerah', jjm: 2 },
]

/** Struktur jam per minggu bawaan (bisa diubah sesuai KOSP sekolah). */
export function strukturJamBawaan(): Record<TingkatKelas, MapelJam[]> {
  return { 1: SD_RENDAH(8, 5), 2: SD_RENDAH(9, 6), 3: SD_ATAS(), 4: SD_ATAS(), 5: SD_ATAS(), 6: SD_ATAS() }
}

export const MENGINGAT_BAWAAN = [
  'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional (Lembaran Negara Republik Indonesia Tahun 2003 Nomor 78, Tambahan Lembaran Negara Nomor 4301);',
  'Undang-Undang Republik Indonesia Nomor 14 Tahun 2005 tentang Guru dan Dosen;',
  'Peraturan Menteri Pendidikan Nasional Republik Indonesia Nomor 16 Tahun 2007 tentang Standar Kualifikasi Akademik dan Kompetensi Guru;',
  'Peraturan Pemerintah Republik Indonesia Nomor 74 Tahun 2008 tentang Guru sebagaimana telah diubah dengan Peraturan Pemerintah Republik Indonesia Nomor 19 Tahun 2017 tentang Guru;',
  'Peraturan Pemerintah Republik Indonesia Nomor 41 Tahun 2009 tentang Tunjangan Profesi Guru dan Dosen, Tunjangan Khusus Guru dan Dosen serta Tunjangan Kehormatan Profesor;',
  'Peraturan Pemerintah Republik Indonesia Nomor 17 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Republik Indonesia Nomor 66 Tahun 2010;',
  'Peraturan Presiden Nomor 87 Tahun 2017 tentang Penguatan Pendidikan Karakter;',
  'Peraturan Pemerintah Republik Indonesia Nomor 30 Tahun 2019 tentang Penilaian Kinerja Pegawai Negeri Sipil;',
  'Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 4 Tahun 2022;',
  'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia Nomor 4 Tahun 2022 tentang Petunjuk Teknis Pemberian Tunjangan Profesi, Tunjangan Khusus, dan Tambahan Penghasilan Guru ASN Daerah;',
  'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia Nomor 7 Tahun 2024 tentang Kesesuaian Bidang Tugas, Mata Pelajaran, dan Kelompok Mata Pelajaran dengan Sertifikat Pendidik;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 3 Tahun 2025 tentang Sistem Penerimaan Murid Baru;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 7 Tahun 2025 tentang Penugasan Guru sebagai Kepala Sekolah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 9 Tahun 2025 tentang Tes Kemampuan Akademik;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 10 Tahun 2025 tentang Standar Kompetensi Lulusan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 11 Tahun 2025 tentang Pemenuhan Beban Kerja Guru;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 12 Tahun 2025 tentang Standar Isi pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 13 Tahun 2025 tentang Perubahan atas Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia Nomor 12 Tahun 2024 tentang Kurikulum pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Keputusan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 271/O/2025 tentang Pedoman Pengelolaan Kinerja Pendidik dan Tenaga Kependidikan;',
  'Keputusan Kepala Badan Standar, Kurikulum, dan Asesmen Pendidikan Kementerian Pendidikan Dasar dan Menengah Nomor 046/H/KR/2025 tentang Capaian Pembelajaran pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 21 Tahun 2025 tentang Standar Tenaga Kependidikan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 26 Tahun 2025 tentang Standar Pengelolaan pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 1 Tahun 2026 tentang Standar Proses pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah;',
  'Peraturan Menteri Pendidikan Dasar dan Menengah Republik Indonesia Nomor 6 Tahun 2026 tentang Budaya Sekolah Aman dan Nyaman;',
  'Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Republik Indonesia Nomor 7 Tahun 2026 tentang Jabatan Fungsional di Bidang Pendidik dan Pengawasan Mutu Pendidikan;',
  'Keputusan Kepala BSKAP Nomor 020 Tahun 2026 tentang Perubahan atas Keputusan Kepala BSKAP Kemendikdasmen Nomor 046/H/KR/2025.',
]

/** Pilihan cepat tugas membimbing (Lampiran III). */
export const SARAN_BIMBINGAN = [
  'Wawasan Wiyata Mandala',
  'Pembina Kerohanian',
  'Pembina Olahraga',
  'Pembina Pramuka Siaga Putra',
  'Pembina Pramuka Siaga Putri',
  'Pembina Pramuka Penggalang Putra',
  'Pembina Pramuka Penggalang Putri',
  'Koordinator Kegiatan Kokurikuler',
  'Pembina Ekstrakurikuler Kesenian',
]
export const SARAN_SASARAN = ['Kelas I s.d. Kelas VI', 'Kelas I s.d. Kelas III', 'Kelas IV s.d. Kelas VI', 'Guru dan Siswa']

export function skbmAwal(): SkbmState {
  const p = periodeSekarang()
  return {
    nomor: '',
    tanggal: hariIni(),
    tempat: '',
    semester: p.semester,
    tahunAjaran: p.ta,
    menimbang: 'Bahwa dalam rangka memperlancar pelaksanaan proses belajar mengajar di {sekolah} perlu menetapkan pembagian tugas guru.',
    mengingat: MENGINGAT_BAWAAN.join('\n'),
    tembusan: 'Kepala Dinas Pendidikan Kabupaten {kabupaten}\nPengawas Pembina',
    strukturJam: strukturJamBawaan(),
    siswaManual: null,
    tugas: {},
    jadwal: null,
    pengaturanJadwal: pengaturanJadwalAwal(),
  }
}

/** Jadwal tersimpan hanya dipakai bila bentuknya utuh (6 kelas × 5 hari). */
function jadwalValid(j: unknown): Jadwal | null {
  if (!j || typeof j !== 'object') return null
  const out = {} as Jadwal
  for (const t of TINGKAT_LIST) {
    const k = (j as Record<string, unknown>)[t]
    if (!Array.isArray(k) || k.length !== HARI.length || !k.every(Array.isArray)) return null
    out[t] = (k as unknown[][]).map(h => h.map(x => (typeof x === 'string' ? x : '')))
  }
  return out
}

/** Gabungkan data tersimpan dengan bawaan (data lama/impor yang kolomnya belum lengkap). */
export function mergeSkbm(partial?: Partial<SkbmState> | null): SkbmState {
  const base = skbmAwal()
  if (!partial || typeof partial !== 'object') return base
  const struktur = { ...base.strukturJam }
  for (const t of TINGKAT_LIST) {
    const isi = partial.strukturJam?.[t]
    if (Array.isArray(isi)) struktur[t] = isi.map(m => ({ mapel: String(m.mapel ?? ''), jjm: Number(m.jjm) || 0 }))
  }
  return {
    ...base,
    ...partial,
    strukturJam: struktur,
    siswaManual: partial.siswaManual ?? null,
    tugas: partial.tugas && typeof partial.tugas === 'object' ? partial.tugas : {},
    jadwal: jadwalValid(partial.jadwal),
    pengaturanJadwal: mergePengaturanJadwal(partial.pengaturanJadwal),
  }
}

/* ───────────── Guru & tugas ───────────── */

/** Kunci tetap untuk satu guru: NIP, lalu NUPTK, lalu nama tanpa gelar. */
export function kunciGtk(g: Pick<Gtk, 'nama' | 'nip' | 'nuptk'>): string {
  const angka = (v: string) => (v || '').replace(/\D/g, '')
  const nip = angka(g.nip)
  if (nip.length >= 8) return `NIP:${nip}`
  const nuptk = angka(g.nuptk)
  if (nuptk.length >= 8) return `NUPTK:${nuptk}`
  return `NAMA:${normalisasiKunciGuru(g.nama)}`
}

const ANGKA_ROMAWI: Record<string, TingkatKelas> = { I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6' }

/** Mapel di struktur jam yang paling cocok dengan teks jabatan (mis. "Guru PJOK" → "PJOK"). */
function cariMapel(teks: string, struktur: Record<TingkatKelas, MapelJam[]>): string | undefined {
  const semua = [...new Set(TINGKAT_LIST.flatMap(t => struktur[t].map(m => m.mapel)))]
  const t = teks.toLowerCase()
  const alias: [RegExp, RegExp][] = [
    [/pjok|penjas|olahraga|jasmani/, /pjok|jasmani/i],
    [/\bpai\b|agama islam|paibp/, /pai/i],
    [/inggris/, /inggris/i],
    [/sunda|jawa|daerah|mulok|muatan lokal/, /daerah|sunda|jawa|lokal/i],
    [/seni|sbdp/, /seni/i],
  ]
  for (const [cari, mapel] of alias) {
    if (cari.test(t)) return semua.find(m => mapel.test(m))
  }
  return semua.find(m => t.includes(m.toLowerCase()))
}

/** Kelas-kelas yang mempunyai mapel tertentu di struktur jam. */
export function kelasDenganMapel(mapel: string, struktur: Record<TingkatKelas, MapelJam[]>): TingkatKelas[] {
  return TINGKAT_LIST.filter(t => struktur[t].some(m => m.mapel === mapel && m.jjm > 0))
}

/** Tebak tugas awal dari jabatan di Profil (hasil impor SPTJM / isian manual). */
export function tebakTugas(g: Gtk, profil: Pick<Profil, 'nipKepsek'>, struktur: Record<TingkatKelas, MapelJam[]>): TugasGuru {
  const jabatan = g.jabatan || ''
  const nipKepsek = (profil.nipKepsek || '').replace(/\D/g, '')
  if (/kepala/i.test(jabatan) || (nipKepsek && g.nip.replace(/\D/g, '') === nipKepsek)) return { jenis: 'kepsek' }
  const kelas = jabatan.match(/kelas\s*(\d|VI|IV|V|III|II|I)\b/i)
  if (kelas && !/pjok|pai|agama|inggris/i.test(jabatan)) {
    const k = kelas[1]!.toUpperCase()
    const t = ANGKA_ROMAWI[k] ?? normalisasiTingkat(k)
    return { jenis: 'kelas', kelas: t }
  }
  const mapel = cariMapel(jabatan, struktur)
  if (mapel) return { jenis: 'mapel', mapel, kelasMapel: kelasDenganMapel(mapel, struktur) }
  return { jenis: 'lain' }
}

/** "I-VI" untuk kelas berurutan, selain itu "I, III, V". */
export function rentangKelas(list: TingkatKelas[]): string {
  const urut = [...new Set(list)].sort()
  if (!urut.length) return '-'
  const n = urut.map(Number)
  const berurutan = n.every((v, i) => i === 0 || v === n[i - 1]! + 1)
  if (berurutan && n.length > 1) return `${ROMAWI_MAP[urut[0]!]}-${ROMAWI_MAP[urut.at(-1)!]}`
  return urut.map(t => ROMAWI_MAP[t]).join(', ')
}

export function labelTugas(t: TugasGuru): string {
  if (t.jenis === 'kepsek') return 'Kepala Sekolah'
  if (t.jenis === 'kelas') return t.kelas ? `Guru Kelas ${ROMAWI_MAP[t.kelas]}` : 'Guru Kelas'
  if (t.jenis === 'mapel') return `Guru ${t.mapel || 'Mapel'} Kelas ${rentangKelas(t.kelasMapel ?? [])}`
  return '-'
}

export function jenisGuruOtomatis(t: TugasGuru): string {
  if (t.jenis === 'kelas') return 'Guru Kelas'
  if (t.jenis === 'mapel') return `Guru ${t.mapel || 'Mapel'}`
  return ''
}

/* ───────────── Perhitungan ───────────── */

export type PerKelas = Record<TingkatKelas, number>
const nolPerKelas = (): PerKelas => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })

export interface BarisSkbm {
  kunci: string
  gtk: Gtk
  tugas: TugasGuru
  nama: string
  nip: string
  pangkat: string
  jabatan: string
  jenisGuru: string
  tugasLabel: string
  jam: PerKelas
  totalJam: number
  siswa: PerKelas
  totalSiswa: number
}

export interface HasilSkbm {
  baris: BarisSkbm[]
  kepsek: BarisSkbm | undefined
  /** Jumlah JJM tiap kelas dari struktur jam. */
  jjmKelas: PerKelas
  siswaKelas: Record<TingkatKelas, { l: number, p: number, total: number }>
  sumberSiswa: 'manual' | 'sptjm' | 'kosong'
  totalSiswa: { l: number, p: number, total: number }
  pramuka: { siagaPutra: number, siagaPutri: number, penggalangPutra: number, penggalangPutri: number }
  /** Hal yang perlu dicek pengguna, mis. mapel yang belum punya guru. */
  peringatan: string[]
}

/** Jumlah siswa per kelas: isian manual, atau dihitung dari peserta didik SPTJM. */
export function siswaPerKelas(profil: Profil, state: Pick<SkbmState, 'siswaManual'>) {
  const hasil = {} as Record<TingkatKelas, { l: number, p: number, total: number }>
  if (state.siswaManual) {
    for (const t of TINGKAT_LIST) {
      const s = state.siswaManual[t] ?? { l: 0, p: 0 }
      hasil[t] = { l: Number(s.l) || 0, p: Number(s.p) || 0, total: (Number(s.l) || 0) + (Number(s.p) || 0) }
    }
    return { hasil, sumber: 'manual' as const }
  }
  for (const t of TINGKAT_LIST) hasil[t] = { l: 0, p: 0, total: 0 }
  const pd = profil.dapodik?.pesertaDidik ?? []
  for (const s of pd) {
    const t = normalisasiTingkat(s.tingkat, s.rombel)
    if (s.jk === 'P') hasil[t].p++
    else hasil[t].l++
    hasil[t].total++
  }
  return { hasil, sumber: pd.length ? 'sptjm' as const : 'kosong' as const }
}

export function hitungSkbm(profil: Profil, state: SkbmState): HasilSkbm {
  const struktur = state.strukturJam
  const peringatan: string[] = []

  const semua = profil.gtk.map((g) => {
    const kunci = kunciGtk(g)
    const tugas = state.tugas[kunci] ?? tebakTugas(g, profil, struktur)
    return { g, kunci, tugas }
  })
  // Kepala sekolah di urutan pertama, sisanya mengikuti urutan GTK di Profil.
  const urut = [...semua.filter(x => x.tugas.jenis === 'kepsek'), ...semua.filter(x => x.tugas.jenis !== 'kepsek')]

  const baris: BarisSkbm[] = urut.map(({ g, kunci, tugas }) => ({
    kunci,
    gtk: g,
    tugas,
    nama: g.nama,
    nip: g.nip && g.nip !== '-' ? g.nip : '',
    pangkat: g.pangkat || '',
    jabatan: tugas.jenis === 'kepsek' ? 'Kepala Sekolah' : 'Guru',
    jenisGuru: tugas.jenisGuru?.trim() || jenisGuruOtomatis(tugas),
    tugasLabel: labelTugas(tugas),
    jam: nolPerKelas(),
    totalJam: 0,
    siswa: nolPerKelas(),
    totalSiswa: 0,
  }))

  const jjmKelas = nolPerKelas()
  for (const t of TINGKAT_LIST) {
    const wali = baris.filter(b => b.tugas.jenis === 'kelas' && b.tugas.kelas === t)
    if (wali.length > 1) peringatan.push(`Kelas ${ROMAWI_MAP[t]} punya ${wali.length} guru kelas; jam hanya dihitung untuk ${wali[0]!.nama}.`)
    for (const m of struktur[t]) {
      if (!m.mapel || !(m.jjm > 0)) continue
      jjmKelas[t] += m.jjm
      const guruMapel = baris.find(b => b.tugas.jenis === 'mapel' && b.tugas.mapel === m.mapel && b.tugas.kelasMapel?.includes(t))
      const pengajar = guruMapel ?? wali[0]
      if (!pengajar) {
        peringatan.push(`Kelas ${ROMAWI_MAP[t]}: ${m.mapel} (${m.jjm} jam) belum punya guru.`)
        continue
      }
      pengajar.jam[t] += m.jjm
    }
  }

  for (const b of baris) {
    if (b.tugas.jenis === 'mapel') {
      const tanpaMapel = (b.tugas.kelasMapel ?? []).filter(t => !struktur[t].some(m => m.mapel === b.tugas.mapel))
      if (!b.tugas.mapel) peringatan.push(`${b.nama}: mata pelajaran belum dipilih.`)
      else if (tanpaMapel.length) peringatan.push(`${b.nama}: ${b.tugas.mapel} tidak ada di struktur jam Kelas ${tanpaMapel.map(t => ROMAWI_MAP[t]).join(', ')}.`)
    }
    if (b.tugas.jenis === 'kelas' && !b.tugas.kelas) peringatan.push(`${b.nama}: kelas yang diampu belum dipilih.`)
    if (b.tugas.jenis === 'lain') peringatan.push(`${b.nama}: tugas mengajar belum ditentukan.`)
    b.totalJam = TINGKAT_LIST.reduce((a, t) => a + b.jam[t], 0)
  }

  const { hasil: siswaKelas, sumber: sumberSiswa } = siswaPerKelas(profil, state)
  for (const b of baris) {
    const kelasDiajar = b.tugas.jenis === 'kelas' && b.tugas.kelas
      ? [b.tugas.kelas]
      : b.tugas.jenis === 'mapel' ? (b.tugas.kelasMapel ?? []) : []
    for (const t of kelasDiajar) b.siswa[t] = siswaKelas[t].total
    b.totalSiswa = TINGKAT_LIST.reduce((a, t) => a + b.siswa[t], 0)
  }

  const totalSiswa = TINGKAT_LIST.reduce((a, t) => ({
    l: a.l + siswaKelas[t].l,
    p: a.p + siswaKelas[t].p,
    total: a.total + siswaKelas[t].total,
  }), { l: 0, p: 0, total: 0 })
  const jumlah = (ts: TingkatKelas[], jk: 'l' | 'p') => ts.reduce((a, t) => a + siswaKelas[t][jk], 0)

  return {
    baris,
    kepsek: baris.find(b => b.tugas.jenis === 'kepsek'),
    jjmKelas,
    siswaKelas,
    sumberSiswa,
    totalSiswa,
    pramuka: {
      siagaPutra: jumlah(['1', '2', '3'], 'l'),
      siagaPutri: jumlah(['1', '2', '3'], 'p'),
      penggalangPutra: jumlah(['4', '5', '6'], 'l'),
      penggalangPutri: jumlah(['4', '5', '6'], 'p'),
    },
    peringatan,
  }
}

/* ───────────── Dokumen SK + Lampiran I–IV ───────────── */

const TITIK = '..............................'
const kosongStrip = (n: number) => (n ? String(n) : '')
const isiAtauTitik = (s?: string) => (s && s.trim() ? s.trim() : TITIK)

export function teksSemester(s: SemesterSkbm) {
  return s === 'genap' ? 'II (DUA)' : 'I (SATU)'
}

/** Ganti placeholder {sekolah}/{kabupaten} pada teks isian. */
function isiPlaceholder(teks: string, profil: Profil) {
  return teks
    .replaceAll('{sekolah}', namaSekolahPendek(profil))
    .replaceAll('{kabupaten}', profil.kabupaten || TITIK)
}

/** Baris menjadi daftar bernomor "1. ..." (baris yang sudah bernomor dibiarkan). */
function bernomor(teks: string) {
  const baris = teks.split('\n').map(x => x.trim()).filter(Boolean)
  return baris.map((b, i) => (/^\d+\.\s/.test(b) ? b : `${i + 1}. ${b}`)).join('\n')
}

export function buildSkbmBlocks(profil: Profil, state: SkbmState, hasil: HasilSkbm = hitungSkbm(profil, state)): Block[] {
  const S = namaSekolahPendek(profil)
  const nomor = isiAtauTitik(state.nomor)
  const tgl = state.tanggal ? tglPanjang(state.tanggal) : TITIK
  const tempat = state.tempat.trim() || profil.kecamatan || profil.kota || TITIK
  const kepsekNama = isiAtauTitik(profil.kepsek)
  const kepsekNip = profil.nipKepsek || ''
  const kepsekPangkat = hasil.kepsek?.pangkat || ''

  const ttdPengawas: Sign = {
    atas: 'Telah diverifikasi Pengawas Pembina,',
    jabatan: ' ',
    nama: isiAtauTitik(profil.pengawas),
    pangkat: profil.pangkatPengawas || undefined,
    nip: profil.nipPengawas || undefined,
    garisBawah: false,
    rata: 'left',
  }
  const ttdKepsek: Sign = {
    atas: `Ditetapkan di : ${tempat}\nPada tanggal : ${tgl}`,
    jabatan: `Kepala ${S}`,
    nama: kepsekNama,
    pangkat: kepsekPangkat || undefined,
    nip: kepsekNip || undefined,
    garisBawah: false,
    rata: 'left',
  }
  const ttdLampiran: Block = {
    t: 'sign',
    right: { atas: `${tempat}, ${tgl}`, jabatan: 'Kepala Sekolah,', nama: kepsekNama, nip: kepsekNip || undefined, rata: 'left' },
  }
  const kepalaLampiran = (romawi: string, judul: string): Block[] => [
    { t: 'p', text: `**LAMPIRAN ${romawi} :  KEPUTUSAN KEPALA SEKOLAH ${S.toUpperCase()}**\nNOMOR : ${nomor}\nTANGGAL : ${tgl}` },
    { t: 'p', text: judul, align: 'center', bold: true },
  ]

  const KELAS_HEAD = TINGKAT_LIST.map(t => `Kelas ${ROMAWI_MAP[t]}`)
  const tengah = (n: number) => Array.from({ length: n }, () => 'center' as const)

  const sk: Block[] = [
    { t: 'kop' },
    { t: 'p', text: `KEPUTUSAN\nKEPALA ${S.toUpperCase()}`, align: 'center', bold: true },
    { t: 'p', text: `NOMOR : ${nomor}`, align: 'center' },
    { t: 'p', text: 'TENTANG\nPEMBAGIAN TUGAS DALAM KEGIATAN PROSES BELAJAR MENGAJAR', align: 'center', bold: true },
    { t: 'p', text: `SEMESTER ${teksSemester(state.semester)} TAHUN AJARAN ${state.tahunAjaran}`, align: 'center' },
    {
      t: 'meta',
      rows: [
        ['Menimbang', bernomor(isiPlaceholder(state.menimbang, profil))],
        ['Mengingat', bernomor(state.mengingat)],
      ],
    },
    { t: 'p', text: 'MEMUTUSKAN', align: 'center', bold: true },
    {
      t: 'meta',
      rows: [
        ['Menetapkan', ''],
        ['Pertama', 'Pembagian tugas guru dan pemetaan jumlah jam dalam proses kegiatan pembelajaran seperti tersebut pada Lampiran I dan Lampiran II keputusan ini;'],
        ['Kedua', 'Menugaskan guru untuk melaksanakan tugas bimbingan seperti tersebut pada Lampiran III keputusan ini;'],
        ['Ketiga', 'Pembagian tugas guru dalam pengelolaan kinerja guru dan kepala sekolah seperti tersebut pada Lampiran IV keputusan ini;'],
        ['Keempat', 'Masing-masing guru wajib melaporkan pelaksanaan tugasnya secara tertulis dan berkala kepada Kepala Sekolah;'],
        ['Kelima', 'Segala biaya yang timbul akibat pelaksanaan keputusan ini akan dibebankan kepada anggaran sebagaimana mestinya;'],
        ['Keenam', 'Keputusan ini mulai berlaku sejak tanggal ditetapkan.'],
      ],
    },
    { t: 'sign', left: ttdPengawas, right: ttdKepsek },
    { t: 'p', text: `Tembusan disampaikan Kepada Yth.\n${bernomor(isiPlaceholder(state.tembusan, profil))}` },
  ]

  const lampiran1: Block[] = [
    { t: 'halaman', orientasi: 'landscape' },
    ...kepalaLampiran('I', 'PEMETAAN JUMLAH JAM MENGAJAR PEMBAGIAN TUGAS GURU\nDALAM PROSES BELAJAR MENGAJAR'),
    {
      t: 'table',
      kecil: true,
      head: ['NO', 'NAMA', 'NIP', 'PANGKAT/ GOLONGAN RUANG', 'JABATAN', 'JENIS GURU', 'TUGAS MENGAJAR', ...KELAS_HEAD, 'JUMLAH JAM'],
      kelompok: [{ mulai: 7, jumlah: 6, teks: 'Jumlah Jam Mengajar per-Rombel' }],
      widths: [3, 15, 12, 12, 7, 8, 11, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 5],
      align: ['center', 'left', 'left', 'left', 'center', 'center', 'center', ...tengah(6), 'center'],
      rows: hasil.baris.map((b, i) => [
        String(i + 1), b.nama, b.nip, b.pangkat, b.jabatan, b.jenisGuru, b.tugasLabel,
        ...TINGKAT_LIST.map(t => kosongStrip(b.jam[t])),
        b.totalJam ? `**${b.totalJam}**` : '',
      ]),
    },
    ttdLampiran,
  ]

  const lampiran2: Block[] = [
    { t: 'halaman', orientasi: 'landscape' },
    ...kepalaLampiran('II', 'PEMBAGIAN TUGAS GURU\nDALAM PROSES BELAJAR MENGAJAR'),
    {
      t: 'table',
      kecil: true,
      head: ['NO', 'NAMA', 'NIP', 'PANGKAT/ GOLONGAN RUANG', 'JABATAN', 'JENIS GURU', 'TUGAS MENGAJAR', ...KELAS_HEAD, 'JUMLAH'],
      kelompok: [{ mulai: 7, jumlah: 6, teks: 'Jumlah Siswa per-Rombel' }],
      widths: [3, 15, 12, 12, 7, 8, 11, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 5],
      align: ['center', 'left', 'left', 'left', 'center', 'center', 'center', ...tengah(6), 'center'],
      rows: hasil.baris.map((b, i) => [
        String(i + 1), b.nama, b.nip, b.pangkat, b.jabatan, b.jenisGuru, b.tugasLabel,
        ...TINGKAT_LIST.map(t => kosongStrip(b.siswa[t])),
        b.totalSiswa ? `**${b.totalSiswa}**` : '',
      ]),
    },
    ttdLampiran,
  ]

  const lampiran3: Block[] = [
    { t: 'halaman', orientasi: 'portrait' },
    ...kepalaLampiran('III', 'PEMBAGIAN TUGAS GURU DALAM MEMBIMBING SISWA\nDALAM KEGIATAN KOKURIKULER DAN EKSTRAKURIKULER'),
    {
      t: 'table',
      head: ['NO.', 'NAMA', 'NIP', 'PENUGASAN DALAM MEMBIMBING', 'SASARAN BIMBINGAN'],
      widths: [6, 27, 22, 26, 19],
      align: ['center', 'left', 'left', 'center', 'center'],
      tall: true,
      rows: hasil.baris.map((b, i) => {
        const tugas = (b.tugas.bimbingan ?? '').split('\n').map(x => x.trim()).filter(Boolean)
        return [
          String(i + 1), b.nama, b.nip,
          tugas.length > 1 ? tugas.map(x => `• ${x}`).join('\n') : (tugas[0] ?? ''),
          b.tugas.sasaran?.trim() ?? '',
        ]
      }),
    },
    ttdLampiran,
  ]

  const guruDinilai = hasil.baris.filter(b => b.tugas.jenis !== 'kepsek')
  const lampiran4: Block[] = [
    { t: 'halaman', orientasi: 'portrait' },
    ...kepalaLampiran('IV', 'PEMBAGIAN TUGAS\nDALAM PENGELOLAAN KINERJA GURU DAN KEPALA SEKOLAH'),
    {
      t: 'table',
      kecil: true,
      head: ['NO.', 'NAMA', 'NIP', 'PANGKAT/ GOLONGAN RUANG', 'JABATAN', 'TUGAS MENGAJAR', 'KETERANGAN'],
      widths: [5, 23, 18, 17, 12, 15, 10],
      align: ['center', 'left', 'left', 'center', 'center', 'center', 'center'],
      rows: [
        ['', '**Penilai**', '', '', '', '', ''],
        ['1', isiAtauTitik(profil.pengawas), profil.nipPengawas || '', profil.pangkatPengawas || '', 'Pengawas Sekolah', '', ''],
        ['', '**Kepala sekolah yang dinilai**', '', '', '', '', ''],
        ['2', kepsekNama, kepsekNip, kepsekPangkat, 'Kepala Sekolah', '', ''],
        ['', '**Guru yang dinilai**', '', '', '', '', ''],
        ...guruDinilai.map((b, i) => [`2.${i + 1}`, b.nama, b.nip, b.pangkat, b.jabatan, b.tugasLabel, '']),
      ],
    },
    ttdLampiran,
  ]

  return [...sk, ...lampiran1, ...lampiran2, ...lampiran3, ...lampiran4]
}
