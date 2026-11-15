// Penyusun tiap sheet Excel Daftar 1 (siswa, guru, usia, BB/TB, absen).
import {
  BULAN_TAHUN_AJARAN,
  ROMAWI_MAP,
  TINGKAT_LIST,
  formatTtlDaftar1,
  hitungRekapDaftar1,
  labelAcuanDaftar1,
  tanggalTtdDaftar1,
} from '../daftar1'
import type {
  Daftar1State,
} from '../daftar1'
import type { Profil } from '../profil'
import { colLetter, rowBuilder } from './sheet'
import type { SheetSpec } from './sheet'

export function buildSiswaSheet(profil: Profil, state: Daftar1State): SheetSpec {
  const rekap = hitungRekapDaftar1(profil, state)
  const rb = rowBuilder()
  const merges: string[] = []

  rb.set(1, 1, 'LAPORAN BULANAN SEKOLAH DASAR (DAFTAR 1)', 2)
  merges.push('A1:AD1')
  rb.set(2, 1, `Tahun Pelajaran: ${state.tahunPelajaran}   |   Bulan: ${state.bulan} ${state.tahun}   |   Acuan Usia & Masa Kerja: ${labelAcuanDaftar1(state)}`, 1)
  merges.push('A2:AD2')

  // Identitas sekolah (kolom A..S)
  rb.set(4, 1, 'Sekolah Dasar', 1)
  rb.set(4, 3, `: ${profil.sekolah}`, 9)
  rb.set(5, 1, 'Tahun Pendirian', 1)
  rb.set(5, 3, `: ${state.sarpras.tahunPendirian}`, 1)
  rb.set(6, 1, 'NSS / NPSN', 1)
  rb.set(6, 3, `: ${state.sarpras.nss || '-'} / ${profil.npsn}`, 1)
  rb.set(7, 1, 'Status / Kategori', 1)
  rb.set(7, 3, `: ${state.sarpras.statusKepemilikanSekolah} | ${state.sarpras.kategoriWilayahSekolah}`, 1)

  rb.set(4, 8, 'Alamat', 1)
  rb.set(4, 10, `: ${profil.alamat}`, 1)
  rb.set(5, 8, 'Desa / Kecamatan', 1)
  rb.set(5, 10, `: ${profil.desa}, Kec. ${profil.kecamatan}`, 1)
  rb.set(6, 8, 'Kabupaten / Provinsi', 1)
  rb.set(6, 10, `: ${profil.kabupaten}, ${profil.dapodik?.propinsi || 'Jawa Barat'}`, 1)
  rb.set(7, 8, 'Kategori Desa', 1)
  rb.set(7, 10, `: ${state.sarpras.kategoriDesa}`, 1)

  // Bagian kiri: Banyaknya Murid (kolom 1..17)
  // Kolom: A..B Label | C-D Kls I (L,P) | E-F II | G-H III | I-J IV | K-L V | M-N VI | O-P Jml (L,P) | Q Total
  rb.set(9, 1, 'BANYAKNYA MURID', 3)
  merges.push('A9:B10')
  TINGKAT_LIST.forEach((t, idx) => {
    const c = 3 + idx * 2
    rb.set(9, c, ROMAWI_MAP[t], 3)
    merges.push(`${colLetter(c)}9:${colLetter(c + 1)}9`)
    rb.set(10, c, 'L', 3)
    rb.set(10, c + 1, 'P', 3)
  })
  rb.set(9, 15, 'Jumlah', 3)
  merges.push('O9:P9')
  rb.set(10, 15, 'L', 3)
  rb.set(10, 16, 'P', 3)
  rb.set(9, 17, 'Total', 3)
  merges.push('Q9:Q10')
  rb.styleRange(9, 1, 10, 17, 3)

  const murRows: Array<{ label: string, row: number, pick: (r: typeof rekap.perKelas['1']) => [number, number] }> = [
    { label: 'Jumlah Bulan Lalu', row: 11, pick: r => [r.bulanLaluL, r.bulanLaluP] },
    { label: 'Keluar Dalam Bulan Ini', row: 12, pick: r => [r.keluarL, r.keluarP] },
    { label: 'Masuk Dalam Bulan Ini', row: 13, pick: r => [r.masukL, r.masukP] },
    { label: 'Jumlah Penghabisan', row: 14, pick: r => [r.penghabisanL, r.penghabisanP] },
  ]
  for (const mr of murRows) {
    rb.set(mr.row, 1, mr.label, 4)
    merges.push(`A${mr.row}:B${mr.row}`)
    rb.set(mr.row, 2, null, 4)
    let rowL = 0
    let rowP = 0
    TINGKAT_LIST.forEach((t, idx) => {
      const c = 3 + idx * 2
      const [vl, vp] = mr.pick(rekap.perKelas[t])
      rowL += vl
      rowP += vp
      rb.set(mr.row, c, vl, 5)
      rb.set(mr.row, c + 1, vp, 5)
    })
    rb.set(mr.row, 15, rowL, 7)
    rb.set(mr.row, 16, rowP, 7)
    rb.set(mr.row, 17, rowL + rowP, 7)
  }

  rb.set(15, 1, 'Jumlah Bulan Ini', 8)
  merges.push('A15:B15')
  rb.set(15, 2, null, 8)
  TINGKAT_LIST.forEach((t, idx) => {
    const c = 3 + idx * 2
    rb.set(15, c, rekap.perKelas[t].total, 7)
    merges.push(`${colLetter(c)}15:${colLetter(c + 1)}15`)
    rb.set(15, c + 1, null, 7)
  })
  rb.set(15, 15, rekap.totalKelas.total, 7)
  merges.push('O15:Q15')
  rb.set(15, 16, null, 7)
  rb.set(15, 17, null, 7)

  // Tabel 2: Menurut Umur (rows 17..29)
  rb.set(17, 1, 'BANYAKNYA MURID MENURUT UMUR', 3)
  merges.push('A17:B18')
  TINGKAT_LIST.forEach((t, idx) => {
    const c = 3 + idx * 2
    rb.set(17, c, ROMAWI_MAP[t], 3)
    merges.push(`${colLetter(c)}17:${colLetter(c + 1)}17`)
    rb.set(18, c, 'L', 3)
    rb.set(18, c + 1, 'P', 3)
  })
  rb.set(17, 15, 'Jumlah', 3)
  merges.push('O17:P17')
  rb.set(18, 15, 'L', 3)
  rb.set(18, 16, 'P', 3)
  rb.set(17, 17, 'Total', 3)
  merges.push('Q17:Q18')
  rb.styleRange(17, 1, 18, 17, 3)

  rekap.umurRows.forEach((ur, idx) => {
    const r = 19 + idx
    rb.set(r, 1, `${ur.umur} tahun`, 4)
    merges.push(`A${r}:B${r}`)
    rb.set(r, 2, null, 4)
    TINGKAT_LIST.forEach((t, ci) => {
      const c = 3 + ci * 2
      rb.set(r, c, ur.perKelas[t].l, 5)
      rb.set(r, c + 1, ur.perKelas[t].p, 5)
    })
    rb.set(r, 15, ur.totalL, 7)
    rb.set(r, 16, ur.totalP, 7)
    rb.set(r, 17, ur.total, 7)
  })

  rb.set(29, 1, 'Jumlah (L / P)', 8)
  merges.push('A29:B29')
  rb.set(29, 2, null, 8)
  TINGKAT_LIST.forEach((t, idx) => {
    const c = 3 + idx * 2
    rb.set(29, c, rekap.umurJumlahPerKelas[t].l, 7)
    rb.set(29, c + 1, rekap.umurJumlahPerKelas[t].p, 7)
  })
  rb.set(29, 15, rekap.umurGrandTotal.l, 7)
  rb.set(29, 16, rekap.umurGrandTotal.p, 7)
  rb.set(29, 17, rekap.umurGrandTotal.total, 7)

  rb.set(30, 1, 'Jumlah Total', 8)
  merges.push('A30:B30')
  rb.set(30, 2, null, 8)
  TINGKAT_LIST.forEach((t, idx) => {
    const c = 3 + idx * 2
    rb.set(30, c, rekap.umurJumlahPerKelas[t].total, 7)
    merges.push(`${colLetter(c)}30:${colLetter(c + 1)}30`)
    rb.set(30, c + 1, null, 7)
  })
  rb.set(30, 15, rekap.umurGrandTotal.total, 7)
  merges.push('O30:Q30')
  rb.set(30, 16, null, 7)
  rb.set(30, 17, null, 7)

  // Tabel 3: Menurut Agama (rows 32..39)
  rb.set(32, 1, 'BANYAKNYA MURID MENURUT AGAMA', 3)
  merges.push('A32:B33')
  const agLabels = [
    { key: 'islam' as const, label: 'Islam' },
    { key: 'katolik' as const, label: 'Katolik' },
    { key: 'protestan' as const, label: 'Protestan' },
    { key: 'hindu' as const, label: 'Hindu' },
    { key: 'budha' as const, label: 'Budha' },
  ]
  agLabels.forEach((ag, idx) => {
    const c = 3 + idx * 2
    rb.set(32, c, ag.label, 3)
    merges.push(`${colLetter(c)}32:${colLetter(c + 1)}32`)
    rb.set(33, c, 'L', 3)
    rb.set(33, c + 1, 'P', 3)
  })
  rb.set(32, 13, 'Jumlah', 3)
  merges.push('M32:N32')
  rb.set(33, 13, 'L', 3)
  rb.set(33, 14, 'P', 3)
  rb.set(32, 15, 'Jumlah Semua', 3)
  merges.push('O32:Q33')
  rb.styleRange(32, 1, 33, 17, 3)

  const agRows: Array<{ label: string, row: number, pick: (r: typeof rekap.perAgama['islam']) => [number, number] }> = [
    { label: 'Jumlah Bulan Lalu', row: 34, pick: r => [r.bulanLaluL, r.bulanLaluP] },
    { label: 'Keluar Dalam Bulan Ini', row: 35, pick: r => [r.keluarL, r.keluarP] },
    { label: 'Masuk Dalam Bulan Ini', row: 36, pick: r => [r.masukL, r.masukP] },
    { label: 'Jumlah Penghabisan', row: 37, pick: r => [r.penghabisanL, r.penghabisanP] },
  ]
  for (const ar of agRows) {
    rb.set(ar.row, 1, ar.label, 4)
    merges.push(`A${ar.row}:B${ar.row}`)
    rb.set(ar.row, 2, null, 4)
    let totL = 0
    let totP = 0
    agLabels.forEach((ag, idx) => {
      const c = 3 + idx * 2
      const [vl, vp] = ar.pick(rekap.perAgama[ag.key])
      totL += vl
      totP += vp
      rb.set(ar.row, c, vl, 5)
      rb.set(ar.row, c + 1, vp, 5)
    })
    rb.set(ar.row, 13, totL, 7)
    rb.set(ar.row, 14, totP, 7)
    rb.set(ar.row, 15, totL + totP, 7)
    merges.push(`O${ar.row}:Q${ar.row}`)
    rb.set(ar.row, 16, null, 7)
    rb.set(ar.row, 17, null, 7)
  }

  // Bagian kanan: A..I Sarpras, Jumlah Guru, Hari Efektif, Absensi (kolom 19..30 = S..AD)
  // Tanah A
  rb.set(4, 19, 'A. TANAH', 3)
  merges.push('S4:U4')
  rb.set(4, 22, 'Luas (m²)', 3)
  merges.push('V4:W4')
  rb.set(4, 24, 'No. Persil', 3)
  merges.push('X4:Y4')
  rb.set(4, 26, 'Tahun', 3)
  merges.push('Z4:AA4')
  rb.set(4, 28, 'Harga Rp.', 3)
  merges.push('AB4:AD4')
  rb.styleRange(4, 19, 4, 30, 3)

  rb.set(5, 19, 'Status Milik', 4)
  merges.push('S5:U5')
  rb.set(5, 22, state.sarpras.tanahLuasM2, 5)
  merges.push('V5:W5')
  rb.set(5, 24, state.sarpras.tanahNoPersil || '-', 5)
  merges.push('X5:Y5')
  rb.set(5, 26, state.sarpras.tanahTahun || '-', 5)
  merges.push('Z5:AA5')
  rb.set(5, 28, state.sarpras.tanahHarga, 6)
  merges.push('AB5:AD5')
  rb.styleRange(5, 19, 5, 30, 5)

  // Bangunan B
  rb.set(7, 19, 'B. BANGUNAN / RUANGAN', 3)
  merges.push('S7:U8')
  rb.set(7, 22, 'Baik', 3)
  merges.push('V7:W7')
  rb.set(7, 24, 'Sedang', 3)
  merges.push('X7:Y7')
  rb.set(7, 26, 'Rusak', 3)
  merges.push('Z7:AA7')
  rb.set(7, 28, 'Jumlah', 3)
  merges.push('AB7:AD7')
  rb.set(8, 22, 'Bgn', 3)
  rb.set(8, 23, 'Rgn', 3)
  rb.set(8, 24, 'Bgn', 3)
  rb.set(8, 25, 'Rgn', 3)
  rb.set(8, 26, 'Bgn', 3)
  rb.set(8, 27, 'Rgn', 3)
  rb.set(8, 28, 'Bgn', 3)
  rb.set(8, 29, 'Rgn', 3)
  merges.push('AC8:AD8')
  rb.styleRange(7, 19, 8, 30, 3)

  rb.set(9, 19, 'Kondisi Gedung', 4)
  merges.push('S9:U9')
  rb.set(9, 22, state.sarpras.bangunanBaik.bgn, 5)
  rb.set(9, 23, state.sarpras.bangunanBaik.rgn, 5)
  rb.set(9, 24, state.sarpras.bangunanSedang.bgn, 5)
  rb.set(9, 25, state.sarpras.bangunanSedang.rgn, 5)
  rb.set(9, 26, state.sarpras.bangunanRusak.bgn, 5)
  rb.set(9, 27, state.sarpras.bangunanRusak.rgn, 5)
  rb.set(9, 28, rekap.bangunanJumlah.bgn, 7)
  rb.set(9, 29, rekap.bangunanJumlah.rgn, 7)
  merges.push('AC9:AD9')
  rb.styleRange(9, 19, 9, 30, 5)

  // Menyewa C
  rb.set(11, 19, `C. MENYEWA Rp ${state.sarpras.menyewaRp} / MENUMPANG DI ${state.sarpras.menumpangDi || '-'}`, 9)
  merges.push('S11:AD11')

  // Jenis Bangunan D
  rb.set(12, 19, 'D. JENIS / SIFAT BANGUNAN', 3)
  merges.push('S12:U12')
  rb.set(12, 22, 'P', 3)
  rb.set(12, 23, 'SP', 3)
  rb.set(12, 24, 'Dr', 3)
  rb.set(12, 25, 'Thn P', 3)
  rb.set(12, 26, 'Thn SP', 3)
  rb.set(12, 27, 'Thn Dr', 3)
  rb.set(12, 28, 'Harga Rp.', 3)
  merges.push('AB12:AD12')
  rb.styleRange(12, 19, 12, 30, 3)

  state.sarpras.jenisBangunan.forEach((jb, idx) => {
    const r = 13 + idx
    rb.set(r, 19, jb.nama, 4)
    merges.push(`S${r}:U${r}`)
    rb.set(r, 22, jb.permanen || '-', 5)
    rb.set(r, 23, jb.semi || '-', 5)
    rb.set(r, 24, jb.darurat || '-', 5)
    rb.set(r, 25, jb.tahunP || '-', 5)
    rb.set(r, 26, jb.tahunSp || '-', 5)
    rb.set(r, 27, jb.tahunDr || '-', 5)
    rb.set(r, 28, jb.hargaRp || '-', 6)
    merges.push(`AB${r}:AD${r}`)
    rb.styleRange(r, 19, r, 30, 5)
  })

  // Air Bersih E
  rb.set(19, 19, 'E. PERKAKAS AIR BERSIH', 4)
  merges.push('S19:V19')
  rb.set(19, 23, state.sarpras.airBersih || '-', 4)
  merges.push('W19:AD19')
  rb.styleRange(19, 19, 19, 30, 4)

  // Mebeler F
  rb.set(21, 19, 'F. PERKAKAS / MEBELER', 3)
  merges.push('S21:V21')
  rb.set(21, 23, 'Baik', 3)
  merges.push('W21:X21')
  rb.set(21, 25, 'Sedang', 3)
  merges.push('Y21:Z21')
  rb.set(21, 27, 'Rusak', 3)
  merges.push('AA21:AB21')
  rb.set(21, 29, 'Jumlah', 3)
  merges.push('AC21:AD21')
  rb.styleRange(21, 19, 21, 30, 3)

  rekap.mebelerTotal.forEach((m, idx) => {
    const r = 22 + idx
    rb.set(r, 19, m.nama, 4)
    merges.push(`S${r}:V${r}`)
    rb.set(r, 23, m.baik, 5)
    merges.push(`W${r}:X${r}`)
    rb.set(r, 25, m.sedang, 5)
    merges.push(`Y${r}:Z${r}`)
    rb.set(r, 27, m.rusak, 5)
    merges.push(`AA${r}:AB${r}`)
    rb.set(r, 29, m.jumlah, 7)
    merges.push(`AC${r}:AD${r}`)
    rb.styleRange(r, 19, r, 30, 5)
  })

  // Jumlah Guru G
  rb.set(32, 19, 'G. JUMLAH GURU', 3)
  merges.push('S32:U32')
  const guruCols = [
    { label: 'Kepsek', col: 22, span: 1, val: rekap.jumlahGuru.kepalaSekolah },
    { label: 'Gr Kelas', col: 23, span: 2, val: rekap.jumlahGuru.guruKelas },
    { label: 'PAI', col: 25, span: 1, val: rekap.jumlahGuru.guruAgama },
    { label: 'PJOK', col: 26, span: 1, val: rekap.jumlahGuru.guruPenjas },
    { label: 'TKS/PW', col: 27, span: 2, val: rekap.jumlahGuru.guruKelasTks },
    { label: 'Tendik', col: 29, span: 1, val: rekap.jumlahGuru.tendik },
    { label: 'Jml', col: 30, span: 1, val: rekap.jumlahGuru.jumlah },
  ]
  for (const gc of guruCols) {
    rb.set(32, gc.col, gc.label, 3)
    rb.set(33, gc.col, gc.val, gc.label === 'Jml' ? 7 : 5)
    if (gc.span === 2) {
      merges.push(`${colLetter(gc.col)}32:${colLetter(gc.col + 1)}32`)
      merges.push(`${colLetter(gc.col)}33:${colLetter(gc.col + 1)}33`)
    }
  }
  rb.set(33, 19, 'Aktif Bulan Ini', 4)
  merges.push('S33:U33')
  rb.styleRange(32, 19, 33, 30, 5)

  // Hari Efektif H
  rb.set(35, 19, 'H. HARI EFEKTIF', 3)
  merges.push('S35:V35')
  rb.set(35, 23, `${rekap.hariEfektifBulanIni} Hari`, 7)
  merges.push('W35:AD35')
  rb.styleRange(35, 19, 35, 30, 5)

  // Absensi I
  rb.set(37, 19, 'I. ABSENSI MURID', 3)
  merges.push('S37:V37')
  rb.set(37, 23, 'Presentase Kehadiran', 3)
  merges.push('W37:Z37')
  rb.set(37, 27, 'Sakit / Ijin / Lain', 3)
  merges.push('AA37:AD37')
  rb.styleRange(37, 19, 37, 30, 3)

  rb.set(38, 19, 'Rata-rata Hadir', 4)
  merges.push('S38:V38')
  rb.set(38, 23, `${rekap.absensi.rataHadir} Orang (${rekap.absensi.persenHadir.toFixed(2)}%)`, 5)
  merges.push('W38:Z38')
  rb.set(38, 27, `S: ${rekap.absensi.sakit}  I: ${rekap.absensi.ijin}  L: ${rekap.absensi.lainLain}`, 5)
  merges.push('AA38:AD38')
  rb.styleRange(38, 19, 38, 30, 5)

  // TTD Kepsek
  rb.set(41, 22, tanggalTtdDaftar1(profil, state), 1)
  merges.push('V41:AD41')
  rb.set(42, 22, `Kepala ${profil.sekolah}`, 1)
  merges.push('V42:AD42')
  rb.set(46, 22, profil.kepsek, 9)
  merges.push('V46:AD46')
  rb.set(47, 22, `NIP ${profil.nipKepsek}`, 1)
  merges.push('V47:AD47')

  return {
    name: 'Siswa',
    rows: rb.rows(),
    merges,
    colWidths: [14, 14, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 7, 3, 10, 10, 10, 7, 7, 7, 7, 7, 7, 8, 8, 8],
    landscape: true,
  }
}

export function buildGuruSheet(profil: Profil, state: Daftar1State): SheetSpec {
  const rekap = hitungRekapDaftar1(profil, state)
  const rb = rowBuilder()
  const merges: string[] = []

  rb.set(1, 1, `DAFTAR KEADAAN GURU - ${profil.sekolah}`, 2)
  merges.push('A1:S1')
  rb.set(2, 1, `Bulan: ${state.bulan} ${state.tahun}   |   Tahun Pelajaran: ${state.tahunPelajaran}`, 1)
  merges.push('A2:S2')

  const headers = [
    'No',
    'Nama / TTL',
    'NIP / NUPTK',
    'L/P',
    'Agama',
    'Kawin / TK',
    'Anak < 18 Thn',
    'Ijazah & Tahun',
    'Jabatan',
    'Masa Kerja',
    'TMT Diangkat / Sekolah Ini',
    'Mengajar Kelas',
    'Tanggal & No. SK Terakhir',
    'Golongan / Ruang',
    'Gaji Pokok Rp.',
    'S',
    'I',
    'L',
    'Keterangan',
  ]
  for (let i = 0; i < headers.length; i++) {
    const c = i + 1
    if (c === 16) {
      rb.set(4, 16, 'Absen Guru', 3)
      merges.push('P4:R4')
      rb.set(5, 16, 'S', 3)
      rb.set(5, 17, 'I', 3)
      rb.set(5, 18, 'L', 3)
    }
    else if (c < 16 || c > 18) {
      rb.set(4, c, headers[i] || '', 3)
      merges.push(`${colLetter(c)}4:${colLetter(c)}5`)
    }
    rb.set(6, c, c, 3)
  }
  rb.styleRange(4, 1, 6, 19, 3)

  let r = 7
  for (const g of rekap.guru) {
    const r2 = r + 1
    rb.set(r, 1, g.no, 5)
    rb.set(r, 2, g.nama, 4)
    rb.set(r2, 2, formatTtlDaftar1(g.tempatLahir, g.tglLahir), 4)
    rb.set(r, 3, g.nip !== '-' ? g.nip : g.nuptk, 5)
    rb.set(r2, 3, g.nip !== '-' && g.nuptk !== '-' ? `NUPTK: ${g.nuptk}` : '', 5)
    rb.set(r, 4, g.jk, 5)
    rb.set(r, 5, g.agama, 5)
    rb.set(r, 6, g.kawin, 5)
    rb.set(r, 7, g.anakDibawah18, 5)
    rb.set(r, 8, g.ijazahTahun, 5)
    rb.set(r, 9, g.jabatanDaftar1, 4)
    rb.set(r, 10, `${g.masaKerjaTahun} Thn`, 5)
    rb.set(r2, 10, `${String(g.masaKerjaBulan).padStart(2, '0')} Bln`, 5)
    rb.set(r, 11, g.tmtDiangkat, 5)
    rb.set(r2, 11, g.tmtSekolahIni, 5)
    rb.set(r, 12, g.mengajarKelas, 5)
    rb.set(r, 13, g.tglSkTerakhir, 5)
    rb.set(r2, 13, g.noSkTerakhir, 4)
    rb.set(r, 14, g.golongan, 5)
    rb.set(r, 15, g.gajiPokok || '-', 6)
    rb.set(r, 16, g.absenSakit || '-', 5)
    rb.set(r, 17, g.absenIzin || '-', 5)
    rb.set(r, 18, g.absenLain || '-', 5)
    rb.set(r, 19, g.keterangan, 5)
    rb.set(r2, 19, `Sertifikasi: ${g.tersertifikasi}`, 5)

    for (const c of [1, 4, 5, 6, 7, 8, 9, 12, 14, 15, 16, 17, 18]) {
      merges.push(`${colLetter(c)}${r}:${colLetter(c)}${r2}`)
    }
    rb.styleRange(r, 1, r2, 19, 5)
    r += 2
  }

  r += 2
  rb.set(r, 13, tanggalTtdDaftar1(profil, state), 1)
  merges.push(`M${r}:S${r}`)
  rb.set(r + 1, 13, `Kepala ${profil.sekolah}`, 1)
  merges.push(`M${r + 1}:S${r + 1}`)
  rb.set(r + 5, 13, profil.kepsek, 9)
  merges.push(`M${r + 5}:S${r + 5}`)
  rb.set(r + 6, 13, `NIP ${profil.nipKepsek}`, 1)
  merges.push(`M${r + 6}:S${r + 6}`)

  return {
    name: 'Guru',
    rows: rb.rows(),
    merges,
    colWidths: [5, 28, 22, 5, 10, 10, 10, 13, 16, 10, 15, 11, 28, 10, 13, 5, 5, 5, 14],
    landscape: true,
  }
}

export function buildUsiaSheet(profil: Profil, state: Daftar1State): SheetSpec {
  const rekap = hitungRekapDaftar1(profil, state)
  const rb = rowBuilder()

  const hdr = ['NAMA', 'TANGGAL LAHIR', 'JK', 'KELAS', 'USIA', 'KETERANGAN', '', 'Bulan', 'Hari Efektif', '', 'Kelas', 'L', 'P', 'JML', '', 'No', 'Nama GTK', 'Jabatan', 'Status', 'Tersertifikasi', 'NIP']
  hdr.forEach((h, i) => {
    if (h) rb.set(1, i + 1, h, 3)
  })

  rekap.siswa.forEach((s, idx) => {
    const r = idx + 2
    rb.set(r, 1, s.nama, 4)
    rb.set(r, 2, s.tglLahir || '-', 5)
    rb.set(r, 3, s.jk, 5)
    rb.set(r, 4, Number(s.tingkat), 5)
    rb.set(r, 5, s.usia ?? '', 5)
    rb.set(r, 6, `KELAS ${s.tingkat}`, 5)
  })

  BULAN_TAHUN_AJARAN.forEach((m, idx) => {
    const r = idx + 2
    rb.set(r, 8, m, 4)
    rb.set(r, 9, state.hariEfektif[m] ?? 0, 5)
  })

  TINGKAT_LIST.forEach((t, idx) => {
    const r = idx + 2
    const k = rekap.perKelas[t]
    rb.set(r, 11, `Kelas ${t}`, 4)
    rb.set(r, 12, k.penghabisanL, 5)
    rb.set(r, 13, k.penghabisanP, 5)
    rb.set(r, 14, k.total, 7)
  })
  rb.set(8, 11, 'JML', 8)
  rb.set(8, 12, rekap.totalKelas.penghabisanL, 7)
  rb.set(8, 13, rekap.totalKelas.penghabisanP, 7)
  rb.set(8, 14, rekap.totalKelas.total, 7)

  rekap.guru.forEach((g, idx) => {
    const r = idx + 2
    rb.set(r, 16, g.no, 5)
    rb.set(r, 17, g.nama, 4)
    rb.set(r, 18, g.jabatanDaftar1, 4)
    rb.set(r, 19, g.keterangan, 5)
    rb.set(r, 20, g.tersertifikasi, 5)
    rb.set(r, 21, g.nip, 5)
  })

  return {
    name: 'DATA USIA SISWA',
    rows: rb.rows(),
    merges: [],
    colWidths: [30, 15, 5, 8, 8, 12, 3, 13, 12, 3, 10, 6, 6, 7, 3, 5, 28, 16, 12, 13, 22],
    landscape: true,
  }
}

export function buildBbTbSheet(profil: Profil, state: Daftar1State): SheetSpec {
  const rekap = hitungRekapDaftar1(profil, state)
  const rb = rowBuilder()

  const hdr = ['NO', 'NAMA SISWA', 'L/P', 'TANGGAL LAHIR', 'UMUR (THN)', 'KELAS', 'BB (KG)', 'TB (CM)']
  hdr.forEach((h, i) => rb.set(1, i + 1, h, 3))

  rekap.siswa.forEach((s, idx) => {
    const r = idx + 2
    rb.set(r, 1, s.no, 5)
    rb.set(r, 2, s.nama, 4)
    rb.set(r, 3, s.jk, 5)
    rb.set(r, 4, s.tglLahir || '-', 5)
    rb.set(r, 5, s.usia ?? '', 5)
    rb.set(r, 6, Number(s.tingkat), 5)
    rb.set(r, 7, s.bb ?? '', 5)
    rb.set(r, 8, s.tb ?? '', 5)
  })

  return {
    name: 'BB TB',
    rows: rb.rows(),
    merges: [],
    colWidths: [6, 32, 6, 15, 12, 9, 10, 10],
  }
}

export function buildAbsenSheet(profil: Profil, state: Daftar1State): SheetSpec {
  const rekap = hitungRekapDaftar1(profil, state)
  const rb = rowBuilder()
  const merges = ['A1:AJ1', 'A2:AJ2']

  rb.set(1, 1, `DAFTAR ABSEN HARIAN SISWA - ${profil.sekolah}`, 2)
  rb.set(2, 1, `Bulan: ${state.bulan} ${state.tahun}`, 1)

  rb.set(4, 1, 'NO', 3)
  rb.set(4, 2, 'KELAS', 3)
  rb.set(4, 3, 'NAMA SISWA', 3)
  rb.set(4, 4, 'L/P', 3)
  for (let d = 1; d <= 31; d++) {
    rb.set(4, 4 + d, d, 3)
  }
  rb.set(4, 36, 'S', 3)
  rb.set(4, 37, 'I', 3)
  rb.set(4, 38, 'A', 3)

  rekap.siswa.forEach((s, idx) => {
    const r = idx + 5
    rb.set(r, 1, s.no, 5)
    rb.set(r, 2, `Kelas ${s.tingkat}`, 5)
    rb.set(r, 3, s.nama, 4)
    rb.set(r, 4, s.jk, 5)
    for (let c = 5; c <= 38; c++) {
      rb.set(r, c, '', 5)
    }
  })

  const widths = [5, 9, 30, 5, ...Array.from({ length: 31 }, () => 3.2), 4, 4, 4]
  return {
    name: 'Absen',
    rows: rb.rows(),
    merges,
    colWidths: widths,
    landscape: true,
  }
}
