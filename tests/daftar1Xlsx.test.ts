import { describe, expect, it } from 'vitest'
import { cloneDaftar1DefaultState } from '~/utils/daftar1'
import { buildDaftar1Xlsx, parseDaftar1Xlsx } from '~/utils/daftar1Xlsx'
import { profilAwal } from '~/utils/profil'

describe('Excel Daftar 1', () => {
  it('ekspor lalu impor ulang mempertahankan siswa, BB/TB, dan jumlahnya', async () => {
    const state = cloneDaftar1DefaultState()
    state.siswaLokal = [
      { nama: 'SISWA CONTOH SATU', jk: 'L', tglLahir: '2019-03-14', tingkat: '1', rombel: 'Kelas 1' },
      { nama: 'SISWA CONTOH DUA', jk: 'P', tglLahir: '2016-08-22', tingkat: '4', rombel: 'Kelas 4' },
    ]
    state.bbTbByKey = { 'SISWA CONTOH SATU': { bb: 21, tb: 118 } }

    const bytes = buildDaftar1Xlsx(profilAwal, state)
    expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe('PK')

    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const hasil = await parseDaftar1Xlsx(buffer)
    expect(hasil.jumlahSiswa).toBe(2)
    expect(hasil.patch.siswaLokal?.map(s => s.nama).sort()).toEqual(['SISWA CONTOH DUA', 'SISWA CONTOH SATU'])
    expect(hasil.patch.bbTbByKey?.['SISWA CONTOH SATU']).toEqual({ bb: 21, tb: 118 })
  })
})
