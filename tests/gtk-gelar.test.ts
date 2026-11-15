import { describe, expect, it } from 'vitest'
import { cariDokumen, nilaiAwal } from '~/data/templates'
import { cloneDaftar1DefaultState, gabungGuruDaftar1 } from '~/utils/daftar1'
import { namaBergelar, profilAwal } from '~/utils/profil'

describe('gelar ditulis di kolom nama', () => {
  it('mengenali nama yang sudah/belum bergelar', () => {
    expect(namaBergelar('Siti Aminah, S.Pd.')).toBe(true)
    expect(namaBergelar('Drs. Ahmad')).toBe(true)
    expect(namaBergelar('Hj. Siti Aminah')).toBe(true)
    expect(namaBergelar('Budi Santoso')).toBe(false)
    expect(namaBergelar('Irma Suryani')).toBe(false) // "Ir" di awal nama bukan gelar
    expect(namaBergelar('Drajat Santoso')).toBe(false)
  })

  const profil = {
    ...profilAwal,
    gtk: [{ nama: 'Hj. Guru Satu, S.Pd.SD.', nip: '1001', nuptk: '', jk: 'P' as const, jabatan: 'Guru Kelas' }],
  }

  it('nama bergelar dipakai apa adanya di daftar hadir rapat', () => {
    const dok = cariDokumen('rkas-daftar-hadir')!
    const teks = JSON.stringify(dok.build(profil, nilaiAwal(dok.fields, profil)))
    expect(teks).toContain('Hj. Guru Satu, S.Pd.SD.')
  })

  it('Daftar 1 memakai nama bergelar dari Profil walau data guru berasal dari SPTJM tanpa gelar', () => {
    const state = cloneDaftar1DefaultState()
    expect(gabungGuruDaftar1(profil, state).rows[0]!.nama).toBe('Hj. Guru Satu, S.Pd.SD.')

    const denganSptjm = {
      ...profil,
      dapodik: { gtkDetail: [{ no: 1, nama: 'GURU SATU', jk: 'P', nik: '', nip: '1001', nuptk: '', jenis: 'Guru Kelas', status: 'PPPK', tglLahir: '', sekolahInduk: 'Ya' }], pesertaDidik: [] } as never,
    }
    expect(gabungGuruDaftar1(denganSptjm, state).rows[0]!.nama).toBe('Hj. Guru Satu, S.Pd.SD.')
  })
})
