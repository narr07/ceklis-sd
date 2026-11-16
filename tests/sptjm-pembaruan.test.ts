import { describe, expect, it } from 'vitest'
import type { DataDapodikSptjm, SptjmGtk, SptjmPesertaDidik } from '~/utils/sptjm'
import { cloneDaftar1DefaultState } from '~/utils/daftar1'
import { bandingkanSptjm, bersihkanDaftar1SiswaKeluar } from '~/utils/sptjmPerubahan'

// Data fiktif: NISN contoh 99000000xx, tanpa NIK/NIP asli.
const siswa = (no: number, nama: string, tingkat: number, rombel = `Kelas ${tingkat}`): SptjmPesertaDidik => ({
  no,
  nama,
  jk: no % 2 ? 'L' : 'P',
  tglLahir: `2018-01-${String(no).padStart(2, '0')}`,
  namaIbu: 'Ibu Contoh',
  nik: '',
  nisn: `99000000${String(no).padStart(2, '0')}`,
  tingkat: `Kelas ${tingkat}`,
  rombel,
})

const gtk = (nama: string, nuptk: string): SptjmGtk => ({
  no: 1, nama, jk: 'P', nik: '', nip: '', nuptk, jenis: 'Guru Kelas', status: 'Honor', tglLahir: '', sekolahInduk: 'Ya',
})

const dapodik = (tanggal: string, pd: SptjmPesertaDidik[], guru: SptjmGtk[]): DataDapodikSptjm => ({
  tanggalSptjm: tanggal,
  importedAt: '',
  bentukPendidikan: 'SD',
  statusSekolah: 'Negeri',
  statusKepemilikan: '',
  skIzinOperasional: '',
  tanggalSkIzin: '',
  rt: '',
  rw: '',
  dusun: '',
  propinsi: '',
  lintang: '',
  bujur: '',
  layananKhusus: '',
  skPendirian: '',
  tanggalSkPendirian: '',
  rekeningBos: '',
  namaBank: '',
  namaKcp: '',
  atasNamaRekening: '',
  mbs: '',
  telepon: '',
  sarpras: [],
  gtkDetail: guru,
  rombel: [],
  pesertaDidik: pd,
})

describe('pembaruan SPTJM tahun ajaran baru', () => {
  const lama = dapodik('15-01-2026', [
    siswa(1, 'Andi Contoh', 1),
    siswa(2, 'Budi Contoh', 5),
    siswa(3, 'Citra Contoh', 6),
    siswa(4, 'Dewi Contoh', 6),
    siswa(5, 'Eka Contoh', 3, 'Kelas 3A'),
  ], [gtk('Guru Lama', '1111'), gtk('Guru Tetap', '2222')])

  const baru = dapodik('20-07-2026', [
    { ...siswa(1, 'Andi Contoh', 2) },
    { ...siswa(2, 'Budi Contoh', 6) },
    { ...siswa(5, 'Eka Contoh', 3, 'Kelas 3B') },
    siswa(11, 'Fajar Baru', 1),
    siswa(12, 'Gita Baru', 1),
  ], [gtk('Guru Tetap', '2222'), gtk('Guru Baru', '3333')])

  it('mengenali siswa lulus, siswa baru kelas 1, naik kelas, dan pindah rombel', () => {
    const r = bandingkanSptjm(lama, baru)
    expect(r.siswaKeluar.map(s => s.nama)).toEqual(['Citra Contoh', 'Dewi Contoh'])
    expect(r.siswaKeluar.every(s => s.lulus)).toBe(true)
    expect(r.siswaMasuk.map(s => s.nama)).toEqual(['Fajar Baru', 'Gita Baru'])
    expect(r.masukPerTingkat).toEqual({ 1: 2 })
    expect(r.naikKelas.map(s => `${s.nama}: ${s.dari} → ${s.ke}`)).toEqual([
      'Andi Contoh: Kelas 1 → Kelas 2',
      'Budi Contoh: Kelas 5 → Kelas 6',
    ])
    expect(r.pindahRombel).toEqual([{ nama: 'Eka Contoh', dari: 'Kelas 3A', ke: 'Kelas 3B' }])
    expect(r.siswaTetap).toBe(0)
    expect(r.gtkMasuk.map(g => g.nama)).toEqual(['Guru Baru'])
    expect(r.gtkKeluar.map(g => g.nama)).toEqual(['Guru Lama'])
    expect(r.baruLebihLama).toBe(false)
  })

  it('memperingatkan bila SPTJM baru bertanggal lebih lama', () => {
    expect(bandingkanSptjm(baru, lama).baruLebihLama).toBe(true)
  })

  it('membersihkan BB/TB siswa yang keluar tanpa menyentuh siswa aktif bernama sama', () => {
    const state = cloneDaftar1DefaultState()
    state.bbTbByKey = {
      'NISN:9900000003': { bb: 40, tb: 140 },
      'DEWI CONTOH': { bb: 38, tb: 138 },
      'NISN:9900000001': { bb: 20, tb: 115 },
    }
    state.agamaByKey = { 'NISN:9900000003': 'islam' }
    // Siswa baru kebetulan bernama sama dengan siswa yang lulus.
    const aktif = [...baru.pesertaDidik, { ...siswa(13, 'Dewi Contoh', 1) }]
    const r = bandingkanSptjm(lama, { ...baru, pesertaDidik: aktif })

    const dihapus = bersihkanDaftar1SiswaKeluar(state, r.siswaKeluar, aktif)
    expect(dihapus).toBe(2)
    expect(Object.keys(state.bbTbByKey).sort()).toEqual(['DEWI CONTOH', 'NISN:9900000001'])
    expect(state.agamaByKey).toEqual({})
  })
})
