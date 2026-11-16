import { describe, expect, it } from 'vitest'
import type { Gtk, Profil } from '~/utils/profil'
import { profilAwal } from '~/utils/profil'
import { buildDocx } from '~/utils/docx'
import { unzipEntries } from '~/utils/xlsx/zip'
import {
  buildSkbmBlocks,
  hitungSkbm,
  kunciGtk,
  labelTugas,
  mergeSkbm,
  rentangKelas,
  skbmAwal,
  tebakTugas,
} from '~/utils/skbm'
import type { SkbmState } from '~/utils/skbm'
import {
  HARI,
  buildJadwalBlocks,
  cekBentrok,
  cekJumlahJam,
  kapasitasHarian,
  pengajarMapel,
  susunJadwal,
  waktuJam,
} from '~/utils/jadwal'

/** Sekolah fiktif: kepala sekolah, 6 guru kelas, guru PAI, guru PJOK. */
function sekolahContoh(): Profil {
  const g = (nama: string, nip: string, jabatan: string, pangkat = ''): Gtk => ({ nama, nip, nuptk: '', jk: 'L', jabatan, pangkat })
  return {
    ...profilAwal,
    npsn: '10000001',
    kepsek: 'Kepala Contoh, S.Pd.',
    nipKepsek: '100000000000000001',
    pengawas: 'Pengawas Contoh, M.Pd.',
    nipPengawas: '100000000000000099',
    pangkatPengawas: 'Pembina Tk. I, IV/b',
    gtk: [
      g('Kepala Contoh, S.Pd.', '100000000000000001', 'Kepala Sekolah', 'Penata Tk. I, III/d'),
      g('Guru Satu, S.Pd.', '100000000000000011', 'Guru Kelas 1', 'Guru Ahli Pertama / IX'),
      g('Guru Dua, S.Pd.', '100000000000000012', 'Guru Kelas 2'),
      g('Guru Tiga, S.Pd.', '100000000000000013', 'Guru Kelas III'),
      g('Guru Empat, S.Pd.', '100000000000000014', 'Guru Kelas 4'),
      g('Guru Lima, S.Pd.', '100000000000000015', 'Guru Kelas 5'),
      g('Guru Enam, S.Pd.', '100000000000000016', 'Guru Kelas 6'),
      g('Guru PAI, S.Pd.I.', '', 'Guru Agama Islam'),
      g('Guru PJOK, S.Pd.', '100000000000000018', 'Guru Penjasorkes'),
    ],
  }
}

function state(): SkbmState {
  return { ...skbmAwal(), nomor: '800/001/SD-01/2026', tanggal: '2026-07-13', tempat: 'Sukamaju', semester: 'ganjil', tahunAjaran: '2026/2027' }
}

describe('tugas guru', () => {
  const s = skbmAwal()
  it('ditebak dari jabatan di Profil', () => {
    const t = (jabatan: string) => tebakTugas({ nama: 'X', nip: '', nuptk: '', jk: 'L', jabatan }, { nipKepsek: '' }, s.strukturJam)
    expect(t('Kepala Sekolah').jenis).toBe('kepsek')
    expect(t('Guru Kelas 3')).toEqual({ jenis: 'kelas', kelas: '3' })
    expect(t('Guru Kelas VI')).toEqual({ jenis: 'kelas', kelas: '6' })
    expect(t('Guru Penjasorkes')).toEqual({ jenis: 'mapel', mapel: 'PJOK', kelasMapel: ['1', '2', '3', '4', '5', '6'] })
    expect(t('Guru Agama Islam').mapel).toBe('PAIBP')
    expect(t('Guru').jenis).toBe('lain')
  })

  it('label tugas mengajar', () => {
    expect(rentangKelas(['1', '2', '3', '4', '5', '6'])).toBe('I-VI')
    expect(rentangKelas(['1', '3'])).toBe('I, III')
    expect(labelTugas({ jenis: 'kelas', kelas: '4' })).toBe('Guru Kelas IV')
    expect(labelTugas({ jenis: 'mapel', mapel: 'PJOK', kelasMapel: ['1', '2', '3', '4', '5', '6'] })).toBe('Guru PJOK Kelas I-VI')
  })

  it('kunci guru: NIP, lalu NUPTK, lalu nama tanpa gelar', () => {
    expect(kunciGtk({ nama: 'A', nip: '1980 0101 2010 012001', nuptk: '' })).toBe('NIP:198001012010012001')
    expect(kunciGtk({ nama: 'Hj. Siti, S.Pd.', nip: '-', nuptk: '' })).toBe('NAMA:SITI')
  })
})

describe('pemetaan jam & siswa (Lampiran I–II)', () => {
  const profil = sekolahContoh()
  const hasil = hitungSkbm(profil, state())
  const cari = (nama: string) => hasil.baris.find(b => b.nama.startsWith(nama))!

  it('guru kelas = JJM kelas dikurangi jam guru mapel (PAIBP & PJOK)', () => {
    expect(cari('Guru Satu').jam['1']).toBe(32 - 8)
    expect(cari('Guru Dua').totalJam).toBe(34 - 8) // 26, sama seperti contoh SKKBM
    expect(cari('Guru Enam').totalJam).toBe(40 - 8) // 32
    expect(cari('Guru PJOK').jam).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 })
    expect(cari('Guru PJOK').totalJam).toBe(24)
    expect(cari('Guru PAI').totalJam).toBe(24)
    expect(hasil.kepsek?.totalJam).toBe(0)
    expect(hasil.peringatan).toEqual([])
  })

  it('kepala sekolah di urutan pertama', () => {
    expect(hasil.baris[0]!.jabatan).toBe('Kepala Sekolah')
    expect(hasil.baris[0]!.tugasLabel).toBe('Kepala Sekolah')
  })

  it('kelas tanpa guru kelas memunculkan peringatan', () => {
    const tanpaKelas1 = { ...profil, gtk: profil.gtk.filter(g => g.jabatan !== 'Guru Kelas 1') }
    const h = hitungSkbm(tanpaKelas1, state())
    expect(h.peringatan.some(p => p.startsWith('Kelas I:'))).toBe(true)
  })

  it('jumlah siswa per rombel dari isian manual, termasuk pramuka', () => {
    const st = { ...state(), siswaManual: { 1: { l: 12, p: 10 }, 2: { l: 6, p: 10 }, 3: { l: 13, p: 8 }, 4: { l: 10, p: 10 }, 5: { l: 6, p: 8 }, 6: { l: 8, p: 8 } } }
    const h = hitungSkbm(profil, st)
    expect(h.totalSiswa.total).toBe(109)
    expect(h.baris.find(b => b.nama.startsWith('Guru PJOK'))!.totalSiswa).toBe(109)
    expect(h.baris.find(b => b.nama.startsWith('Guru Empat'))!.siswa['4']).toBe(20)
    expect(h.pramuka).toEqual({ siagaPutra: 31, siagaPutri: 28, penggalangPutra: 24, penggalangPutri: 26 })
  })

  it('tugas yang diubah manual dipakai, bukan tebakan', () => {
    const st = state()
    st.tugas[kunciGtk(profil.gtk[1]!)] = { jenis: 'mapel', mapel: 'Bahasa Inggris', kelasMapel: ['3', '4', '5', '6'] }
    const h = hitungSkbm(profil, st)
    expect(h.baris.find(b => b.nama.startsWith('Guru Satu'))!.totalJam).toBe(8)
    expect(h.baris.find(b => b.nama.startsWith('Guru Enam'))!.totalJam).toBe(30)
  })

  it('data tersimpan lama tetap terbaca', () => {
    const m = mergeSkbm({ nomor: 'X', strukturJam: { 1: [{ mapel: 'Matematika', jjm: 5 }] } as never })
    expect(m.nomor).toBe('X')
    expect(m.strukturJam['1']).toEqual([{ mapel: 'Matematika', jjm: 5 }])
    expect(m.strukturJam['6'].length).toBeGreaterThan(0)
    expect(m.jadwal).toBeNull()
  })
})

describe('penyusun jadwal 5 hari', () => {
  const profil = sekolahContoh()
  const st = state()
  const hasil = hitungSkbm(profil, st)
  const { jadwal, gagal } = susunJadwal(st.strukturJam, hasil.baris, st.pengaturanJadwal)

  it('pembagian jam per hari serata mungkin, Jumat lebih pendek', () => {
    expect(kapasitasHarian(40, [9, 9, 9, 9, 6])).toEqual([9, 9, 8, 8, 6])
    expect(kapasitasHarian(32, [9, 9, 9, 9, 6])).toEqual([7, 7, 6, 6, 6])
  })

  it('semua jam tertempatkan dan sesuai JJM', () => {
    expect(gagal).toEqual([])
    expect(cekJumlahJam(jadwal, st.strukturJam)).toEqual([])
  })

  it('guru PAI dan PJOK tidak pernah mengajar dua kelas pada jam yang sama', () => {
    expect(cekBentrok(jadwal, hasil.baris)).toEqual([])
  })

  it('PAI & PJOK diletakkan sebagai blok berurutan dalam satu hari', () => {
    for (const t of ['1', '2', '3', '4', '5', '6'] as const) {
      for (const mapel of ['PAIBP', 'PJOK']) {
        const hari = jadwal[t].map(h => h.map((m, i) => (m === mapel ? i : -1)).filter(i => i >= 0)).filter(x => x.length)
        for (const slot of hari) expect(slot.at(-1)! - slot[0]! + 1).toBe(slot.length) // tidak terpotong
        expect(hari.flat().length).toBe(4)
      }
    }
  })

  it('bentrok terdeteksi bila jadwal diubah manual', () => {
    const salinan = structuredClone(jadwal)
    // Paksa PJOK kelas III dan kelas IV di jam yang sama.
    salinan['3'][0]![0] = 'PJOK'
    salinan['4'][0]![0] = 'PJOK'
    const b = cekBentrok(salinan, hasil.baris)
    expect(b.some(x => x.guru.startsWith('Guru PJOK') && x.hari === 0 && x.jam === 1)).toBe(true)
  })

  it('pengajar mapel: guru mapel dulu, lalu guru kelas', () => {
    expect(pengajarMapel(hasil.baris, '3', 'PJOK')!.nama).toMatch(/PJOK/)
    expect(pengajarMapel(hasil.baris, '3', 'Matematika')!.nama).toMatch(/Tiga/)
  })

  it('waktu jam pelajaran memperhitungkan istirahat', () => {
    expect(waktuJam(st.pengaturanJadwal, 1)).toEqual({ mulai: '07.00', selesai: '07.35' })
    expect(waktuJam(st.pengaturanJadwal, 5)).toEqual({ mulai: '09.50', selesai: '10.25' })
    expect(HARI).toHaveLength(5)
  })
})

describe('dokumen SK beban mengajar', () => {
  const profil = sekolahContoh()
  const st = state()
  const hasil = hitungSkbm(profil, st)
  const blocks = buildSkbmBlocks(profil, st, hasil)

  it('memuat SK, Lampiran I–IV, dan rujukan diktum yang benar', () => {
    const teks = JSON.stringify(blocks)
    for (const r of ['LAMPIRAN I ', 'LAMPIRAN II ', 'LAMPIRAN III ', 'LAMPIRAN IV ']) expect(teks).toContain(r)
    expect(teks).toContain('Lampiran III keputusan ini') // Kedua → bimbingan
    expect(teks).toContain('Lampiran IV keputusan ini') // Ketiga → kinerja
    expect(teks).toContain('SEMESTER I (SATU) TAHUN AJARAN 2026/2027')
    expect(teks).toContain('13 Juli 2026')
    expect(teks).not.toMatch(/\{sekolah\}|\{kabupaten\}|undefined|NaN/)
  })

  it('Lampiran I & II mendatar, Lampiran III & IV tegak', () => {
    expect(blocks.filter(b => b.t === 'halaman').map(b => (b as { orientasi: string }).orientasi)).toEqual(['landscape', 'landscape', 'portrait', 'portrait'])
  })

  it('file .docx terbentuk dengan section mendatar', async () => {
    const blob = await buildDocx(blocks, profil)
    const files = await unzipEntries(await blob.arrayBuffer())
    const xml = new TextDecoder().decode(files.get('word/document.xml')!)
    expect(xml).toContain('w:orient="landscape"')
    expect((xml.match(/<w:sectPr/g) ?? []).length).toBe(5)
    expect(xml).toContain('Jumlah Jam Mengajar per-Rombel')
  })

  it('dokumen jadwal pelajaran terbentuk', async () => {
    const { jadwal } = susunJadwal(st.strukturJam, hasil.baris, st.pengaturanJadwal)
    const jb = buildJadwalBlocks(profil, jadwal, st.pengaturanJadwal, hasil, st)
    expect(JSON.stringify(jb)).toContain('ISTIRAHAT')
    const blob = await buildDocx(jb, profil)
    expect((await blob.arrayBuffer()).byteLength).toBeGreaterThan(1000)
  })
})
