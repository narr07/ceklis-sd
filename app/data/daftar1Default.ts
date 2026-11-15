import type {
  Daftar1BbTb,
  Daftar1GuruMeta,
  Daftar1SiswaBase,
  Daftar1State,
} from '~/utils/daftar1'

/*
 * Data bawaan sengaja dikosongkan: daftar siswa, berat/tinggi badan, dan biodata GTK
 * adalah data pribadi (sebagian milik anak). Data asli setiap sekolah masuk lewat impor
 * SPTJM Dapodik, input manual di halaman Daftar 1, atau impor database (.json).
 */
export const DAFTAR1_DEFAULT_SISWA: Daftar1SiswaBase[] = []

export const DAFTAR1_DEFAULT_BB_TB: Record<string, Daftar1BbTb> = {}

export const DAFTAR1_DEFAULT_GURUS: Daftar1GuruMeta[] = []

export const DAFTAR1_DEFAULT_STATE: Daftar1State = {
  bulan: 'Januari',
  tahun: 2026,
  tahunPelajaran: '2025/2026',
  modeUsia: 'tanggal',
  mutasiPerKelas: {
    '1': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    '2': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    '3': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    '4': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    '5': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    '6': { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
  },
  mutasiPerAgama: {
    islam: { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    katolik: { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    protestan: { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    hindu: { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
    budha: { keluarL: 0, keluarP: 0, masukL: 0, masukP: 0 },
  },
  hariEfektif: {
    Juli: 14,
    Agustus: 20,
    September: 21,
    Oktober: 23,
    November: 20,
    Desember: 18,
    Januari: 14,
    Februari: 17,
    Maret: 12,
    April: 21,
    Mei: 18,
    Juni: 18,
  },
  absensi: { sakit: 0, ijin: 0, lainLain: 0 },
  sarpras: {
    nss: '',
    tahunPendirian: '',
    statusKepemilikanSekolah: '1. Negeri',
    kategoriWilayahSekolah: '1. Inti',
    kategoriDesa: '2. Non IDT',
    tanahLuasM2: 0,
    tanahNoPersil: '',
    tanahTahun: '-',
    tanahHarga: 0,
    bangunanBaik: { bgn: 0, rgn: 0 },
    bangunanSedang: { bgn: 0, rgn: 0 },
    bangunanRusak: { bgn: 0, rgn: 0 },
    menyewaRp: 0,
    menumpangDi: '',
    jenisBangunan: [
      { nama: 'Bangunan SD', permanen: 1, semi: 0, darurat: 0, tahunP: '-', tahunSp: '-', tahunDr: '-', hargaRp: 0 },
      { nama: 'Rumah Dinas Kepala Sekolah', permanen: 0, semi: 0, darurat: 0, tahunP: '-', tahunSp: '-', tahunDr: '-', hargaRp: 0 },
      { nama: 'Rumah Dinas Guru', permanen: 0, semi: 0, darurat: 0, tahunP: '-', tahunSp: '-', tahunDr: '-', hargaRp: 0 },
      { nama: 'Rumah Dinas Penjaga', permanen: 0, semi: 0, darurat: 0, tahunP: '-', tahunSp: '-', tahunDr: '-', hargaRp: 0 },
      { nama: 'Lain-lain', permanen: 0, semi: 0, darurat: 0, tahunP: '-', tahunSp: '-', tahunDr: '-', hargaRp: 0 },
    ],
    airBersih: '',
    mebeler: [
      { nama: 'Bangku', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Meja Murid', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Kursi Murid', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Lemari', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Meja Guru', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Kursi Guru', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Papan Tulis', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Kursi Tamu', baik: 0, sedang: 0, rusak: 0 },
      { nama: 'Rak Buku', baik: 0, sedang: 0, rusak: 0 },
    ],
  },
  bbTbByKey: DAFTAR1_DEFAULT_BB_TB,
  agamaByKey: {},
  guruMetaByKey: {},
  siswaLokal: null,
  customSiswa: [],
  tanggalLaporan: '31 Januari 2026',
}
