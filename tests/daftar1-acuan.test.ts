import { describe, expect, it } from 'vitest'
import {
  TAHUN_DAFTAR1,
  cloneDaftar1DefaultState,
  gabungGuruDaftar1,
  hitungMasaKerja,
  hitungRekapDaftar1,
  hitungUsiaSiswa,
  mergeDaftar1State,
  periodeBulanIni,
  tanggalAcuanDaftar1,
  tanggalLaporanDaftar1,
  tanggalTtdDaftar1,
  terapkanBulanIni,
} from '~/utils/daftar1'
import { profilAwal } from '~/utils/profil'

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

describe('usia siswa', () => {
  it('tepat per kalender di sekitar hari ulang tahun', () => {
    expect(hitungUsiaSiswa('2019-11-30', utc(2026, 11, 30))).toBe(7) // tepat ulang tahun ke-7
    expect(hitungUsiaSiswa('2019-12-01', utc(2026, 11, 30))).toBe(6) // ulang tahun besok
    expect(hitungUsiaSiswa('2019-11-15', utc(2026, 11, 30))).toBe(7)
  })

  it('tanggal lahir kosong/rusak → null', () => {
    expect(hitungUsiaSiswa('', utc(2026, 11, 30))).toBeNull()
  })
})

describe('masa kerja dari TMT', () => {
  it('dihitung sampai tanggal acuan', () => {
    expect(hitungMasaKerja('01-06-2014', utc(2026, 11, 30))).toEqual({ tahun: 12, bulan: 5 })
    expect(hitungMasaKerja('17-06-2014', utc(2025, 1, 31))).toEqual({ tahun: 10, bulan: 7 })
  })

  it('TMT setelah tanggal acuan → 0', () => {
    expect(hitungMasaKerja('01-01-2030', utc(2026, 11, 30))).toEqual({ tahun: 0, bulan: 0 })
  })
})

describe('bulan laporan & tanggal tanda tangan', () => {
  it('pilihan tahun 2020 sampai 2050', () => {
    expect(TAHUN_DAFTAR1[0]).toBe(2020)
    expect(TAHUN_DAFTAR1.at(-1)).toBe(2050)
    expect(TAHUN_DAFTAR1).toHaveLength(31)
  })

  it('tanggal tanda tangan = tanggal terakhir bulan yang dipilih', () => {
    expect(tanggalLaporanDaftar1({ bulan: 'Januari', tahun: 2025 })).toBe('31 Januari 2025')
    expect(tanggalLaporanDaftar1({ bulan: 'November', tahun: 2026 })).toBe('30 November 2026')
    expect(tanggalLaporanDaftar1({ bulan: 'Februari', tahun: 2028 })).toBe('29 Februari 2028') // kabisat
    expect(tanggalLaporanDaftar1({ bulan: 'Februari', tahun: 2050 })).toBe('28 Februari 2050')
    expect(tanggalTtdDaftar1({ desa: 'Sukamaju', kota: '' }, { bulan: 'Januari', tahun: 2025 })).toBe('Sukamaju, 31 Januari 2025')
  })

  it('setiap bulan dari 2020 sampai 2050 punya tanggal tanda tangan yang valid', () => {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] as const
    for (const tahun of TAHUN_DAFTAR1) {
      bulan.forEach((b, i) => {
        const akhir = new Date(Date.UTC(tahun, i + 1, 0)).getUTCDate()
        expect(tanggalLaporanDaftar1({ bulan: b, tahun })).toBe(`${akhir} ${b} ${tahun}`)
      })
    }
  })

  it('acuan usia & masa kerja = tanggal terakhir bulan laporan', () => {
    expect(tanggalAcuanDaftar1({ bulan: 'Januari', tahun: 2025 })).toEqual(utc(2025, 1, 31))
  })

  it('saat aplikasi dibuka, bulan laporan bawaan = bulan berjalan (juga untuk data lama/impor)', () => {
    const now = new Date(2026, 10, 16)
    expect(periodeBulanIni(now)).toEqual({ bulan: 'November', tahun: 2026, tahunPelajaran: '2026/2027' })
    const lama = terapkanBulanIni({ ...cloneDaftar1DefaultState(), bulan: 'Januari', tahun: 2026, tanggalLaporan: '31 Januari 2026' }, now)
    expect([lama.bulan, lama.tahun, lama.tanggalLaporan]).toEqual(['November', 2026, '30 November 2026'])
    const p = periodeBulanIni()
    expect([mergeDaftar1State({ bulan: 'Januari', tahun: 2026 }).bulan, cloneDaftar1DefaultState().bulan]).toEqual([p.bulan, p.bulan])
  })

  it('TMT yang diisi di Profil dipakai untuk masa kerja di Daftar 1', () => {
    const state = { ...cloneDaftar1DefaultState(), bulan: 'November' as const, tahun: 2026 }
    const profil = {
      ...profilAwal,
      gtk: [{ nama: 'Guru Satu, S.Pd.', nip: '1001', nuptk: '2001', jk: 'L' as const, jabatan: 'Guru Kelas', tmt: '2014-06-01', tmtSekolah: '2021-09-01' }],
    }
    const g = gabungGuruDaftar1(profil, state).rows[0]!
    expect([g.masaKerjaTahun, g.masaKerjaBulan]).toEqual([12, 5])
    expect(g.tmtDiangkat).toBe('01-06-2014')
    expect(g.tmtSekolahIni).toBe('01-09-2021')
  })

  it('data guru dari SPTJM tetap mengambil TMT dari Profil (dicocokkan lewat NIP)', () => {
    const state = { ...cloneDaftar1DefaultState(), bulan: 'Januari' as const, tahun: 2025 }
    const profil = {
      ...profilAwal,
      gtk: [{ nama: 'Guru Satu', nip: '1001', nuptk: '', jk: 'P' as const, jabatan: 'Guru Kelas', tmt: '2023-06-01' }],
      dapodik: { gtkDetail: [{ no: 1, nama: 'GURU SATU', jk: 'P', nik: '', nip: '1001', nuptk: '', jenis: 'Guru Kelas', status: 'PPPK', tglLahir: '', sekolahInduk: 'Ya' }], pesertaDidik: [] } as never,
    }
    const { sumber, rows } = gabungGuruDaftar1(profil, state)
    expect(sumber).toBe('sptjm')
    expect([rows[0]!.masaKerjaTahun, rows[0]!.masaKerjaBulan]).toEqual([1, 7]) // 1 Jun 2023 → 31 Jan 2025
  })

  it('usia siswa dan masa kerja di rekap mengikuti bulan yang dipilih', () => {
    const state = { ...cloneDaftar1DefaultState(), bulan: 'Januari' as const, tahun: 2025 }
    state.siswaLokal = [{ nama: 'SISWA CONTOH', jk: 'L', tglLahir: '2019-02-01', tingkat: '1', rombel: 'Kelas 1' }]
    state.guruMetaByKey = { 'NAMA GURU KELAS 1': { nama: 'Nama Guru Kelas 1, S.Pd.', tmtDiangkat: '01-06-2014' } as never }

    expect(hitungRekapDaftar1(profilAwal, state).siswa[0]!.usia).toBe(5) // 31 Jan 2025: belum ulang tahun ke-6

    const guru = gabungGuruDaftar1(profilAwal, state).rows.find(g => g.nama.startsWith('Nama Guru Kelas 1'))!
    expect([guru.masaKerjaTahun, guru.masaKerjaBulan]).toEqual([10, 7])
  })
})
