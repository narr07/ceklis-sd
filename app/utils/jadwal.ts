import type { Block } from './blocks'
import type { Profil } from './profil'
import { namaSekolahPendek } from './profil'
import { ROMAWI_MAP, TINGKAT_LIST, type TingkatKelas } from './daftar1'
import type { BarisSkbm, HasilSkbm, MapelJam, SemesterSkbm } from './skbm'
import { teksSemester } from './skbm'

/* ───────────── Model ───────────── */

export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at'] as const
export const JUMLAH_HARI = HARI.length

export interface PengaturanJadwal {
  /** Jam mulai jam pelajaran ke-1, "HH:MM". */
  jamMulai: string
  /** Lama satu jam pelajaran (menit). */
  durasi: number
  /** Istirahat setelah jam ke-n. */
  istirahatSetelah: number
  durasiIstirahat: number
  /** Batas jam pelajaran tiap hari (Senin..Jumat). */
  maksJam: number[]
  /** Kegiatan sebelum jam ke-1 per hari (mis. Upacara, Pembiasaan); kosong = tidak ada. */
  kegiatanAwal: string[]
  /** Lama kegiatan awal (menit). */
  durasiKegiatanAwal: number
}

/** jadwal[kelas][hari][jamKe - 1] = nama mapel ('' = kosong). */
export type JadwalKelas = string[][]
export type Jadwal = Record<TingkatKelas, JadwalKelas>

export function pengaturanJadwalAwal(): PengaturanJadwal {
  return {
    jamMulai: '07:00',
    durasi: 35,
    istirahatSetelah: 4,
    durasiIstirahat: 30,
    maksJam: [9, 9, 9, 9, 6],
    kegiatanAwal: ['Upacara', 'Pembiasaan', 'Pembiasaan', 'Pembiasaan', 'Pembiasaan'],
    durasiKegiatanAwal: 30,
  }
}

export function mergePengaturanJadwal(p?: Partial<PengaturanJadwal> | null): PengaturanJadwal {
  const base = pengaturanJadwalAwal()
  if (!p || typeof p !== 'object') return base
  const angka = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d)
  return {
    jamMulai: /^\d{1,2}:\d{2}$/.test(String(p.jamMulai)) ? String(p.jamMulai) : base.jamMulai,
    durasi: angka(p.durasi, base.durasi) || base.durasi,
    istirahatSetelah: angka(p.istirahatSetelah, base.istirahatSetelah),
    durasiIstirahat: angka(p.durasiIstirahat, base.durasiIstirahat),
    maksJam: HARI.map((_, i) => Math.min(12, angka(p.maksJam?.[i], base.maksJam[i]!))),
    kegiatanAwal: HARI.map((_, i) => String(p.kegiatanAwal?.[i] ?? base.kegiatanAwal[i] ?? '')),
    durasiKegiatanAwal: angka(p.durasiKegiatanAwal, base.durasiKegiatanAwal),
  }
}

/* ───────────── Waktu ───────────── */

const keMenit = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
export const formatJam = (menit: number) =>
  `${String(Math.floor(menit / 60)).padStart(2, '0')}.${String(menit % 60).padStart(2, '0')}`

/** Waktu mulai & selesai jam pelajaran ke-n (1-based). */
export function waktuJam(p: PengaturanJadwal, n: number): { mulai: string, selesai: string } {
  const lewatIstirahat = p.istirahatSetelah > 0 && n > p.istirahatSetelah ? p.durasiIstirahat : 0
  const mulai = keMenit(p.jamMulai) + (n - 1) * p.durasi + lewatIstirahat
  return { mulai: formatJam(mulai), selesai: formatJam(mulai + p.durasi) }
}

export function waktuIstirahat(p: PengaturanJadwal) {
  const mulai = keMenit(p.jamMulai) + p.istirahatSetelah * p.durasi
  return { mulai: formatJam(mulai), selesai: formatJam(mulai + p.durasiIstirahat) }
}

export function waktuKegiatanAwal(p: PengaturanJadwal) {
  const selesai = keMenit(p.jamMulai)
  return { mulai: formatJam(selesai - p.durasiKegiatanAwal), selesai: formatJam(selesai) }
}

/* ───────────── Pembagian jam per hari ───────────── */

/** Bagi total JJM ke 5 hari serata mungkin tanpa melewati batas tiap hari (mis. 40 → 9, 9, 8, 8, 6). */
export function kapasitasHarian(total: number, maksJam: number[]): number[] {
  const kap = HARI.map(() => 0)
  let sisa = Math.min(total, maksJam.reduce((a, n) => a + n, 0))
  while (sisa > 0) {
    let pilih = -1
    for (let h = 0; h < JUMLAH_HARI; h++) {
      if (kap[h]! >= maksJam[h]!) continue
      if (pilih < 0 || kap[h]! < kap[pilih]!) pilih = h
    }
    if (pilih < 0) break
    kap[pilih]!++
    sisa--
  }
  return kap
}

/* ───────────── Pengajar ───────────── */

/** Guru yang mengajar mapel tertentu di kelas tertentu: guru mapel bila ada, selain itu guru kelas. */
export function pengajarMapel(baris: BarisSkbm[], kelas: TingkatKelas, mapel: string): BarisSkbm | undefined {
  return baris.find(b => b.tugas.jenis === 'mapel' && b.tugas.mapel === mapel && b.tugas.kelasMapel?.includes(kelas))
    ?? baris.find(b => b.tugas.jenis === 'kelas' && b.tugas.kelas === kelas)
}

/* ───────────── Penyusun otomatis ───────────── */

interface ItemBlok {
  guru: string
  kelas: TingkatKelas
  mapel: string
  jjm: number
}

interface HasilSusun {
  jadwal: Jadwal
  /** Jam yang tidak berhasil ditempatkan (seharusnya kosong). */
  gagal: { kelas: TingkatKelas, mapel: string, jam: number }[]
}

/** Pola pembagian blok: utuh dulu (4 → 4), lalu dua bagian (4 → 2+2), lalu per 1 jam. */
function polaBlok(jjm: number): number[][] {
  const pola: number[][] = [[jjm]]
  if (jjm >= 2) pola.push([Math.ceil(jjm / 2), Math.floor(jjm / 2)])
  if (jjm >= 3) pola.push(Array.from({ length: jjm }, () => 1))
  return pola
}

/**
 * Susun jadwal 5 hari. Jam guru mapel (PAI, PJOK, dll.) ditempatkan lebih dulu sebagai blok
 * berurutan dengan pencarian mundur (backtracking), sehingga satu guru tidak pernah mengajar
 * dua kelas pada jam yang sama. Sisa jam diisi mapel guru kelas, tersebar per 2 jam di hari berbeda.
 */
export function susunJadwal(
  struktur: Record<TingkatKelas, MapelJam[]>,
  baris: BarisSkbm[],
  pengaturan: PengaturanJadwal,
): HasilSusun {
  const maksSlot = Math.max(...pengaturan.maksJam)
  const kap = {} as Record<TingkatKelas, number[]>
  const jadwal = {} as Jadwal
  for (const t of TINGKAT_LIST) {
    const total = struktur[t].reduce((a, m) => a + (m.jjm > 0 ? m.jjm : 0), 0)
    kap[t] = kapasitasHarian(total, pengaturan.maksJam)
    jadwal[t] = HARI.map(() => Array.from({ length: maksSlot }, () => ''))
  }
  const sibukGuru = new Map<string, boolean[][]>()
  const sibuk = (guru: string) => {
    if (!sibukGuru.has(guru)) sibukGuru.set(guru, HARI.map(() => Array.from({ length: maksSlot }, () => false)))
    return sibukGuru.get(guru)!
  }
  const ist = pengaturan.istirahatSetelah
  const segmen = (t: TingkatKelas, h: number): [number, number][] => {
    const akhir = kap[t][h]!
    if (ist <= 0 || ist >= akhir) return [[0, akhir]]
    return [[0, ist], [ist, akhir]]
  }

  // 1) Blok guru mapel, dicari dengan backtracking.
  const items: ItemBlok[] = []
  for (const t of TINGKAT_LIST) {
    for (const m of struktur[t]) {
      if (!(m.jjm > 0)) continue
      const p = pengajarMapel(baris, t, m.mapel)
      if (p?.tugas.jenis === 'mapel') items.push({ guru: p.kunci, kelas: t, mapel: m.mapel, jjm: m.jjm })
    }
  }
  // Guru dengan beban terbesar dulu agar ruang geraknya tidak habis.
  const beban = new Map<string, number>()
  for (const it of items) beban.set(it.guru, (beban.get(it.guru) ?? 0) + it.jjm)
  items.sort((a, b) => (beban.get(b.guru)! - beban.get(a.guru)!) || a.guru.localeCompare(b.guru) || a.kelas.localeCompare(b.kelas))

  const bisa = (it: ItemBlok, h: number, s: number, len: number) => {
    const g = sibuk(it.guru)
    for (let i = s; i < s + len; i++) {
      if (jadwal[it.kelas][h]![i] !== '' || g[h]![i]) return false
    }
    return true
  }
  const pasang = (it: ItemBlok, h: number, s: number, len: number, isi: boolean) => {
    const g = sibuk(it.guru)
    for (let i = s; i < s + len; i++) {
      jadwal[it.kelas][h]![i] = isi ? it.mapel : ''
      g[h]![i] = isi
    }
  }
  /** Calon posisi blok: sebelum istirahat dulu, hari tanpa mapel guru lain di kelas itu dulu. */
  const calon = (it: ItemBlok, len: number, hariTerpakai: Set<number>) => {
    const out: { h: number, s: number, skor: number }[] = []
    for (let h = 0; h < JUMLAH_HARI; h++) {
      if (hariTerpakai.has(h)) continue
      const adaMapelGuruLain = jadwal[it.kelas][h]!.some((m, i) => m && m !== it.mapel && i < kap[it.kelas][h]!)
      segmen(it.kelas, h).forEach(([a, b], si) => {
        for (let s = a; s + len <= b; s++) out.push({ h, s, skor: (adaMapelGuruLain ? 100 : 0) + si * 10 + (s - a) })
      })
    }
    return out.sort((x, y) => x.skor - y.skor || x.h - y.h)
  }

  let langkah = 0
  const BATAS_LANGKAH = 200_000
  const cari = (idx: number): boolean => {
    if (idx >= items.length) return true
    if (++langkah > BATAS_LANGKAH) return false
    const it = items[idx]!
    for (const pola of polaBlok(it.jjm)) {
      const terpasang: { h: number, s: number, len: number }[] = []
      const coba = (bi: number): boolean => {
        if (bi >= pola.length) return cari(idx + 1)
        const len = pola[bi]!
        const hariTerpakai = new Set(terpasang.map(x => x.h))
        for (const c of calon(it, len, hariTerpakai)) {
          if (!bisa(it, c.h, c.s, len)) continue
          pasang(it, c.h, c.s, len, true)
          terpasang.push({ h: c.h, s: c.s, len })
          if (coba(bi + 1)) return true
          terpasang.pop()
          pasang(it, c.h, c.s, len, false)
          if (langkah > BATAS_LANGKAH) return false
        }
        return false
      }
      if (coba(0)) return true
    }
    return false
  }

  const gagal: HasilSusun['gagal'] = []
  if (!cari(0)) {
    // Tidak ada susunan sempurna: pasang semampunya (serakah) dan laporkan sisanya.
    for (const t of TINGKAT_LIST) jadwal[t] = HARI.map(() => Array.from({ length: maksSlot }, () => ''))
    sibukGuru.clear()
    for (const it of items) {
      let sisa = it.jjm
      for (let h = 0; h < JUMLAH_HARI && sisa > 0; h++) {
        for (let s = 0; s < kap[it.kelas][h]! && sisa > 0; s++) {
          if (bisa(it, h, s, 1)) {
            pasang(it, h, s, 1, true)
            sisa--
          }
        }
      }
      if (sisa > 0) gagal.push({ kelas: it.kelas, mapel: it.mapel, jam: sisa })
    }
  }

  // 2) Mapel guru kelas mengisi slot kosong, per 2 jam di hari yang belum ada mapel itu.
  for (const t of TINGKAT_LIST) {
    const sisaMapel = struktur[t]
      .filter(m => m.jjm > 0 && pengajarMapel(baris, t, m.mapel)?.tugas.jenis !== 'mapel')
      .map(m => ({ mapel: m.mapel, sisa: m.jjm }))
      .sort((a, b) => b.sisa - a.sisa)
    const kosongBeruntun = (h: number, len: number) => {
      for (const [a, b] of segmen(t, h)) {
        for (let s = a; s + len <= b; s++) {
          if (jadwal[t][h]!.slice(s, s + len).every(x => x === '')) return s
        }
      }
      return -1
    }
    const sisaHari = (h: number) => jadwal[t][h]!.slice(0, kap[t][h]!).filter(x => x === '').length
    for (const m of sisaMapel) {
      while (m.sisa > 0) {
        const len = m.sisa >= 2 ? 2 : 1
        const urutHari = HARI.map((_, h) => h)
          .filter(h => sisaHari(h) >= len)
          .sort((a, b) => {
            const sudahA = jadwal[t][a]!.includes(m.mapel) ? 1 : 0
            const sudahB = jadwal[t][b]!.includes(m.mapel) ? 1 : 0
            return sudahA - sudahB || sisaHari(b) - sisaHari(a) || a - b
          })
        let ditempatkan = false
        for (const h of urutHari) {
          const s = kosongBeruntun(h, len)
          if (s >= 0) {
            for (let i = s; i < s + len; i++) jadwal[t][h]![i] = m.mapel
            m.sisa -= len
            ditempatkan = true
            break
          }
        }
        if (!ditempatkan) {
          // Tidak ada 2 slot beruntun: isi satu-satu di slot kosong mana pun.
          const h = HARI.map((_, i) => i).find(i => sisaHari(i) > 0)
          if (h === undefined) {
            gagal.push({ kelas: t, mapel: m.mapel, jam: m.sisa })
            break
          }
          const s = jadwal[t][h]!.findIndex((x, i) => x === '' && i < kap[t][h]!)
          jadwal[t][h]![s] = m.mapel
          m.sisa--
        }
      }
    }
  }

  return { jadwal, gagal }
}

/* ───────────── Pemeriksaan ───────────── */

export interface Bentrok {
  hari: number
  jam: number
  guru: string
  kelas: TingkatKelas[]
}

/** Satu guru di dua kelas atau lebih pada jam yang sama. */
export function cekBentrok(jadwal: Jadwal, baris: BarisSkbm[]): Bentrok[] {
  const out: Bentrok[] = []
  const maksSlot = Math.max(...TINGKAT_LIST.map(t => Math.max(...jadwal[t].map(h => h.length))))
  for (let h = 0; h < JUMLAH_HARI; h++) {
    for (let s = 0; s < maksSlot; s++) {
      const per = new Map<string, TingkatKelas[]>()
      for (const t of TINGKAT_LIST) {
        const mapel = jadwal[t][h]?.[s]
        if (!mapel) continue
        const g = pengajarMapel(baris, t, mapel)
        if (!g) continue
        per.set(g.nama, [...(per.get(g.nama) ?? []), t])
      }
      for (const [guru, kelas] of per) if (kelas.length > 1) out.push({ hari: h, jam: s + 1, guru, kelas })
    }
  }
  return out
}

/** Selisih jumlah jam di jadwal dengan struktur jam (JJM). */
export function cekJumlahJam(jadwal: Jadwal, struktur: Record<TingkatKelas, MapelJam[]>) {
  const out: { kelas: TingkatKelas, mapel: string, jadwal: number, jjm: number }[] = []
  for (const t of TINGKAT_LIST) {
    const hitung = new Map<string, number>()
    for (const hari of jadwal[t]) for (const m of hari) if (m) hitung.set(m, (hitung.get(m) ?? 0) + 1)
    const semua = new Set([...struktur[t].map(m => m.mapel), ...hitung.keys()])
    for (const mapel of semua) {
      const jjm = struktur[t].find(m => m.mapel === mapel)?.jjm ?? 0
      const di = hitung.get(mapel) ?? 0
      if (di !== jjm) out.push({ kelas: t, mapel, jadwal: di, jjm })
    }
  }
  return out
}

/** Banyak baris jam yang perlu ditampilkan untuk satu kelas (jam terakhir yang terisi). */
export function jumlahBarisJam(jk: JadwalKelas, minimal = 0) {
  let akhir = minimal
  jk.forEach(h => h.forEach((m, i) => { if (m) akhir = Math.max(akhir, i + 1) }))
  return akhir
}

/* ───────────── Dokumen jadwal ───────────── */

export function buildJadwalBlocks(
  profil: Profil,
  jadwal: Jadwal,
  pengaturan: PengaturanJadwal,
  hasil: HasilSkbm,
  info: { semester: SemesterSkbm, tahunAjaran: string },
): Block[] {
  const S = namaSekolahPendek(profil)
  const out: Block[] = [
    { t: 'p', text: `JADWAL PELAJARAN ${S.toUpperCase()}\nSEMESTER ${teksSemester(info.semester)} TAHUN AJARAN ${info.tahunAjaran}`, align: 'center', bold: true },
  ]
  const awal = waktuKegiatanAwal(pengaturan)
  const ist = waktuIstirahat(pengaturan)

  TINGKAT_LIST.forEach((t, idx) => {
    const n = jumlahBarisJam(jadwal[t])
    const rows: string[][] = []
    if (pengaturan.durasiKegiatanAwal > 0 && pengaturan.kegiatanAwal.some(Boolean)) {
      rows.push(['', awal.mulai, awal.selesai, ...HARI.map((_, h) => pengaturan.kegiatanAwal[h] ?? '')])
    }
    for (let s = 0; s < n; s++) {
      if (pengaturan.istirahatSetelah > 0 && s === pengaturan.istirahatSetelah) {
        rows.push(['', ist.mulai, ist.selesai, ...HARI.map(() => '**ISTIRAHAT**')])
      }
      const w = waktuJam(pengaturan, s + 1)
      rows.push([String(s + 1), w.mulai, w.selesai, ...HARI.map((_, h) => jadwal[t][h]?.[s] ?? '')])
    }
    if (idx > 0 && idx % 2 === 0) out.push({ t: 'break' })
    out.push({ t: 'p', text: `Kelas ${ROMAWI_MAP[t]}`, bold: true })
    out.push({
      t: 'table',
      kecil: true,
      head: ['No.', 'Mulai', 'Selesai', ...HARI],
      widths: [5, 8, 8, 15.8, 15.8, 15.8, 15.8, 15.8],
      align: ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
      rows,
    })
    const jjm = hasil.jjmKelas[t]
    out.push({
      t: 'p',
      text: `JJM: ${jjm} jam/minggu · ${hasil.baris.filter(b => b.jam[t] > 0).map(b => `${b.nama} (${b.jam[t]} jam)`).join(' · ')}`,
      italic: true,
    })
  })
  return out
}
