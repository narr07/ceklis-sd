import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DAFTAR1_DEFAULT_BB_TB, DAFTAR1_DEFAULT_GURUS, DAFTAR1_DEFAULT_SISWA } from '~/data/daftar1Default'
import { cloneDaftar1DefaultState, gabungGuruDaftar1, hitungRekapDaftar1 } from '~/utils/daftar1'
import { profilAwal, profilMasihContoh } from '~/utils/profil'

/**
 * Penjaga privasi: kode yang di-commit tidak boleh membawa data pribadi sungguhan.
 * NIP (18 digit), NIK/NUPTK (16 digit) tidak boleh muncul di data bawaan.
 */
const FILE_DATA = ['app/utils/profil.ts', 'app/data/daftar1Default.ts', 'app/data/templates.ts', 'app/data/checklists.ts']
const baca = (rel: string) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8')

describe('data bawaan bebas data pribadi', () => {
  it.each(FILE_DATA)('%s tidak memuat angka mirip NIP/NIK/NUPTK', (rel) => {
    expect(baca(rel)).not.toMatch(/\b\d{16,18}\b/)
  })

  it('daftar siswa, berat/tinggi badan, dan biodata GTK bawaan kosong', () => {
    expect(DAFTAR1_DEFAULT_SISWA).toEqual([])
    expect(DAFTAR1_DEFAULT_GURUS).toEqual([])
    expect(DAFTAR1_DEFAULT_BB_TB).toEqual({})
  })

  it('profil bawaan ditandai sebagai contoh dan tanpa NIP/NUPTK', () => {
    expect(profilMasihContoh(profilAwal)).toBe(true)
    expect(profilAwal.gtk.every(g => !g.nip && !g.nuptk)).toBe(true)
  })
})

describe('Daftar 1 tanpa SPTJM', () => {
  it('daftar GTK diambil dari Profil dan biodata tambahan dari guruMetaByKey', () => {
    const state = cloneDaftar1DefaultState()
    state.guruMetaByKey = {
      'NAMA GURU KELAS 1': { nama: 'Nama Guru Kelas 1, S.Pd.', golongan: 'III/a', tmtSekolahIni: '01-07-2020' } as never,
    }
    const { sumber, rows } = gabungGuruDaftar1(profilAwal, state)
    expect(sumber).toBe('profil-awal')
    expect(rows).toHaveLength(profilAwal.gtk.length)
    expect(rows.find(r => r.nama.startsWith('Nama Guru Kelas 1'))?.golongan).toBe('III/a')
  })

  it('rekap tetap bisa dihitung dengan data siswa kosong', () => {
    const rekap = hitungRekapDaftar1(profilAwal, cloneDaftar1DefaultState())
    expect(rekap.siswa).toEqual([])
    expect(rekap.guru.length).toBe(profilAwal.gtk.length)
  })
})
