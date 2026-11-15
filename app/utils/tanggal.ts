const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']
const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function parse(iso: string) {
  const [y, m, d] = (iso || '').split('-').map(Number)
  return new Date(y || 2026, (m || 1) - 1, d || 1)
}

export function tglPanjang(iso: string) {
  const d = parse(iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}
export function hariTgl(iso: string) {
  const d = parse(iso)
  return `${HARI[d.getDay()]}, ${tglPanjang(iso)}`
}
export function hari(iso: string) {
  return HARI[parse(iso).getDay()]
}
export function bulanRomawi(iso: string) {
  return ROMAWI[parse(iso).getMonth()]
}
export function tahun(iso: string) {
  return parse(iso).getFullYear()
}

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']

function eja(n: number): string {
  if (n < 12) return SATUAN[n]!
  if (n < 20) return `${eja(n - 10)} Belas`
  if (n < 100) return `${eja(Math.floor(n / 10))} Puluh ${eja(n % 10)}`.trim()
  if (n < 200) return `Seratus ${eja(n - 100)}`.trim()
  if (n < 1000) return `${eja(Math.floor(n / 100))} Ratus ${eja(n % 100)}`.trim()
  if (n < 2000) return `Seribu ${eja(n - 1000)}`.trim()
  if (n < 1e6) return `${eja(Math.floor(n / 1000))} Ribu ${eja(n % 1000)}`.trim()
  if (n < 1e9) return `${eja(Math.floor(n / 1e6))} Juta ${eja(n % 1e6)}`.trim()
  if (n < 1e12) return `${eja(Math.floor(n / 1e9))} Miliar ${eja(n % 1e9)}`.trim()
  return `${eja(Math.floor(n / 1e12))} Triliun ${eja(n % 1e12)}`.trim()
}

/** Ejaan angka bulat untuk kuitansi/berita acara; 0 ditulis "Nol". */
export function terbilang(n: number): string {
  const bulat = Math.floor(Math.abs(Number(n) || 0))
  return bulat === 0 ? 'Nol' : eja(bulat)
}

/** "Kamis tanggal Delapan bulan Januari tahun Dua Ribu Dua Puluh Enam (08-01-2026)" */
export function tglTerbilang(iso: string) {
  const d = parse(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${HARI[d.getDay()]} tanggal ${terbilang(d.getDate())} bulan ${BULAN[d.getMonth()]} tahun ${terbilang(d.getFullYear())} (${dd}-${mm}-${d.getFullYear()})`
}

export function rupiah(n: number) {
  return `Rp${(n || 0).toLocaleString('id-ID')}`
}

export function hariIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type SemesterAktif = 'ganjil' | 'genap'

/** Tahun ajaran & semester yang sedang berjalan: Juli–Desember = ganjil, Januari–Juni = genap. */
export function periodeSekarang(ref = new Date()): { ta: string, semester: SemesterAktif } {
  const y = ref.getFullYear()
  return ref.getMonth() >= 6
    ? { ta: `${y}/${y + 1}`, semester: 'ganjil' }
    : { ta: `${y - 1}/${y}`, semester: 'genap' }
}

export function tahunAjaranSekarang(ref = new Date()) {
  return periodeSekarang(ref).ta
}

/** Pilihan tahun ajaran: dua tahun ke belakang sampai satu tahun ke depan dari tahun ajaran berjalan. */
export function daftarTahunAjaran(ref = new Date(), tambahan: string[] = []): string[] {
  const awal = Number(tahunAjaranSekarang(ref).slice(0, 4))
  const list = [-2, -1, 0, 1].map(d => `${awal + d}/${awal + d + 1}`)
  for (const ta of tambahan) {
    if (/^\d{4}\/\d{4}$/.test(ta) && !list.includes(ta)) list.push(ta)
  }
  return list.sort()
}
