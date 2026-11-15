import { DAFTAR1_DEFAULT_GURUS, DAFTAR1_DEFAULT_SISWA, DAFTAR1_DEFAULT_STATE } from '../data/daftar1Default'
import type { Profil } from './profil'

export const BULAN_DAFTAR1 = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const BULAN_TAHUN_AJARAN = [
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
] as const

export type BulanDaftar1 = (typeof BULAN_DAFTAR1)[number]
export type TingkatKelas = '1' | '2' | '3' | '4' | '5' | '6'
export type RomawiKelas = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'
export type ModeUsiaDaftar1 = 'tanggal' | 'tahun'
export type AgamaKey = 'islam' | 'katolik' | 'protestan' | 'hindu' | 'budha'

export const TINGKAT_LIST: TingkatKelas[] = ['1', '2', '3', '4', '5', '6']
export const ROMAWI_MAP: Record<TingkatKelas, RomawiKelas> = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
}
export const AGAMA_LIST: Array<{ key: AgamaKey, label: string }> = [
  { key: 'islam', label: 'Islam' },
  { key: 'katolik', label: 'Katolik' },
  { key: 'protestan', label: 'Protestan' },
  { key: 'hindu', label: 'Hindu' },
  { key: 'budha', label: 'Budha' },
]
export const RENTANG_UMUR = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const

export interface Daftar1SiswaBase {
  nama: string
  jk: 'L' | 'P'
  tglLahir: string
  tingkat: TingkatKelas
  rombel: string
  nisn?: string
  nik?: string
  agama?: AgamaKey
}

export interface Daftar1SiswaRow extends Daftar1SiswaBase {
  key: string
  no: number
  usia: number | null
  bb: number | null
  tb: number | null
  sumber: 'sptjm' | 'manual'
}

export interface Daftar1BbTb {
  bb: number | null
  tb: number | null
}

export interface Daftar1GuruMeta {
  nama?: string
  nip?: string
  nuptk?: string
  jk?: 'L' | 'P'
  tempatLahir?: string
  tglLahir?: string
  agama?: string
  kawin?: string
  anakDibawah18?: string
  ijazahTahun?: string
  jabatanDaftar1?: string
  tmtDiangkat?: string
  tmtSekolahIni?: string
  mengajarKelas?: string
  tglSkTerakhir?: string
  noSkTerakhir?: string
  golongan?: string
  gajiPokok?: number
  absenSakit?: number
  absenIzin?: number
  absenLain?: number
  keterangan?: string
  tersertifikasi?: 'Sudah' | 'Belum'
}

export interface Daftar1GuruRow {
  key: string
  no: number
  nama: string
  nip: string
  nuptk: string
  jk: 'L' | 'P'
  tempatLahir: string
  tglLahir: string
  agama: string
  kawin: string
  anakDibawah18: string
  ijazahTahun: string
  jabatanDaftar1: string
  masaKerjaTahun: number
  masaKerjaBulan: number
  tmtDiangkat: string
  tmtSekolahIni: string
  mengajarKelas: string
  tglSkTerakhir: string
  noSkTerakhir: string
  golongan: string
  gajiPokok: number
  absenSakit: number
  absenIzin: number
  absenLain: number
  keterangan: string
  tersertifikasi: 'Sudah' | 'Belum'
  sumber: 'sptjm' | 'profil' | 'manual'
}

export interface Daftar1Mutasi {
  keluarL: number
  keluarP: number
  masukL: number
  masukP: number
}

export interface Daftar1MebelerItem {
  nama: string
  baik: number
  sedang: number
  rusak: number
}

export interface Daftar1JenisBangunan {
  nama: string
  permanen: number
  semi: number
  darurat: number
  tahunP: string
  tahunSp: string
  tahunDr: string
  hargaRp: number
}

export interface Daftar1Sarpras {
  nss: string
  tahunPendirian: string
  statusKepemilikanSekolah: '1. Negeri' | '2. Swasta'
  kategoriWilayahSekolah: '1. Inti' | '2. Imbas'
  kategoriDesa: '1. IDT' | '2. Non IDT'
  tanahLuasM2: number
  tanahNoPersil: string
  tanahTahun: string
  tanahHarga: number
  bangunanBaik: { bgn: number, rgn: number }
  bangunanSedang: { bgn: number, rgn: number }
  bangunanRusak: { bgn: number, rgn: number }
  menyewaRp: number
  menumpangDi: string
  jenisBangunan: Daftar1JenisBangunan[]
  airBersih: string
  mebeler: Daftar1MebelerItem[]
}

export interface Daftar1AbsensiBulanan {
  sakit: number
  ijin: number
  lainLain: number
}

export interface Daftar1State {
  bulan: BulanDaftar1
  tahun: number
  tahunPelajaran: string
  modeUsia: ModeUsiaDaftar1
  mutasiPerKelas: Record<TingkatKelas, Daftar1Mutasi>
  mutasiPerAgama: Record<AgamaKey, Daftar1Mutasi>
  hariEfektif: Record<BulanDaftar1, number>
  absensi: Daftar1AbsensiBulanan
  sarpras: Daftar1Sarpras
  bbTbByKey: Record<string, Daftar1BbTb>
  agamaByKey: Record<string, AgamaKey>
  guruMetaByKey: Record<string, Daftar1GuruMeta>
  siswaLokal: Daftar1SiswaBase[] | null
  customSiswa: Daftar1SiswaBase[]
  tanggalLaporan: string
}

export interface RekapLP {
  bulanLaluL: number
  bulanLaluP: number
  keluarL: number
  keluarP: number
  masukL: number
  masukP: number
  penghabisanL: number
  penghabisanP: number
  total: number
}

export interface RekapUmurRow {
  umur: number
  perKelas: Record<TingkatKelas, { l: number, p: number }>
  totalL: number
  totalP: number
  total: number
}

export interface RekapDaftar1 {
  sumberSiswa: 'sptjm' | 'excel-awal'
  sumberGuru: 'sptjm' | 'profil-awal'
  siswa: Daftar1SiswaRow[]
  guru: Daftar1GuruRow[]
  perKelas: Record<TingkatKelas, RekapLP>
  totalKelas: RekapLP
  umurRows: RekapUmurRow[]
  umurJumlahPerKelas: Record<TingkatKelas, { l: number, p: number, total: number }>
  umurGrandTotal: { l: number, p: number, total: number }
  tanpaTglLahir: number
  perAgama: Record<AgamaKey, RekapLP>
  totalAgama: RekapLP
  jumlahGuru: {
    kepalaSekolah: number
    guruKelas: number
    guruAgama: number
    guruPenjas: number
    guruKelasTks: number
    tendik: number
    jumlah: number
  }
  hariEfektifBulanIni: number
  absensi: {
    jumlahMurid: number
    sakit: number
    ijin: number
    lainLain: number
    rataHadir: number
    persenHadir: number
  }
  mebelerTotal: Array<Daftar1MebelerItem & { jumlah: number }>
  bangunanJumlah: { bgn: number, rgn: number }
}

const DEFAULT_MUTASI = (): Daftar1Mutasi => ({ keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 })

export function cloneDaftar1DefaultState(): Daftar1State {
  return terapkanBulanIni(structuredClone(DAFTAR1_DEFAULT_STATE))
}

export function mergeDaftar1State(partial?: Partial<Daftar1State> | null): Daftar1State {
  const base = cloneDaftar1DefaultState()
  if (!partial) return base

  const mutasiPerKelas = { ...base.mutasiPerKelas }
  for (const t of TINGKAT_LIST) {
    mutasiPerKelas[t] = { ...DEFAULT_MUTASI(), ...(partial.mutasiPerKelas?.[t] || {}) }
  }

  const mutasiPerAgama = { ...base.mutasiPerAgama }
  for (const a of AGAMA_LIST) {
    mutasiPerAgama[a.key] = { ...DEFAULT_MUTASI(), ...(partial.mutasiPerAgama?.[a.key] || {}) }
  }

  return terapkanBulanIni({
    ...base,
    ...partial,
    mutasiPerKelas,
    mutasiPerAgama,
    hariEfektif: { ...base.hariEfektif, ...(partial.hariEfektif || {}) },
    absensi: { ...base.absensi, ...(partial.absensi || {}) },
    sarpras: {
      ...base.sarpras,
      ...(partial.sarpras || {}),
      bangunanBaik: { ...base.sarpras.bangunanBaik, ...(partial.sarpras?.bangunanBaik || {}) },
      bangunanSedang: { ...base.sarpras.bangunanSedang, ...(partial.sarpras?.bangunanSedang || {}) },
      bangunanRusak: { ...base.sarpras.bangunanRusak, ...(partial.sarpras?.bangunanRusak || {}) },
      jenisBangunan: Array.isArray(partial.sarpras?.jenisBangunan) && partial.sarpras.jenisBangunan.length
        ? partial.sarpras.jenisBangunan
        : base.sarpras.jenisBangunan,
      mebeler: Array.isArray(partial.sarpras?.mebeler) && partial.sarpras.mebeler.length
        ? partial.sarpras.mebeler
        : base.sarpras.mebeler,
    },
    bbTbByKey: { ...base.bbTbByKey, ...(partial.bbTbByKey || {}) },
    agamaByKey: { ...base.agamaByKey, ...(partial.agamaByKey || {}) },
    guruMetaByKey: { ...base.guruMetaByKey, ...(partial.guruMetaByKey || {}) },
    siswaLokal: partial.siswaLokal === undefined ? base.siswaLokal : partial.siswaLokal,
    customSiswa: Array.isArray(partial.customSiswa) ? partial.customSiswa : base.customSiswa,
  })
}

export function normalisasiKunciSiswa(nama: string): string {
  return String(nama || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function normalisasiKunciGuru(nama: string): string {
  const withoutTrailingTitles = String(nama || '')
    .replace(/\u00a0/g, ' ')
    .split(',')[0] || ''
  return withoutTrailingTitles
    .replace(/^(HJ\.?|H\.?|DRS?\.?|PROF\.?|IR\.?)\s+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

export function kunciSiswaRow(siswa: { nama: string, nisn?: string }): string {
  const nisn = String(siswa.nisn || '').trim()
  if (nisn && nisn !== '-' && /^\d{6,}$/.test(nisn)) return `NISN:${nisn}`
  return normalisasiKunciSiswa(siswa.nama)
}

export function normalisasiTingkat(tingkatRaw: string, rombelRaw = ''): TingkatKelas {
  const src = `${tingkatRaw || ''} ${rombelRaw || ''}`.toUpperCase()
  const digitMatch = src.match(/\b([1-6])\b/)
  if (digitMatch?.[1]) return digitMatch[1] as TingkatKelas
  if (/\bVI\b/.test(src)) return '6'
  if (/\bV\b/.test(src)) return '5'
  if (/\bIV\b/.test(src)) return '4'
  if (/\bIII\b/.test(src)) return '3'
  if (/\bII\b/.test(src)) return '2'
  return '1'
}

export function parseTanggalFlexible(raw: string): Date | null {
  const cleaned = String(raw || '').trim()
  if (!cleaned || cleaned === '-') return null
  const dateOnly = cleaned.split(/\s+/)[0] || ''

  const isoMatch = dateOnly.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2])
    const d = Number(isoMatch[3])
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  const dmyMatch = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmyMatch) {
    const d = Number(dmyMatch[1])
    const m = Number(dmyMatch[2])
    const y = Number(dmyMatch[3])
    if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, m - 1, d))
    }
  }

  return null
}

export function formatTanggalIndo(raw: string): string {
  const d = parseTanggalFlexible(raw)
  if (!d) return raw || '-'
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}-${month}-${year}`
}

export function formatTanggalIso(raw: string): string {
  const d = parseTanggalFlexible(raw)
  if (!d) return ''
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${year}-${month}-${day}`
}

export function akhirBulanUtc(bulan: BulanDaftar1, tahun: number): Date {
  const idx1Based = BULAN_DAFTAR1.indexOf(bulan) + 1
  const safeMonth = idx1Based > 0 ? idx1Based : 1
  // Hari ke-0 bulan berikutnya = tanggal terakhir bulan aktif (identik dengan EOMONTH Excel)
  return new Date(Date.UTC(tahun, safeMonth, 0))
}

/** Pilihan tahun laporan Daftar 1. */
export const TAHUN_DAFTAR1_AWAL = 2020
export const TAHUN_DAFTAR1_AKHIR = 2050
export const TAHUN_DAFTAR1: number[] = Array.from(
  { length: TAHUN_DAFTAR1_AKHIR - TAHUN_DAFTAR1_AWAL + 1 },
  (_, i) => TAHUN_DAFTAR1_AWAL + i,
)

/**
 * Tanggal acuan hitung usia siswa & masa kerja GTK = tanggal terakhir bulan laporan
 * (sama dengan EOMONTH di Excel Daftar 1), mis. Januari 2025 → 31 Januari 2025.
 */
export function tanggalAcuanDaftar1(state: Pick<Daftar1State, 'bulan' | 'tahun'>): Date {
  return akhirBulanUtc(state.bulan, state.tahun)
}

/** Tanggal tanda tangan laporan: tanggal terakhir bulan laporan, mis. "29 Februari 2028". */
export function tanggalLaporanDaftar1(state: Pick<Daftar1State, 'bulan' | 'tahun'>): string {
  return `${tanggalAcuanDaftar1(state).getUTCDate()} ${state.bulan} ${state.tahun}`
}

/** Bulan & tahun berjalan beserta tahun pelajarannya (pilihan bawaan saat aplikasi dibuka). */
export function periodeBulanIni(now = new Date()): Pick<Daftar1State, 'bulan' | 'tahun' | 'tahunPelajaran'> {
  const bulan = BULAN_DAFTAR1[now.getMonth()]!
  const tahun = now.getFullYear()
  return { bulan, tahun, tahunPelajaran: hitungTahunPelajaran(bulan, tahun) }
}

/** Setel periode laporan ke bulan berjalan; dipakai setiap kali data Daftar 1 dimuat/diimpor. */
export function terapkanBulanIni<T extends Daftar1State>(state: T, now = new Date()): T {
  const p = periodeBulanIni(now)
  return { ...state, ...p, tanggalLaporan: tanggalLaporanDaftar1(p) }
}

/**
 * Tempat & tanggal tanda tangan laporan ("Desa, 30 November 2026").
 * Selalu diturunkan dari bulan laporan yang dipilih, bukan dari nilai tersimpan.
 */
export function tanggalTtdDaftar1(
  profil: Pick<Profil, 'desa' | 'kota'>,
  state: Pick<Daftar1State, 'bulan' | 'tahun'>,
): string {
  const lokasi = profil.desa || profil.kota || '..........'
  return `${lokasi}, ${tanggalLaporanDaftar1(state)}`
}

/** Keterangan acuan hitung untuk ditampilkan di layar/Excel. */
export function labelAcuanDaftar1(state: Pick<Daftar1State, 'bulan' | 'tahun'>): string {
  return tanggalLaporanDaftar1(state)
}

/** Selisih kalender penuh (tahun & bulan) dari `start` sampai `ref`; 0 bila `ref` sebelum `start`. */
function selisihKalender(start: Date, ref: Date): { tahun: number, bulan: number } {
  if (ref.getTime() < start.getTime()) return { tahun: 0, bulan: 0 }
  let totalBulan = (ref.getUTCFullYear() - start.getUTCFullYear()) * 12
    + (ref.getUTCMonth() - start.getUTCMonth())
  if (ref.getUTCDate() < start.getUTCDate()) totalBulan -= 1
  totalBulan = Math.max(0, totalBulan)
  return { tahun: Math.floor(totalBulan / 12), bulan: totalBulan % 12 }
}

/**
 * Usia siswa (tahun penuh) pada tanggal acuan, dihitung per kalender sehingga tepat di sekitar
 * hari ulang tahun. `tahunSaja` = cara lama "tahun berjalan": tahun acuan dikurangi tahun lahir.
 */
export function hitungUsiaSiswa(tglLahirRaw: string, acuan: Date, tahunSaja = false): number | null {
  const dob = parseTanggalFlexible(tglLahirRaw)
  if (!dob) return null
  if (tahunSaja) return Math.max(0, acuan.getUTCFullYear() - dob.getUTCFullYear())
  return selisihKalender(dob, acuan).tahun
}

/** Masa kerja dari TMT sampai tanggal acuan. */
export function hitungMasaKerja(tmtRaw: string, acuan: Date): { tahun: number, bulan: number } {
  const start = parseTanggalFlexible(tmtRaw)
  if (!start) return { tahun: 0, bulan: 0 }
  return selisihKalender(start, acuan)
}

export function gabungSiswaDaftar1(profil: Profil, state: Daftar1State): {
  sumber: 'sptjm' | 'excel-awal'
  rows: Daftar1SiswaRow[]
} {
  const sptjmList = profil.dapodik?.pesertaDidik || []
  const pakaiSptjm = sptjmList.length > 0
  const acuan = tanggalAcuanDaftar1(state)
  const baseList: Array<Daftar1SiswaBase & { sumber: 'sptjm' | 'manual' }> = pakaiSptjm
    ? [
        ...sptjmList.map(pd => ({
          nama: pd.nama,
          jk: pd.jk,
          tglLahir: formatTanggalIso(pd.tglLahir) || pd.tglLahir,
          tingkat: normalisasiTingkat(pd.tingkat, pd.rombel),
          rombel: pd.rombel || `Kelas ${normalisasiTingkat(pd.tingkat, pd.rombel)}`,
          nisn: pd.nisn,
          nik: pd.nik,
          sumber: 'sptjm' as const,
        })),
        ...state.customSiswa.map(s => ({ ...s, sumber: 'manual' as const })),
      ]
    : [
        ...(state.siswaLokal ?? DAFTAR1_DEFAULT_SISWA).map(s => ({ ...s, sumber: 'manual' as const })),
        ...state.customSiswa.map(s => ({ ...s, sumber: 'manual' as const })),
      ]

  const rows: Daftar1SiswaRow[] = baseList.map((item, idx) => {
    const namaKey = normalisasiKunciSiswa(item.nama)
    const primaryKey = kunciSiswaRow(item)
    const bbTb = state.bbTbByKey[primaryKey] ?? state.bbTbByKey[namaKey]
    const agama = state.agamaByKey[primaryKey] ?? state.agamaByKey[namaKey] ?? item.agama ?? 'islam'
    return {
      ...item,
      agama,
      key: primaryKey,
      no: idx + 1,
      usia: hitungUsiaSiswa(item.tglLahir, acuan),
      bb: bbTb?.bb ?? null,
      tb: bbTb?.tb ?? null,
    }
  })

  rows.sort((a, b) => {
    if (a.tingkat !== b.tingkat) return Number(a.tingkat) - Number(b.tingkat)
    return a.nama.localeCompare(b.nama, 'id')
  })
  rows.forEach((r, idx) => {
    r.no = idx + 1
  })

  return {
    sumber: pakaiSptjm ? 'sptjm' : 'excel-awal',
    rows,
  }
}

function cariMetaGuru(
  nama: string,
  nip: string,
  nuptk: string,
  metaMap: Record<string, Daftar1GuruMeta>,
): { key: string, meta: Daftar1GuruMeta | undefined } {
  const cleanNip = nip && nip !== '-' ? nip.replace(/\s+/g, '') : ''
  const cleanNuptk = nuptk && nuptk !== '-' ? nuptk.replace(/\s+/g, '') : ''
  const baseNama = normalisasiKunciGuru(nama)

  for (const [k, m] of Object.entries(metaMap)) {
    if (cleanNip && m.nip && m.nip.replace(/\s+/g, '') === cleanNip) return { key: k, meta: m }
    if (cleanNuptk && m.nuptk && m.nuptk.replace(/\s+/g, '') === cleanNuptk) return { key: k, meta: m }
    if (normalisasiKunciGuru(k) === baseNama || (m.nama && normalisasiKunciGuru(m.nama) === baseNama)) {
      return { key: k, meta: m }
    }
  }

  return { key: baseNama, meta: undefined }
}

/** Cari baris GTK di Profil yang sama dengan guru di Daftar 1 (NIP, lalu NUPTK, lalu nama tanpa gelar). */
function cariGtkProfil(list: Profil['gtk'], nama: string, nip: string, nuptk: string) {
  const bersih = (v: string) => (v && v !== '-' ? v.replace(/\s+/g, '') : '')
  const cNip = bersih(nip)
  const cNuptk = bersih(nuptk)
  const cNama = normalisasiKunciGuru(nama)
  return list.find(g => cNip && bersih(g.nip) === cNip)
    ?? list.find(g => cNuptk && bersih(g.nuptk) === cNuptk)
    ?? list.find(g => normalisasiKunciGuru(g.nama) === cNama)
}

function tebakJabatanDaftar1(jenis: string, jabatanProfil: string, waliKelas = ''): string {
  const gabungan = `${jenis} ${jabatanProfil} ${waliKelas}`.toUpperCase()
  if (gabungan.includes('KEPALA')) return 'Kepala Sekolah'
  if (gabungan.includes('AGAMA') || gabungan.includes('PAI')) return 'Guru PAI'
  if (gabungan.includes('PENJAS') || gabungan.includes('PJOK') || gabungan.includes('OLAHRAGA')) return 'Guru PJOK'
  if (gabungan.includes('TENDIK') || gabungan.includes('ADMINISTRASI') || gabungan.includes('PENJAGA')) return 'Tendik'
  return 'Guru Kelas'
}

function tebakMengajarKelas(waliKelas: string | undefined, jabatan: string): string {
  if (jabatan === 'Kepala Sekolah') return '-'
  if (jabatan === 'Guru PAI' || jabatan === 'Guru PJOK') return 'I-VI'
  if (waliKelas) {
    const t = normalisasiTingkat('', waliKelas)
    return ROMAWI_MAP[t]
  }
  return '-'
}

function hitungTahunPelajaran(bulan: BulanDaftar1, tahun: number): string {
  const idx = BULAN_TAHUN_AJARAN.indexOf(bulan)
  if (idx >= 0 && idx <= 5) return `${tahun}/${tahun + 1}`
  return `${tahun - 1}/${tahun}`
}

export function saranTahunPelajaran(bulan: BulanDaftar1, tahun: number): string {
  return hitungTahunPelajaran(bulan, tahun)
}

export function gabungGuruDaftar1(profil: Profil, state: Daftar1State): {
  sumber: 'sptjm' | 'profil-awal'
  rows: Daftar1GuruRow[]
} {
  const mergedMetaMap: Record<string, Daftar1GuruMeta> = {}
  for (const g of DAFTAR1_DEFAULT_GURUS) {
    mergedMetaMap[normalisasiKunciGuru(g.nama || '')] = g
  }
  for (const [k, m] of Object.entries(state.guruMetaByKey)) {
    mergedMetaMap[k] = { ...mergedMetaMap[k], ...m }
  }

  const sptjmGtk = profil.dapodik?.gtkDetail || []
  const pakaiSptjm = sptjmGtk.length > 0

  const rawItems: Array<{
    nama: string
    nip: string
    nuptk: string
    jk: 'L' | 'P'
    tglLahir: string
    jenis: string
    status: string
    waliKelas?: string
    sumber: 'sptjm' | 'profil' | 'manual'
  }> = pakaiSptjm
    ? sptjmGtk.map(g => ({
        nama: g.nama,
        nip: g.nip || '-',
        nuptk: g.nuptk || '-',
        jk: g.jk || 'L',
        tglLahir: g.tglLahir || '',
        jenis: g.jenis || 'Guru Kelas',
        status: g.status || '-',
        waliKelas: g.waliKelas,
        sumber: 'sptjm' as const,
      }))
    : profil.gtk.map((g, idx) => {
        // Tanpa SPTJM, daftar GTK diambil dari Profil; biodata tambahan dicocokkan dari guruMetaByKey.
        const { meta } = cariMetaGuru(g.nama, g.nip, g.nuptk, mergedMetaMap)
        return {
          nama: g.nama || meta?.nama || `GTK ${idx + 1}`,
          nip: g.nip || meta?.nip || '-',
          nuptk: g.nuptk || meta?.nuptk || '-',
          jk: g.jk || meta?.jk || 'L',
          tglLahir: meta?.tglLahir || '',
          jenis: g.jabatan || meta?.jabatanDaftar1 || 'Guru Kelas',
          status: meta?.keterangan || '-',
          waliKelas: meta?.mengajarKelas,
          sumber: 'profil' as const,
        }
      })

  const isi = (v?: string) => (v && v.trim() && v.trim() !== '-' ? v.trim() : '')

  const rows: Daftar1GuruRow[] = rawItems.map((item, idx) => {
    const { key, meta } = cariMetaGuru(item.nama, item.nip, item.nuptk, mergedMetaMap)
    // TMT dari daftar GTK di Profil (SPTJM tidak memuat TMT); data edit di Daftar 1 tetap diutamakan.
    const gtkProfil = cariGtkProfil(profil.gtk, item.nama, item.nip, item.nuptk)
    const jabatan = meta?.jabatanDaftar1 || tebakJabatanDaftar1(item.jenis, item.jenis, item.waliKelas)
    const mengajarKelas = meta?.mengajarKelas || tebakMengajarKelas(item.waliKelas, jabatan)
    const tmtDiangkatRaw = isi(meta?.tmtDiangkat) || isi(gtkProfil?.tmt)
    const tmtSekolahRaw = isi(meta?.tmtSekolahIni) || isi(gtkProfil?.tmtSekolah)
    const tmtDiangkat = tmtDiangkatRaw ? formatTanggalIndo(tmtDiangkatRaw) : '-'
    const tglUntukMasaKerja = tmtDiangkatRaw || tmtSekolahRaw
    const masaKerja = hitungMasaKerja(tglUntukMasaKerja, tanggalAcuanDaftar1(state))

    return {
      key: key || `GTK-${idx + 1}`,
      no: idx + 1,
      // Nama bergelar dari Profil (gelar diisi manual di sana); edit di Daftar 1 (meta) tetap diutamakan.
      nama: meta?.nama || gtkProfil?.nama || item.nama,
      nip: meta?.nip || item.nip || '-',
      nuptk: meta?.nuptk || item.nuptk || '-',
      jk: item.jk,
      tempatLahir: meta?.tempatLahir || '-',
      tglLahir: formatTanggalIndo(item.tglLahir || meta?.tglLahir || ''),
      agama: meta?.agama || 'ISLAM',
      kawin: meta?.kawin || '-',
      anakDibawah18: meta?.anakDibawah18 || '-',
      ijazahTahun: meta?.ijazahTahun || '-',
      jabatanDaftar1: jabatan,
      masaKerjaTahun: masaKerja.tahun,
      masaKerjaBulan: masaKerja.bulan,
      tmtDiangkat,
      tmtSekolahIni: tmtSekolahRaw ? formatTanggalIndo(tmtSekolahRaw) : '-',
      mengajarKelas,
      tglSkTerakhir: meta?.tglSkTerakhir || '-',
      noSkTerakhir: meta?.noSkTerakhir || '-',
      golongan: meta?.golongan || '-',
      gajiPokok: Number(meta?.gajiPokok || 0),
      absenSakit: Number(meta?.absenSakit || 0),
      absenIzin: Number(meta?.absenIzin || 0),
      absenLain: Number(meta?.absenLain || 0),
      keterangan: meta?.keterangan || item.status || '-',
      tersertifikasi: meta?.tersertifikasi || 'Belum',
      sumber: item.sumber,
    }
  })

  return {
    sumber: pakaiSptjm ? 'sptjm' : 'profil-awal',
    rows,
  }
}

export function formatTtlDaftar1(tempat: string, tgl: string): string {
  const cleanTempat = (tempat || '').trim()
  const cleanTgl = (tgl || '').trim()
  if (!cleanTempat && (!cleanTgl || cleanTgl === '-')) return '-'
  if (!cleanTgl || cleanTgl === '-') return cleanTempat
  return `${cleanTempat}, ${cleanTgl}`
}

export function hitungRekapDaftar1(profil: Profil, state: Daftar1State): RekapDaftar1 {
  const { sumber: sumberSiswa, rows: siswa } = gabungSiswaDaftar1(profil, state)
  const { sumber: sumberGuru, rows: guru } = gabungGuruDaftar1(profil, state)

  const perKelas = {} as Record<TingkatKelas, RekapLP>
  const totalKelas: RekapLP = {
    bulanLaluL: 0,
    bulanLaluP: 0,
    keluarL: 0,
    keluarP: 0,
    masukL: 0,
    masukP: 0,
    penghabisanL: 0,
    penghabisanP: 0,
    total: 0,
  }

  for (const t of TINGKAT_LIST) {
    const inClass = siswa.filter(s => s.tingkat === t)
    const penghabisanL = inClass.filter(s => s.jk === 'L').length
    const penghabisanP = inClass.filter(s => s.jk === 'P').length
    const mut = state.mutasiPerKelas[t] || DEFAULT_MUTASI()
    const bulanLaluL = Math.max(0, penghabisanL + mut.keluarL - mut.masukL)
    const bulanLaluP = Math.max(0, penghabisanP + mut.keluarP - mut.masukP)
    const entry: RekapLP = {
      bulanLaluL,
      bulanLaluP,
      keluarL: mut.keluarL,
      keluarP: mut.keluarP,
      masukL: mut.masukL,
      masukP: mut.masukP,
      penghabisanL,
      penghabisanP,
      total: penghabisanL + penghabisanP,
    }
    perKelas[t] = entry
    totalKelas.bulanLaluL += entry.bulanLaluL
    totalKelas.bulanLaluP += entry.bulanLaluP
    totalKelas.keluarL += entry.keluarL
    totalKelas.keluarP += entry.keluarP
    totalKelas.masukL += entry.masukL
    totalKelas.masukP += entry.masukP
    totalKelas.penghabisanL += entry.penghabisanL
    totalKelas.penghabisanP += entry.penghabisanP
    totalKelas.total += entry.total
  }

  let tanpaTglLahir = 0
  const umurRows: RekapUmurRow[] = RENTANG_UMUR.map((umur) => {
    const rowKelas = {} as Record<TingkatKelas, { l: number, p: number }>
    let totalL = 0
    let totalP = 0
    for (const t of TINGKAT_LIST) {
      rowKelas[t] = { l: 0, p: 0 }
    }
    for (const s of siswa) {
      if (s.usia === null) continue
      const bucket = s.usia <= 5 ? 5 : s.usia >= 14 ? 14 : s.usia
      if (bucket !== umur) continue
      if (s.jk === 'L') {
        rowKelas[s.tingkat].l += 1
        totalL += 1
      }
      else {
        rowKelas[s.tingkat].p += 1
        totalP += 1
      }
    }
    return { umur, perKelas: rowKelas, totalL, totalP, total: totalL + totalP }
  })

  for (const s of siswa) {
    if (s.usia === null) tanpaTglLahir += 1
  }

  const umurJumlahPerKelas = {} as Record<TingkatKelas, { l: number, p: number, total: number }>
  const umurGrandTotal = { l: 0, p: 0, total: 0 }
  for (const t of TINGKAT_LIST) {
    let l = 0
    let p = 0
    for (const r of umurRows) {
      l += r.perKelas[t].l
      p += r.perKelas[t].p
    }
    umurJumlahPerKelas[t] = { l, p, total: l + p }
    umurGrandTotal.l += l
    umurGrandTotal.p += p
    umurGrandTotal.total += l + p
  }

  const perAgama = {} as Record<AgamaKey, RekapLP>
  const totalAgama: RekapLP = {
    bulanLaluL: 0,
    bulanLaluP: 0,
    keluarL: 0,
    keluarP: 0,
    masukL: 0,
    masukP: 0,
    penghabisanL: 0,
    penghabisanP: 0,
    total: 0,
  }
  for (const { key } of AGAMA_LIST) {
    const inAgama = siswa.filter(s => (s.agama || 'islam') === key)
    const penghabisanL = inAgama.filter(s => s.jk === 'L').length
    const penghabisanP = inAgama.filter(s => s.jk === 'P').length
    const mut = state.mutasiPerAgama[key] || DEFAULT_MUTASI()
    const bulanLaluL = Math.max(0, penghabisanL + mut.keluarL - mut.masukL)
    const bulanLaluP = Math.max(0, penghabisanP + mut.keluarP - mut.masukP)
    const entry: RekapLP = {
      bulanLaluL,
      bulanLaluP,
      keluarL: mut.keluarL,
      keluarP: mut.keluarP,
      masukL: mut.masukL,
      masukP: mut.masukP,
      penghabisanL,
      penghabisanP,
      total: penghabisanL + penghabisanP,
    }
    perAgama[key] = entry
    totalAgama.bulanLaluL += entry.bulanLaluL
    totalAgama.bulanLaluP += entry.bulanLaluP
    totalAgama.keluarL += entry.keluarL
    totalAgama.keluarP += entry.keluarP
    totalAgama.masukL += entry.masukL
    totalAgama.masukP += entry.masukP
    totalAgama.penghabisanL += entry.penghabisanL
    totalAgama.penghabisanP += entry.penghabisanP
    totalAgama.total += entry.total
  }

  const jumlahGuru = {
    kepalaSekolah: 0,
    guruKelas: 0,
    guruAgama: 0,
    guruPenjas: 0,
    guruKelasTks: 0,
    tendik: 0,
    jumlah: guru.length,
  }
  for (const g of guru) {
    const j = g.jabatanDaftar1.toUpperCase()
    const ket = g.keterangan.toUpperCase()
    if (j.includes('KEPALA')) jumlahGuru.kepalaSekolah += 1
    else if (j.includes('PAI') || j.includes('AGAMA')) jumlahGuru.guruAgama += 1
    else if (j.includes('PJOK') || j.includes('PENJAS') || j.includes('OLAHRAGA')) jumlahGuru.guruPenjas += 1
    else if (j.includes('TENDIK') || j.includes('ADMINISTRASI') || j.includes('PENJAGA')) jumlahGuru.tendik += 1
    else if (ket.includes('TKS') || ket.includes('HONOR') || ket.includes('PW') || ket.includes('GTT')) {
      jumlahGuru.guruKelasTks += 1
    }
    else jumlahGuru.guruKelas += 1
  }

  const jumlahMurid = totalKelas.total
  const sakit = Number(state.absensi.sakit || 0)
  const ijin = Number(state.absensi.ijin || 0)
  const lainLain = Number(state.absensi.lainLain || 0)
  const rataHadir = Math.max(0, jumlahMurid - sakit - ijin - lainLain)
  const persenHadir = jumlahMurid > 0 ? (rataHadir / jumlahMurid) * 100 : 100

  const mebelerTotal = state.sarpras.mebeler.map(m => ({
    ...m,
    jumlah: Number(m.baik || 0) + Number(m.sedang || 0) + Number(m.rusak || 0),
  }))

  const bangunanJumlah = {
    bgn: Number(state.sarpras.bangunanBaik.bgn || 0)
      + Number(state.sarpras.bangunanSedang.bgn || 0)
      + Number(state.sarpras.bangunanRusak.bgn || 0),
    rgn: Number(state.sarpras.bangunanBaik.rgn || 0)
      + Number(state.sarpras.bangunanSedang.rgn || 0)
      + Number(state.sarpras.bangunanRusak.rgn || 0),
  }

  return {
    sumberSiswa,
    sumberGuru,
    siswa,
    guru,
    perKelas,
    totalKelas,
    umurRows,
    umurJumlahPerKelas,
    umurGrandTotal,
    tanpaTglLahir,
    perAgama,
    totalAgama,
    jumlahGuru,
    hariEfektifBulanIni: Number(state.hariEfektif[state.bulan] || 0),
    absensi: {
      jumlahMurid,
      sakit,
      ijin,
      lainLain,
      rataHadir,
      persenHadir,
    },
    mebelerTotal,
    bangunanJumlah,
  }
}
