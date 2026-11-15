import { describe, expect, it } from 'vitest'
import { daftarTahunAjaran, periodeSekarang, rupiah, terbilang, tglPanjang, tglTerbilang } from '~/utils/tanggal'

describe('terbilang', () => {
  it.each([
    [0, 'Nol'],
    [1, 'Satu'],
    [11, 'Sebelas'],
    [15, 'Lima Belas'],
    [21, 'Dua Puluh Satu'],
    [100, 'Seratus'],
    [115, 'Seratus Lima Belas'],
    [1000, 'Seribu'],
    [1500000, 'Satu Juta Lima Ratus Ribu'],
    [3255000, 'Tiga Juta Dua Ratus Lima Puluh Lima Ribu'],
    [2026, 'Dua Ribu Dua Puluh Enam'],
  ])('%i → %s', (n, hasil) => {
    expect(terbilang(n)).toBe(hasil)
  })

  it('membulatkan ke bawah dan mengabaikan tanda minus', () => {
    expect(terbilang(12.9)).toBe('Dua Belas')
    expect(terbilang(-5)).toBe('Lima')
  })
})

describe('format tanggal', () => {
  it('menulis tanggal panjang dan terbilang', () => {
    expect(tglPanjang('2026-01-08')).toBe('8 Januari 2026')
    expect(tglTerbilang('2026-01-08')).toBe('Kamis tanggal Delapan bulan Januari tahun Dua Ribu Dua Puluh Enam (08-01-2026)')
  })

  it('memformat rupiah', () => {
    expect(rupiah(3200000)).toBe('Rp3.200.000')
  })
})

describe('periode berjalan', () => {
  it('Juli–Desember adalah semester ganjil tahun ajaran baru', () => {
    expect(periodeSekarang(new Date(2026, 6, 1))).toEqual({ ta: '2026/2027', semester: 'ganjil' })
    expect(periodeSekarang(new Date(2026, 10, 16))).toEqual({ ta: '2026/2027', semester: 'ganjil' })
  })

  it('Januari–Juni adalah semester genap', () => {
    expect(periodeSekarang(new Date(2027, 0, 5))).toEqual({ ta: '2026/2027', semester: 'genap' })
    expect(periodeSekarang(new Date(2027, 5, 30))).toEqual({ ta: '2026/2027', semester: 'genap' })
  })

  it('pilihan tahun ajaran mengikuti tanggal dan tetap memuat periode tersimpan', () => {
    expect(daftarTahunAjaran(new Date(2030, 8, 1))).toEqual(['2028/2029', '2029/2030', '2030/2031', '2031/2032'])
    expect(daftarTahunAjaran(new Date(2030, 8, 1), ['2020/2021'])).toContain('2020/2021')
    expect(daftarTahunAjaran(new Date(2030, 8, 1), ['ngawur'])).not.toContain('ngawur')
  })
})
