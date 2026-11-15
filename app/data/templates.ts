import type { Block, Sign } from '~/utils/blocks'
import type { Profil } from '~/utils/profil'
import type { Peran } from '~/data/checklists'
import { namaSekolahPendek } from '~/utils/profil'
import { bulanRomawi, hariTgl, rupiah, tahun, tahunAjaranSekarang, terbilang, tglPanjang, tglTerbilang } from '~/utils/tanggal'

export type FieldType = 'text' | 'date' | 'textarea' | 'number'
export interface Field {
  key: string
  label: string
  type?: FieldType
  default?: string | ((p: Profil) => string)
  hint?: string
}
export type Values = Record<string, string>

export interface Template {
  id: string
  judul: string
  kategori: 'RKAS' | 'SK' | 'Dapodik' | 'Keuangan' | 'Pengadaan'
  peran: Peran[]
  deskripsi: string
  fields: Field[]
  build: (p: Profil, v: Values) => Block[]
}

export interface Paket {
  id: string
  judul: string
  deskripsi: string
  isi: string[]
  fields: Field[]
}

/* ───────────── helper ───────────── */
const TITIK = '..............................'
const isi = (s?: string) => (s && s.trim()) ? s.trim() : TITIK
const baris = (s?: string) => (s || '').split('\n').map(x => x.trim()).filter(Boolean)
const kolom = (s?: string) => baris(s).map(r => r.split('|').map(c => c.trim()))
const angka = (s?: string) => Number(String(s || '0').replace(/[^\d-]/g, '')) || 0
const S = (p: Profil) => namaSekolahPendek(p)

function kepsek(p: Profil, atas?: string, pre = ''): Sign {
  return { atas, jabatan: `${pre}Kepala ${S(p)}`, nama: p.kepsek, nip: p.nipKepsek }
}
function bendahara(p: Profil, atas?: string, pre = ''): Sign {
  return { atas, jabatan: `${pre}Bendahara BOSP`, nama: isi(p.bendahara), nip: p.nipBendahara || TITIK }
}
function komite(p: Profil, nama?: string, pre = ''): Sign {
  return { jabatan: `${pre}Ketua Komite Sekolah`, nama: isi(nama || p.komite) }
}
const tempatTgl = (p: Profil, iso: string) => `${p.kota}, ${tglPanjang(iso)}`

/** Kerangka Surat Keputusan */
function sk(p: Profil, o: { nomor: string, tentang: string, menimbang: string[], mengingat: string[], diktum: [string, string][], tgl: string, lampiran?: Block[] }): Block[] {
  const abc = (xs: string[]) => xs.map((x, i) => `${String.fromCharCode(97 + i)}. ${x}`).join('\n')
  const num = (xs: string[]) => xs.map((x, i) => `${i + 1}. ${x}`).join('\n')
  const out: Block[] = [
    { t: 'kop' },
    { t: 'title', text: `KEPUTUSAN KEPALA ${p.sekolah}`, sub: `NOMOR: ${o.nomor}` },
    { t: 'p', text: 'TENTANG', align: 'center', bold: true },
    { t: 'p', text: o.tentang.toUpperCase(), align: 'center', bold: true },
    { t: 'p', text: `KEPALA ${p.sekolah},`, align: 'center', bold: true },
    { t: 'meta', rows: [['Menimbang', abc(o.menimbang)], ['Mengingat', num(o.mengingat)]] },
    { t: 'p', text: 'MEMUTUSKAN:', align: 'center', bold: true },
    { t: 'meta', rows: [['Menetapkan', o.tentang.toUpperCase()], ...o.diktum], bold: [0] },
    { t: 'sign', right: { atas: `Ditetapkan di ${p.kota}\npada tanggal ${tglPanjang(o.tgl)}`, jabatan: `Kepala ${S(p)},`, nama: p.kepsek, nip: p.nipKepsek } },
    { t: 'p', text: 'Tembusan:\n1. Kepala Dinas Pendidikan Kabupaten ' + p.kabupaten + '\n2. Pengawas Sekolah\n3. Arsip', italic: true },
  ]
  if (o.lampiran) out.push({ t: 'break' }, ...o.lampiran)
  return out
}

/* ───────────── RKAS (dipakai bersama di paket) ───────────── */
export const rkasFields: Field[] = [
  { key: 'ta', label: 'Tahun anggaran', default: '2026' },
  { key: 'tglSurat', label: 'Tanggal surat undangan', type: 'date', default: '2026-01-05' },
  { key: 'nomorUndangan', label: 'Nomor undangan', default: p => `421.2/012/${p.kodeSurat}/I/2026` },
  { key: 'tglRapat', label: 'Tanggal rapat', type: 'date', default: '2026-01-08' },
  { key: 'waktu', label: 'Waktu', default: 'Pukul 08.30 WIB s.d. selesai' },
  { key: 'tempat', label: 'Tempat', default: p => `Ruang Rapat ${S(p)}` },
  { key: 'agenda', label: 'Agenda (satu per baris)', type: 'textarea', default: 'Evaluasi Rapor Pendidikan dan program sekolah TA 2025\nPerencanaan prioritas program kegiatan TA 2026 (Perencanaan Berbasis Data)\nPembahasan alokasi anggaran BOSP Reguler TA 2026 sesuai Permendikdasmen 8/2026\nPenyampaian pertimbangan Komite Sekolah\nFinalisasi dan persetujuan draf RKAS 2026' },
  { key: 'komite', label: 'Ketua Komite Sekolah', default: p => p.komite },
  { key: 'anggotaKomite', label: 'Anggota komite / perwakilan orang tua yang diundang (satu per baris)', type: 'textarea', default: '' },
  { key: 'notulis', label: 'Notulis', default: '' },
  { key: 'nipNotulis', label: 'NIP notulis', default: '' },
  { key: 'perwakilanGuru', label: 'Perwakilan dewan guru (penandatangan BA)', default: '' },
  { key: 'nipPerwakilan', label: 'NIP perwakilan guru', default: '' },
  { key: 'jamSelesai', label: 'Rapat selesai pukul', default: '13.00 WIB' },
  { key: 'arahan', label: 'Pengarahan kepala sekolah', type: 'textarea', default: 'Penyusunan RKAS TA 2026 wajib mengacu pada Perencanaan Berbasis Data (PBD) dari Rapor Pendidikan dan Juknis BOSP terbaru (Permendikdasmen Nomor 8 Tahun 2026). Prioritas tahun 2026: peningkatan literasi dan numerasi, pembelajaran mendalam, sarana pembelajaran digital, serta sanitasi dan lingkungan sekolah ramah anak. Batas komponen wajib dipatuhi: honor paling banyak 20%, buku paling sedikit 10%, dan pemeliharaan sarana prasarana paling banyak 20% dari total alokasi. Belanja barang/jasa mengikuti Permendikdasmen Nomor 15 Tahun 2026.' },
  { key: 'pagu', label: 'Estimasi pagu BOSP Reguler (Rp)', type: 'number', default: '', hint: 'Kosongkan jika belum ada pagu definitif' },
  { key: 'aspirasi', label: 'Aspirasi kebutuhan (format: Pengusul|Usulan)', type: 'textarea', default: 'Guru PJOK|Pengadaan dan peremajaan sarana olahraga (bola voli, bola sepak anak, matras senam, perlengkapan atletik mini) untuk persiapan O2SN\nGuru PAI|Buku Juz Amma, alat peraga praktik ibadah, sound portabel untuk pembiasaan keagamaan, kegiatan PHBI\nGuru Kelas|Buku bacaan penunjang literasi/perpustakaan kelas, kertas dan toner untuk asesmen, perbaikan papan tulis dan pencahayaan kelas' },
  { key: 'pertimbanganKomite', label: 'Pertimbangan / masukan Komite Sekolah', type: 'textarea', default: 'Komite Sekolah mendukung prioritas literasi-numerasi dan sarana pembelajaran, meminta penggunaan dana diumumkan di papan informasi sekolah, serta menegaskan tidak ada pungutan kepada orang tua untuk kegiatan yang sudah dibiayai BOSP.' },
  { key: 'keputusan', label: 'Kesimpulan & keputusan (satu per baris)', type: 'textarea', default: 'Peserta rapat menyetujui Rancangan RKAS TA 2026 dengan prioritas mutu pembelajaran dan sarana esensial, dengan memperhatikan pertimbangan Komite Sekolah.\nBendahara bersama Tim BOSP menginput kertas kerja ke ARKAS 4 sesuai kode rekening dan batas komponen Juknis BOSP 2026.\nBelanja barang/jasa dilaksanakan sesuai Permendikdasmen Nomor 15 Tahun 2026 melalui SIPLah/sistem pembelanjaan kementerian, dengan pembanding minimal dua penyedia.\nRencana dan realisasi penggunaan dana diumumkan di papan informasi sekolah.\nRKAS diajukan untuk pengesahan Dinas Pendidikan Kabupaten melalui ARKAS 4.' },
  { key: 'rincian', label: 'Rincian anggaran per komponen (Uraian|Jumlah Rp)', type: 'textarea', default: 'Penerimaan peserta didik baru|0\nPengembangan perpustakaan (buku min. 10%)|0\nKegiatan pembelajaran dan ekstrakurikuler|0\nKegiatan asesmen/evaluasi pembelajaran|0\nAdministrasi kegiatan sekolah|0\nPengembangan profesi guru dan tenaga kependidikan|0\nLangganan daya dan jasa|0\nPemeliharaan sarana dan prasarana (maks. 20%)|0\nPenyediaan alat multimedia pembelajaran|0\nPembayaran honor (maks. 20% sekolah negeri)|0', hint: 'Sesuaikan nama komponen dengan Lampiran I Permendikdasmen 8/2026 dan kertas kerja ARKAS' },
  { key: 'kadis', label: 'Nama Kepala Dinas Pendidikan (pengesahan)', default: '' },
  { key: 'nipKadis', label: 'NIP Kepala Dinas', default: '' },
  { key: 'jumlahFoto', label: 'Jumlah kotak foto dokumentasi', type: 'number', default: '4' },
]

function pesertaRapat(p: Profil, v: Values) {
  const rows = p.gtk.map(g => ({ nama: g.nama, ket: g.jabatan, nip: g.nip }))
  rows.push({ nama: isi(v.komite), ket: 'Ketua Komite Sekolah', nip: '-' })
  for (const a of baris(v.anggotaKomite)) rows.push({ nama: a, ket: 'Komite Sekolah / Orang Tua', nip: '-' })
  if (!baris(v.anggotaKomite).length) {
    rows.push({ nama: TITIK, ket: 'Anggota Komite Sekolah', nip: '-' })
    rows.push({ nama: TITIK, ket: 'Perwakilan Orang Tua/Wali', nip: '-' })
  }
  return rows
}

function rincianTabel(v: Values): Block {
  const r = kolom(v.rincian)
  const total = r.reduce((s, x) => s + angka(x[1]), 0)
  return {
    t: 'table', head: ['No', 'Uraian Komponen', 'Jumlah (Rp)', '%'], widths: [8, 57, 22, 13],
    rows: [
      ...r.map((x, i) => [String(i + 1), x[0] || '', angka(x[1]).toLocaleString('id-ID'), total ? `${(angka(x[1]) / total * 100).toFixed(1)}%` : '-']),
      ['', '**JUMLAH**', `**${total.toLocaleString('id-ID')}**`, total ? '100%' : '-'],
    ],
  }
}

const rkas: Template[] = [
  {
    id: 'rkas-undangan', judul: 'Undangan Rapat Penyusunan RKAS', kategori: 'RKAS', peran: ['kepsek'],
    deskripsi: 'Undangan untuk GTK dan Komite Sekolah, dengan lampiran daftar undangan.',
    fields: rkasFields,
    build: (p, v) => [
      { t: 'kop' },
      { t: 'p', text: tempatTgl(p, v.tglSurat!), align: 'right' },
      { t: 'meta', rows: [['Nomor', v.nomorUndangan!], ['Sifat', 'Penting'], ['Lampiran', '1 (satu) lembar'], ['Perihal', `**Undangan Rapat Penyusunan Rencana Kegiatan dan Anggaran Sekolah (RKAS) Tahun Anggaran ${v.ta}**`]] },
      { t: 'space' },
      { t: 'p', text: `Kepada Yth.\nBapak/Ibu Guru dan Tenaga Kependidikan\nKetua dan Anggota Komite Sekolah\n(Daftar terlampir)\ndi Tempat` },
      { t: 'space' },
      { t: 'p', text: 'Dengan hormat,' },
      { t: 'p', text: `Dalam rangka perencanaan dan pengelolaan dana operasional sekolah yang transparan, akuntabel, dan berbasis data Rapor Pendidikan, sesuai Permendikdasmen Nomor 8 Tahun 2026 tentang Petunjuk Teknis Pengelolaan Dana BOSP, kami mengundang Bapak/Ibu untuk hadir pada Rapat Penyusunan RKAS Tahun Anggaran ${v.ta} yang akan dilaksanakan pada:`, align: 'justify', indent: true },
      { t: 'meta', rows: [['Hari/Tanggal', `**${hariTgl(v.tglRapat!)}**`], ['Waktu', v.waktu!], ['Tempat', v.tempat!], ['Agenda', baris(v.agenda).map((a, i) => `${i + 1}. ${a}`).join('\n')], ['Catatan', 'Guru membawa daftar usulan kebutuhan kelas/mata pelajaran; Komite Sekolah menyampaikan pertimbangan.']] },
      { t: 'p', text: 'Mengingat pentingnya acara tersebut, dimohon kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.', align: 'justify', indent: true },
      { t: 'sign', right: kepsek(p, undefined, '') },
      { t: 'break' },
      { t: 'kop' },
      { t: 'p', text: `**LAMPIRAN SURAT UNDANGAN**\nNomor : ${v.nomorUndangan}\nTanggal : ${tglPanjang(v.tglSurat!)}\nPerihal : Daftar Undangan Rapat Penyusunan RKAS TA ${v.ta}` },
      { t: 'table', head: ['No', 'Nama', 'NIP', 'Jabatan / Unsur'], widths: [7, 40, 25, 28], rows: pesertaRapat(p, v).map((r, i) => [String(i + 1), r.nama, r.nip, r.ket]) },
      { t: 'sign', right: kepsek(p) },
    ],
  },
  {
    id: 'rkas-daftar-hadir', judul: 'Daftar Hadir Rapat RKAS', kategori: 'RKAS', peran: ['kepsek'],
    deskripsi: 'Daftar hadir bertanda tangan untuk GTK, komite, dan perwakilan orang tua.',
    fields: rkasFields,
    build: (p, v) => [
      { t: 'kop' },
      { t: 'title', text: 'DAFTAR HADIR', sub: `RAPAT PENYUSUNAN RKAS TAHUN ANGGARAN ${v.ta}` },
      { t: 'meta', rows: [['Hari/Tanggal', hariTgl(v.tglRapat!)], ['Waktu', v.waktu!], ['Tempat', v.tempat!]] },
      { t: 'table', head: ['No', 'Nama', 'Jabatan / Unsur', 'Tanda Tangan'], widths: [7, 38, 27, 28], tall: true,
        rows: pesertaRapat(p, v).map((r, i) => [String(i + 1), r.nama, r.ket, i % 2 === 0 ? `${i + 1}. ........` : `              ${i + 1}. ........`]) },
      { t: 'sign', right: kepsek(p, tempatTgl(p, v.tglRapat!)) },
    ],
  },
  {
    id: 'rkas-notulen', judul: 'Notulen Rapat RKAS', kategori: 'RKAS', peran: ['kepsek'],
    deskripsi: 'Notulen lengkap termasuk pertimbangan komite dan TTD notulis.',
    fields: rkasFields,
    build: (p, v) => {
      const pagu = angka(v.pagu)
      return [
        { t: 'kop' },
        { t: 'title', text: 'NOTULEN RAPAT', sub: `PENYUSUNAN RENCANA KEGIATAN DAN ANGGARAN SEKOLAH (RKAS)\nTAHUN ANGGARAN ${v.ta}` },
        { t: 'meta', rows: [['Hari/Tanggal', hariTgl(v.tglRapat!)], ['Waktu', `${v.waktu!.replace(/s\.d\..*/i, 's.d.')} ${v.jamSelesai}`], ['Tempat', v.tempat!], ['Pemimpin Rapat', `${p.kepsek} (Kepala Sekolah)`], ['Notulis', v.notulis!], ['Peserta', `${pesertaRapat(p, v).length} orang (GTK dan Komite Sekolah, daftar hadir terlampir)`]] },
        { t: 'p', text: '**A. SUSUNAN ACARA**' },
        { t: 'list', style: 'num', items: ['Pembukaan', 'Pengarahan kepala sekolah', ...baris(v.agenda), 'Tanya jawab, pembacaan kesimpulan, dan penutup'] },
        { t: 'p', text: '**B. JALANNYA RAPAT**' },
        { t: 'p', text: '**1. Pengarahan Kepala Sekolah**' },
        { t: 'p', text: v.arahan!, align: 'justify', indent: true },
        { t: 'p', text: '**2. Estimasi Penerimaan Dana BOSP**' },
        { t: 'p', text: pagu ? `Berdasarkan data Dapodik cut-off 31 Agustus tahun sebelumnya, estimasi pagu BOSP Reguler TA ${v.ta} sebesar ${rupiah(pagu)} (${terbilang(pagu)} Rupiah).` : `Alokasi BOSP Reguler TA ${v.ta} dihitung berdasarkan data Dapodik cut-off 31 Agustus tahun sebelumnya. Pagu definitif mengikuti penetapan kementerian dan akan disesuaikan di ARKAS.`, align: 'justify', indent: true },
        { t: 'p', text: '**3. Penjaringan Aspirasi Kebutuhan**' },
        { t: 'table', head: ['No', 'Pengusul', 'Usulan Kebutuhan'], widths: [7, 33, 60], rows: kolom(v.aspirasi).map((r, i) => [String(i + 1), r[0] || '', r[1] || '']) },
        { t: 'p', text: '**4. Pertimbangan Komite Sekolah**' },
        { t: 'p', text: v.pertimbanganKomite!, align: 'justify', indent: true },
        { t: 'p', text: '**C. KESIMPULAN DAN KEPUTUSAN**' },
        { t: 'list', style: 'num', items: baris(v.keputusan) },
        { t: 'sign', left: { jabatan: 'Notulis,', nama: v.notulis!, nip: v.nipNotulis }, right: kepsek(p, tempatTgl(p, v.tglRapat!), 'Mengetahui,\n') },
      ]
    },
  },
  {
    id: 'rkas-berita-acara', judul: 'Berita Acara Penyusunan RKAS', kategori: 'RKAS', peran: ['kepsek'],
    deskripsi: 'BA dengan tanda tangan kepala sekolah, komite, dan perwakilan guru.',
    fields: rkasFields,
    build: (p, v) => {
      const total = kolom(v.rincian).reduce((s, x) => s + angka(x[1]), 0) || angka(v.pagu)
      return [
        { t: 'kop' },
        { t: 'title', text: 'BERITA ACARA', sub: `RAPAT PENYUSUNAN DAN PERSETUJUAN\nRENCANA KEGIATAN DAN ANGGARAN SEKOLAH (RKAS)\nTAHUN ANGGARAN ${v.ta}` },
        { t: 'p', text: `Nomor: 421.2/___/BA-RKAS/${p.kodeSurat}/${bulanRomawi(v.tglRapat!)}/${tahun(v.tglRapat!)}`, align: 'center', italic: true },
        { t: 'p', text: `Pada hari ini ${tglTerbilang(v.tglRapat!)}, bertempat di ${v.tempat}, telah dilaksanakan Rapat Dewan Guru bersama Komite Sekolah dan Tim Pengelola Dana BOSP ${S(p)} untuk membahas dan menyetujui Rencana Kegiatan dan Anggaran Sekolah (RKAS) Tahun Anggaran ${v.ta}${total ? ` sebesar ${rupiah(total)} (${terbilang(total)} Rupiah)` : ''}.`, align: 'justify', indent: true },
        { t: 'p', text: 'Rapat dihadiri oleh kepala sekolah, guru, tenaga kependidikan, dan Komite Sekolah sebagaimana tercantum dalam daftar hadir terlampir. Berdasarkan musyawarah mufakat dan setelah memperhatikan pertimbangan Komite Sekolah, disepakati hal-hal berikut:', align: 'justify', indent: true },
        { t: 'list', style: 'num', items: [
          `Menyetujui Rancangan RKAS Tahun Anggaran ${v.ta} sebagai pedoman pelaksanaan program dan penggunaan dana sekolah selama satu tahun anggaran.`,
          'Alokasi anggaran disusun berdasarkan prioritas hasil Perencanaan Berbasis Data (Rapor Pendidikan) dan memenuhi batas komponen Permendikdasmen Nomor 8 Tahun 2026.',
          'Belanja barang/jasa dilaksanakan sesuai Permendikdasmen Nomor 15 Tahun 2026, dan rencana serta realisasi penggunaan dana diumumkan kepada warga sekolah.',
          'RKAS diajukan untuk pengesahan Dinas Pendidikan melalui aplikasi ARKAS 4.',
          'Apabila terjadi perubahan kebijakan atau pagu definitif, dilakukan pergeseran/perubahan RKAS sesuai ketentuan.',
        ] },
        { t: 'p', text: 'Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.', align: 'justify', indent: true },
        { t: 'sign', left: komite(p, v.komite), right: kepsek(p, tempatTgl(p, v.tglRapat!)) },
        { t: 'sign', center: { jabatan: 'Perwakilan Dewan Guru,', nama: v.perwakilanGuru!, nip: v.nipPerwakilan } },
      ]
    },
  },
  {
    id: 'rkas-pengesahan', judul: 'Lembar Pengesahan RKAS', kategori: 'RKAS', peran: ['kepsek', 'bendahara'],
    deskripsi: 'Ringkasan anggaran per komponen dengan TTD bendahara, kepsek, komite, dan dinas.',
    fields: rkasFields,
    build: (p, v) => [
      { t: 'kop' },
      { t: 'title', text: 'LEMBAR PENGESAHAN', sub: `RENCANA KEGIATAN DAN ANGGARAN SEKOLAH (RKAS)\nTAHUN ANGGARAN ${v.ta}` },
      { t: 'meta', rows: [['Satuan Pendidikan', `${S(p)} (NPSN ${p.npsn})`], ['Sumber Dana', 'BOSP Reguler']] },
      rincianTabel(v),
      { t: 'p', text: 'Catatan: honor paling banyak 20% (negeri), buku paling sedikit 10%, pemeliharaan sarpras paling banyak 20% dari total alokasi (Permendikdasmen 8/2026 Pasal 42).', italic: true },
      { t: 'sign', left: bendahara(p, ' ', 'Disusun oleh,\n'), right: kepsek(p, tempatTgl(p, v.tglRapat!)) },
      { t: 'sign', left: komite(p, v.komite, 'Menyetujui,\n'), right: { jabatan: `Mengesahkan,\nKepala Dinas Pendidikan\nKabupaten ${p.kabupaten}`, nama: isi(v.kadis), nip: v.nipKadis || TITIK } },
    ],
  },
  {
    id: 'rkas-dokumentasi', judul: 'Lampiran Dokumentasi Rapat RKAS', kategori: 'RKAS', peran: ['kepsek'],
    deskripsi: 'Halaman kotak foto berketerangan untuk ditempel di Word.',
    fields: rkasFields,
    build: (p, v) => [
      { t: 'kop' },
      { t: 'title', text: 'DOKUMENTASI KEGIATAN', sub: `RAPAT PENYUSUNAN RKAS TA ${v.ta}\n${hariTgl(v.tglRapat!)}` },
      { t: 'photos', n: Math.max(2, Math.min(8, angka(v.jumlahFoto) || 4)), captions: ['Pembukaan dan pengarahan kepala sekolah', 'Pemaparan Rapor Pendidikan', 'Penjaringan aspirasi guru', 'Pertimbangan Komite Sekolah', 'Penandatanganan berita acara', 'Peserta rapat'] },
      { t: 'sign', right: kepsek(p, tempatTgl(p, v.tglRapat!), 'Mengetahui,\n') },
    ],
  },
]

/* ───────────── SK ───────────── */
const mengingatUmum = [
  'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional',
  'Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan sebagaimana telah diubah',
]

const skTemplates: Template[] = [
  {
    id: 'sk-tim-bosp', judul: 'SK Tim Pengelola Dana BOSP', kategori: 'SK', peran: ['kepsek'],
    deskripsi: 'Penanggung jawab, bendahara, anggota guru, unsur komite & orang tua.',
    fields: [
      { key: 'nomor', label: 'Nomor SK', default: p => `421.2/___/${p.kodeSurat}/I/2026` },
      { key: 'tgl', label: 'Tanggal penetapan', type: 'date', default: '2026-01-02' },
      { key: 'ta', label: 'Tahun anggaran', default: '2026' },
      { key: 'anggota', label: 'Anggota (Nama|Unsur|Tugas)', type: 'textarea', default: p => `${p.operator}|Guru/Operator|Pendataan Dapodik & publikasi penggunaan dana\n${TITIK}|Guru|Sekretaris, notulensi & administrasi SPJ\n${p.komite || TITIK}|Komite Sekolah|Pertimbangan dan pengawasan penggunaan dana\n${TITIK}|Orang Tua/Wali|Pengawasan dan penyampaian aspirasi orang tua` },
    ],
    build: (p, v) => sk(p, {
      nomor: v.nomor!, tgl: v.tgl!, tentang: `Pembentukan Tim Pengelola Dana Bantuan Operasional Satuan Pendidikan (BOSP) ${S(p)} Tahun Anggaran ${v.ta}`,
      menimbang: [
        'bahwa dana BOSP harus dikelola secara fleksibel, efektif, efisien, akuntabel, dan transparan;',
        `bahwa untuk itu perlu dibentuk Tim Pengelola Dana BOSP ${S(p)} yang ditetapkan dengan Keputusan Kepala Sekolah.`,
      ],
      mengingat: [...mengingatUmum, 'Peraturan Menteri Pendidikan Dasar dan Menengah Nomor 8 Tahun 2026 tentang Petunjuk Teknis Pengelolaan Dana Bantuan Operasional Satuan Pendidikan', 'Peraturan Menteri Pendidikan Dasar dan Menengah Nomor 15 Tahun 2026 tentang belanja barang/jasa satuan pendidikan'],
      diktum: [
        ['KESATU', `Membentuk Tim Pengelola Dana BOSP ${S(p)} Tahun Anggaran ${v.ta} dengan susunan sebagaimana tercantum dalam lampiran keputusan ini.`],
        ['KEDUA', 'Tim bertugas menyusun RKAS di ARKAS, melaksanakan belanja sesuai ketentuan, menatausahakan dan melaporkan penggunaan dana, serta mengumumkan rencana dan realisasi penggunaan dana.'],
        ['KETIGA', 'Segala biaya yang timbul akibat keputusan ini dibebankan pada anggaran yang sesuai.'],
        ['KEEMPAT', 'Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.'],
      ],
      lampiran: [
        { t: 'p', text: `**LAMPIRAN KEPUTUSAN KEPALA ${p.sekolah}**\nNomor : ${v.nomor}\nTanggal : ${tglPanjang(v.tgl!)}` },
        { t: 'title', text: `SUSUNAN TIM PENGELOLA DANA BOSP TA ${v.ta}` },
        { t: 'table', head: ['No', 'Nama', 'Unsur', 'Kedudukan / Tugas'], widths: [7, 35, 20, 38], rows: [
          ['1', p.kepsek, 'Kepala Sekolah', 'Penanggung jawab'],
          ['2', isi(p.bendahara), 'Guru/Tendik', 'Bendahara BOSP'],
          ...kolom(v.anggota).map((r, i) => [String(i + 3), r[0] || '', r[1] || '', `Anggota: ${r[2] || ''}`]),
        ] },
        { t: 'sign', right: kepsek(p) },
      ],
    }),
  },
  {
    id: 'sk-operator', judul: 'SK Penunjukan Operator Dapodik', kategori: 'SK', peran: ['kepsek', 'operator'],
    deskripsi: 'Dasar surat tugas operator di laman SDM Data.',
    fields: [
      { key: 'nomor', label: 'Nomor SK', default: p => `421.2/___/${p.kodeSurat}/VII/2026` },
      { key: 'tgl', label: 'Tanggal penetapan', type: 'date', default: '2026-07-13' },
      { key: 'tp', label: 'Tahun pelajaran', default: () => tahunAjaranSekarang() },
      { key: 'nama', label: 'Nama operator', default: p => p.operator },
      { key: 'nip', label: 'NIP/NUPTK operator', default: p => p.nipOperator },
      { key: 'jabatan', label: 'Jabatan pokok', default: 'Guru Kelas' },
    ],
    build: (p, v) => sk(p, {
      nomor: v.nomor!, tgl: v.tgl!, tentang: `Penunjukan Operator Data Pokok Pendidikan (Dapodik) ${S(p)} Tahun Pelajaran ${v.tp}`,
      menimbang: ['bahwa data pokok pendidikan harus dimutakhirkan secara berkala, valid, dan sesuai kondisi riil;', 'bahwa untuk itu perlu menunjuk operator Dapodik dengan Keputusan Kepala Sekolah.'],
      mengingat: [...mengingatUmum, 'Peraturan Menteri Pendidikan Dasar dan Menengah Nomor 8 Tahun 2026 tentang Petunjuk Teknis Pengelolaan Dana BOSP', 'Surat Edaran Direktur Jenderal PAUD, Pendidikan Dasar, dan Pendidikan Menengah tentang pemutakhiran Dapodik'],
      diktum: [
        ['KESATU', `Menunjuk Saudara ${v.nama} (NIP/NUPTK ${v.nip}), ${v.jabatan}, sebagai Operator Dapodik ${S(p)} Tahun Pelajaran ${v.tp}.`],
        ['KEDUA', 'Operator bertugas: (1) memutakhirkan data sekolah, PTK, peserta didik, rombel, dan sarpras; (2) melakukan validasi dan sinkronisasi tepat waktu; (3) membantu verifikasi data Info GTK, NISN, dan PIP; (4) menjaga kerahasiaan akun dan data pribadi; (5) melaporkan hasil pendataan kepada kepala sekolah.'],
        ['KETIGA', 'Operator wajib terdaftar dan memperbarui surat tugas pada laman sdm.data.kemdikbud.go.id.'],
        ['KEEMPAT', 'Keputusan ini berlaku sejak tanggal ditetapkan sampai dengan berakhirnya tahun pelajaran.'],
      ],
    }),
  },
  {
    id: 'sk-pembagian-tugas', judul: 'SK Pembagian Tugas Mengajar & Tugas Tambahan', kategori: 'SK', peran: ['kepsek', 'operator'],
    deskripsi: 'Lampiran tabel tugas mengajar dan JTM; dasar entri rombel di Dapodik.',
    fields: [
      { key: 'nomor', label: 'Nomor SK', default: p => `421.2/___/${p.kodeSurat}/VII/2026` },
      { key: 'tgl', label: 'Tanggal penetapan', type: 'date', default: '2026-07-13' },
      { key: 'tp', label: 'Tahun pelajaran', default: () => tahunAjaranSekarang() },
      { key: 'semester', label: 'Semester', default: 'Ganjil' },
      { key: 'tugas', label: 'Tugas (Nama|NIP|Jabatan|Mengajar|JTM|Tugas tambahan)', type: 'textarea',
        default: p => p.gtk.map(g => `${g.nama}|${g.nip}|${g.jabatan}|${g.jabatan === 'Kepala Sekolah' ? '-' : '....'}|${g.jabatan === 'Kepala Sekolah' ? '-' : '24'}|${g.jabatan === 'Kepala Sekolah' ? 'Kepala Sekolah' : '-'}`).join('\n') },
    ],
    build: (p, v) => sk(p, {
      nomor: v.nomor!, tgl: v.tgl!, tentang: `Pembagian Tugas Mengajar dan Tugas Tambahan Guru ${S(p)} Semester ${v.semester} Tahun Pelajaran ${v.tp}`,
      menimbang: ['bahwa untuk kelancaran proses pembelajaran perlu pembagian tugas mengajar dan tugas tambahan guru;', 'bahwa pembagian tugas tersebut menjadi dasar pengisian pembelajaran di Dapodik dan pemenuhan beban kerja guru.'],
      mengingat: [...mengingatUmum, 'Peraturan perundang-undangan tentang beban kerja guru yang berlaku'],
      diktum: [
        ['KESATU', 'Menetapkan pembagian tugas mengajar dan tugas tambahan guru sebagaimana tercantum dalam lampiran keputusan ini.'],
        ['KEDUA', 'Guru melaksanakan tugas dengan penuh tanggung jawab dan melaporkan pelaksanaannya kepada kepala sekolah.'],
        ['KETIGA', `Keputusan ini berlaku untuk Semester ${v.semester} Tahun Pelajaran ${v.tp}.`],
      ],
      lampiran: [
        { t: 'p', text: `**LAMPIRAN KEPUTUSAN KEPALA ${p.sekolah}**\nNomor : ${v.nomor}\nTanggal : ${tglPanjang(v.tgl!)}` },
        { t: 'title', text: `PEMBAGIAN TUGAS MENGAJAR SEMESTER ${String(v.semester).toUpperCase()} TP ${v.tp}` },
        { t: 'table', head: ['No', 'Nama / NIP', 'Jabatan', 'Tugas Mengajar', 'JTM', 'Tugas Tambahan'], widths: [6, 32, 16, 18, 8, 20], rows: kolom(v.tugas).map((r, i) => [String(i + 1), `${r[0]}\nNIP. ${r[1] || '-'}`, r[2] || '', r[3] || '', r[4] || '', r[5] || '']) },
        { t: 'sign', right: kepsek(p) },
      ],
    }),
  },
]

/* ───────────── Dapodik ───────────── */
const dapodik: Template[] = [
  {
    id: 'pernyataan-dapodik', judul: 'Surat Pernyataan Kebenaran Data Dapodik', kategori: 'Dapodik', peran: ['operator', 'kepsek'],
    deskripsi: 'Pernyataan kepsek & operator bahwa data sesuai kondisi riil.',
    fields: [
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2026-08-25' },
      { key: 'semester', label: 'Semester', default: 'Ganjil' },
      { key: 'tp', label: 'Tahun pelajaran', default: () => tahunAjaranSekarang() },
      { key: 'versi', label: 'Versi aplikasi', default: '2027.b' },
      { key: 'pd', label: 'Jumlah peserta didik', type: 'number', default: '' },
      { key: 'rombel', label: 'Jumlah rombel', type: 'number', default: '6' },
      { key: 'ptk', label: 'Jumlah PTK', type: 'number', default: p => String(p.gtk.length) },
    ],
    build: (p, v) => [
      { t: 'kop' },
      { t: 'title', text: 'SURAT PERNYATAAN', sub: 'KEBENARAN DAN KEABSAHAN DATA POKOK PENDIDIKAN' },
      { t: 'p', text: 'Yang bertanda tangan di bawah ini:' },
      { t: 'meta', rows: [['Nama', p.kepsek], ['NIP', p.nipKepsek], ['Jabatan', `Kepala ${S(p)}`], ['NPSN', p.npsn]] },
      { t: 'p', text: `menyatakan bahwa data Dapodik ${S(p)} Semester ${v.semester} Tahun Pelajaran ${v.tp} yang dikirim melalui Aplikasi Dapodik versi ${v.versi} telah diisi dan diverifikasi sesuai kondisi riil di sekolah, meliputi:`, align: 'justify' },
      { t: 'table', head: ['No', 'Data', 'Jumlah / Keterangan'], widths: [8, 52, 40], rows: [
        ['1', 'Peserta didik', isi(v.pd)], ['2', 'Rombongan belajar', isi(v.rombel)], ['3', 'Pendidik dan tenaga kependidikan', isi(v.ptk)], ['4', 'Sarana dan prasarana', 'Sesuai kondisi riil'], ['5', 'Pembelajaran / jam mengajar', 'Sesuai SK pembagian tugas'],
      ] },
      { t: 'p', text: 'Apabila di kemudian hari terdapat ketidaksesuaian data, kami bersedia memperbaikinya dan bertanggung jawab sesuai ketentuan peraturan perundang-undangan.', align: 'justify', indent: true },
      { t: 'sign', left: { jabatan: 'Operator Sekolah,', nama: p.operator, nip: p.nipOperator }, right: { ...kepsek(p, tempatTgl(p, v.tgl!)), meterai: true } },
    ],
  },
]

/* ───────────── Keuangan & Pengadaan ───────────── */
const itemsField = (def: string): Field => ({ key: 'items', label: 'Barang/jasa (Nama|Spesifikasi|Jumlah|Satuan|Harga satuan)', type: 'textarea', default: def })
const itemRows = (v: Values) => {
  const r = kolom(v.items)
  const total = r.reduce((s, x) => s + angka(x[2]) * angka(x[4]), 0)
  return { r, total }
}

const keuangan: Template[] = [
  {
    id: 'ba-pemeriksaan-kas', judul: 'Berita Acara Pemeriksaan Kas', kategori: 'Keuangan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Pemeriksaan kas bulanan: saldo BKU vs tunai + bank.',
    fields: [
      { key: 'tgl', label: 'Tanggal pemeriksaan', type: 'date', default: '2026-11-30' },
      { key: 'bku', label: 'Saldo menurut BKU (Rp)', type: 'number', default: '0' },
      { key: 'tunai', label: 'Uang tunai di brankas (Rp)', type: 'number', default: '0' },
      { key: 'bank', label: 'Saldo rekening koran (Rp)', type: 'number', default: '0' },
      { key: 'catatan', label: 'Penjelasan selisih (jika ada)', type: 'textarea', default: '' },
    ],
    build: (p, v) => {
      const bku = angka(v.bku), t = angka(v.tunai), b = angka(v.bank), sel = bku - (t + b)
      return [
        { t: 'kop' },
        { t: 'title', text: 'BERITA ACARA PEMERIKSAAN KAS', sub: 'DANA BOSP' },
        { t: 'p', text: `Pada hari ini ${tglTerbilang(v.tgl!)}, kami yang bertanda tangan di bawah ini, ${p.kepsek} selaku Kepala Sekolah, telah melakukan pemeriksaan kas terhadap ${isi(p.bendahara)} selaku Bendahara BOSP ${S(p)}, dengan hasil sebagai berikut:`, align: 'justify', indent: true },
        { t: 'table', head: ['No', 'Uraian', 'Jumlah (Rp)'], widths: [8, 62, 30], rows: [
          ['1', 'Saldo menurut Buku Kas Umum (BKU)', bku.toLocaleString('id-ID')],
          ['2', 'Uang tunai di brankas', t.toLocaleString('id-ID')],
          ['3', 'Saldo rekening bank (rekening koran)', b.toLocaleString('id-ID')],
          ['4', 'Jumlah kas (2 + 3)', (t + b).toLocaleString('id-ID')],
          ['5', '**Selisih (1 − 4)**', `**${sel.toLocaleString('id-ID')}**`],
        ] },
        { t: 'p', text: sel === 0 ? 'Tidak terdapat selisih antara saldo BKU dan kas yang tersedia.' : `Terdapat selisih sebesar ${rupiah(Math.abs(sel))}. Penjelasan: ${isi(v.catatan)}`, align: 'justify' },
        { t: 'sign', left: bendahara(p, ' ', 'Yang diperiksa,\n'), right: kepsek(p, tempatTgl(p, v.tgl!), 'Yang memeriksa,\n') },
      ]
    },
  },
  {
    id: 'persiapan-pengadaan', judul: 'Dokumen Persiapan Belanja Barang/Jasa', kategori: 'Pengadaan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Wajib untuk belanja di atas Rp1 juta (Permendikdasmen 15/2026 Pasal 12–13).',
    fields: [
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2026-11-16' },
      { key: 'paket', label: 'Nama paket belanja', default: 'Pengadaan sarana olahraga' },
      { key: 'kegiatan', label: 'Kegiatan/kode di RKAS', default: 'Kegiatan pembelajaran dan ekstrakurikuler' },
      { key: 'waktu', label: 'Waktu penyerahan yang dibutuhkan', default: 'Paling lambat 14 hari kalender' },
      { key: 'lokasi', label: 'Lokasi penyerahan', default: p => S(p) },
      itemsField('Bola voli|Ukuran 5, bahan sintetis|3|buah|185000\nBola sepak anak|Ukuran 4|4|buah|150000\nMatras senam|180x60x5 cm|2|lembar|450000'),
    ],
    build: (p, v) => {
      const { r, total } = itemRows(v)
      return [
        { t: 'kop' },
        { t: 'title', text: 'DOKUMEN PERSIAPAN BELANJA BARANG/JASA', sub: 'Permendikdasmen Nomor 15 Tahun 2026' },
        { t: 'meta', rows: [['Nama paket', v.paket!], ['Kegiatan RKAS', v.kegiatan!], ['Sumber dana', 'BOSP Reguler'], ['Perkiraan anggaran', `${rupiah(total)} (${terbilang(total)} Rupiah)`], ['Waktu penyerahan', v.waktu!], ['Lokasi', v.lokasi!]] },
        { t: 'p', text: '**A. Kebutuhan dan Spesifikasi**' },
        { t: 'table', head: ['No', 'Barang/Jasa', 'Spesifikasi', 'Jml', 'Satuan', 'Harga Satuan', 'Jumlah'], widths: [5, 20, 25, 7, 10, 15, 18], rows: [
          ...r.map((x, i) => [String(i + 1), x[0] || '', x[1] || '', x[2] || '', x[3] || '', angka(x[4]).toLocaleString('id-ID'), (angka(x[2]) * angka(x[4])).toLocaleString('id-ID')]),
          ['', '**TOTAL**', '', '', '', '', `**${total.toLocaleString('id-ID')}**`],
        ] },
        { t: 'p', text: '**B. Persyaratan Penyedia**' },
        { t: 'list', style: 'num', items: ['Memiliki NPWP dan identitas yang jelas.', 'Mampu menyediakan barang/jasa sesuai spesifikasi, jumlah, dan waktu.', 'Diutamakan usaha mikro/kecil setempat atau penyedia di SIPLah/sistem pembelanjaan kementerian.', 'Dibandingkan minimal 2 (dua) penyedia.'] },
        { t: 'sign', left: bendahara(p, ' ', 'Disiapkan oleh,\n'), right: kepsek(p, tempatTgl(p, v.tgl!), 'Disetujui,\n') },
      ]
    },
  },
  {
    id: 'ba-perbandingan', judul: 'BA Hasil Perbandingan Penyedia', kategori: 'Pengadaan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Perbandingan minimal 2 penyedia + negosiasi (Pasal 14–17).',
    fields: [
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2026-11-17' },
      { key: 'paket', label: 'Nama paket belanja', default: 'Pengadaan sarana olahraga' },
      { key: 'penyedia', label: 'Penyedia (Nama|Alamat|NPWP|Harga penawaran|Waktu kirim)', type: 'textarea', default: 'Toko A|Alamat Toko A|..............|3.255.000|7 hari\nToko B|Alamat Toko B|..............|3.400.000|10 hari' },
      { key: 'terpilih', label: 'Penyedia terpilih', default: 'Toko A' },
      { key: 'hargaNego', label: 'Harga setelah negosiasi (Rp)', type: 'number', default: '3200000' },
      { key: 'alasan', label: 'Alasan pemilihan', type: 'textarea', default: 'Harga paling rendah, spesifikasi sesuai, dan waktu penyerahan paling cepat.' },
    ],
    build: (p, v) => {
      const n = angka(v.hargaNego)
      return [
        { t: 'kop' },
        { t: 'title', text: 'BERITA ACARA HASIL PERBANDINGAN PENYEDIA' },
        { t: 'p', text: `Pada hari ini ${tglTerbilang(v.tgl!)}, telah dilakukan perbandingan penyedia untuk paket **${v.paket}** dengan hasil sebagai berikut:`, align: 'justify', indent: true },
        { t: 'table', head: ['No', 'Penyedia', 'Alamat', 'NPWP', 'Harga (Rp)', 'Waktu'], widths: [6, 22, 20, 20, 17, 15], rows: kolom(v.penyedia).map((r, i) => [String(i + 1), r[0] || '', r[1] || '', r[2] || '', r[3] || '', r[4] || '']) },
        { t: 'p', text: `Setelah dilakukan negosiasi, ditetapkan **${v.terpilih}** sebagai penyedia dengan harga ${rupiah(n)} (${terbilang(n)} Rupiah).`, align: 'justify', indent: true },
        { t: 'p', text: `Alasan: ${v.alasan}`, align: 'justify' },
        { t: 'sign', left: bendahara(p, ' ', 'Pelaksana,\n'), right: kepsek(p, tempatTgl(p, v.tgl!), 'Menetapkan,\n') },
      ]
    },
  },
  {
    id: 'ba-serah-terima', judul: 'BA Pemeriksaan & Serah Terima Barang/Jasa', kategori: 'Pengadaan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Bukti pemeriksaan & penerimaan (Pasal 20–22, 24).',
    fields: [
      { key: 'tgl', label: 'Tanggal serah terima', type: 'date', default: '2026-11-24' },
      { key: 'penyedia', label: 'Nama penyedia', default: 'Toko A' },
      { key: 'wakil', label: 'Nama wakil penyedia', default: '' },
      { key: 'alamat', label: 'Alamat penyedia', default: '' },
      { key: 'dasar', label: 'Dasar (nomor pesanan/perjanjian)', default: 'Surat Pesanan Nomor ......' },
      itemsField('Bola voli|Ukuran 5, bahan sintetis|3|buah|185000\nBola sepak anak|Ukuran 4|4|buah|150000\nMatras senam|180x60x5 cm|2|lembar|450000'),
    ],
    build: (p, v) => {
      const { r, total } = itemRows(v)
      return [
        { t: 'kop' },
        { t: 'title', text: 'BERITA ACARA PEMERIKSAAN DAN SERAH TERIMA BARANG/JASA' },
        { t: 'p', text: `Pada hari ini ${tglTerbilang(v.tgl!)}, kami yang bertanda tangan di bawah ini:`, align: 'justify' },
        { t: 'meta', rows: [['Pihak Pertama', `${isi(v.wakil)}, mewakili ${v.penyedia}, ${v.alamat}`], ['Pihak Kedua', `${p.kepsek}, Kepala ${S(p)}`]] },
        { t: 'p', text: `Berdasarkan ${v.dasar}, Pihak Pertama menyerahkan dan Pihak Kedua telah memeriksa serta menerima barang/jasa berikut dalam keadaan baik dan sesuai spesifikasi:`, align: 'justify' },
        { t: 'table', head: ['No', 'Barang/Jasa', 'Spesifikasi', 'Jml', 'Satuan', 'Jumlah (Rp)', 'Kondisi'], widths: [5, 20, 25, 7, 10, 18, 15], rows: [
          ...r.map((x, i) => [String(i + 1), x[0] || '', x[1] || '', x[2] || '', x[3] || '', (angka(x[2]) * angka(x[4])).toLocaleString('id-ID'), 'Baik']),
          ['', '**TOTAL**', '', '', '', `**${total.toLocaleString('id-ID')}**`, ''],
        ] },
        { t: 'p', text: 'Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.', indent: true },
        { t: 'sign', left: { atas: ' ', jabatan: `Pihak Pertama,\n${v.penyedia}`, nama: isi(v.wakil) }, right: kepsek(p, tempatTgl(p, v.tgl!), 'Pihak Kedua,\n') },
      ]
    },
  },
  {
    id: 'kuitansi', judul: 'Kuitansi Pembayaran', kategori: 'Keuangan', peran: ['bendahara'],
    deskripsi: 'Kuitansi dengan terbilang otomatis & kolom TTD tiga pihak.',
    fields: [
      { key: 'no', label: 'Nomor kuitansi', default: '001/BOSP/XI/2026' },
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2026-11-24' },
      { key: 'jumlah', label: 'Jumlah (Rp)', type: 'number', default: '3200000' },
      { key: 'untuk', label: 'Untuk pembayaran', type: 'textarea', default: 'Pembelian sarana olahraga (bola voli 3 buah, bola sepak anak 4 buah, matras senam 2 lembar) untuk kegiatan ekstrakurikuler, sesuai RKAS BOSP TA 2026.' },
      { key: 'penerima', label: 'Nama penerima', default: '' },
      { key: 'pajak', label: 'Pajak dipotong/dipungut (opsional)', default: '' },
    ],
    build: (p, v) => {
      const n = angka(v.jumlah)
      return [
        { t: 'title', text: 'KUITANSI', sub: `No. ${v.no}` },
        { t: 'meta', rows: [['Sudah terima dari', `Bendahara BOSP ${S(p)}`], ['Uang sebanyak', `**${terbilang(n)} Rupiah**`], ['Untuk pembayaran', v.untuk!], ...(v.pajak ? [['Pajak', v.pajak] as [string, string]] : [])] },
        { t: 'p', text: `**Jumlah: ${rupiah(n)},-**`, align: 'left' },
        { t: 'sign', left: kepsek(p, ' ', 'Setuju dibayar,\n'), center: bendahara(p, ' ', 'Lunas dibayar,\n'), right: { atas: tempatTgl(p, v.tgl!), jabatan: 'Yang menerima,', nama: isi(v.penerima), meterai: n >= 5000000 } },
      ]
    },
  },
  {
    id: 'sptjm', judul: 'SPTJM Penggunaan Dana BOSP', kategori: 'Keuangan', peran: ['kepsek', 'bendahara'],
    deskripsi: 'Surat Pernyataan Tanggung Jawab Mutlak untuk laporan tahap/tahunan.',
    fields: [
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2027-01-20' },
      { key: 'periode', label: 'Periode laporan', default: 'Tahun Anggaran 2026' },
      { key: 'terima', label: 'Total dana diterima (Rp)', type: 'number', default: '0' },
      { key: 'realisasi', label: 'Total realisasi (Rp)', type: 'number', default: '0' },
    ],
    build: (p, v) => {
      const a = angka(v.terima), b = angka(v.realisasi)
      return [
        { t: 'kop' },
        { t: 'title', text: 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK', sub: 'PENGGUNAAN DANA BOSP' },
        { t: 'p', text: 'Yang bertanda tangan di bawah ini:' },
        { t: 'meta', rows: [['Nama', p.kepsek], ['NIP', p.nipKepsek], ['Jabatan', `Kepala ${S(p)}`], ['NPSN', p.npsn]] },
        { t: 'p', text: `menyatakan bertanggung jawab penuh atas penggunaan dana BOSP Reguler ${v.periode} dengan rincian:`, align: 'justify' },
        { t: 'table', head: ['Uraian', 'Jumlah (Rp)'], widths: [65, 35], rows: [['Dana diterima', a.toLocaleString('id-ID')], ['Realisasi penggunaan', b.toLocaleString('id-ID')], ['**Sisa dana**', `**${(a - b).toLocaleString('id-ID')}**`]] },
        { t: 'list', style: 'num', items: [
          'Penggunaan dana sesuai RKAS yang disahkan dan Permendikdasmen Nomor 8 Tahun 2026.',
          'Bukti pengeluaran disimpan lengkap untuk keperluan pemeriksaan.',
          'Kewajiban perpajakan telah dipotong/dipungut dan disetor sesuai ketentuan.',
          'Apabila di kemudian hari terdapat kerugian negara, saya bersedia bertanggung jawab sesuai ketentuan peraturan perundang-undangan.',
        ] },
        { t: 'sign', right: { ...kepsek(p, tempatTgl(p, v.tgl!)), meterai: true } },
      ]
    },
  },
  {
    id: 'papan-informasi', judul: 'Pengumuman Penggunaan Dana BOSP', kategori: 'Keuangan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Untuk papan informasi sekolah (transparansi).',
    fields: [
      { key: 'tgl', label: 'Tanggal', type: 'date', default: '2026-11-15' },
      { key: 'ta', label: 'Tahun anggaran', default: '2026' },
      { key: 'tahap1', label: 'Penerimaan tahap I (Rp)', type: 'number', default: '0' },
      { key: 'tahap2', label: 'Penerimaan tahap II (Rp)', type: 'number', default: '0' },
      { key: 'rincian', label: 'Komponen (Uraian|Rencana|Realisasi)', type: 'textarea', default: 'Pengembangan perpustakaan|0|0\nKegiatan pembelajaran dan ekstrakurikuler|0|0\nKegiatan asesmen/evaluasi|0|0\nAdministrasi kegiatan sekolah|0|0\nPengembangan profesi GTK|0|0\nLangganan daya dan jasa|0|0\nPemeliharaan sarana dan prasarana|0|0\nPembayaran honor|0|0' },
    ],
    build: (p, v) => {
      const r = kolom(v.rincian)
      const rr = r.reduce((s, x) => s + angka(x[1]), 0), re = r.reduce((s, x) => s + angka(x[2]), 0)
      return [
        { t: 'kop' },
        { t: 'title', text: 'PENGUMUMAN', sub: `RENCANA DAN REALISASI PENGGUNAAN DANA BOSP REGULER\nTAHUN ANGGARAN ${v.ta}` },
        { t: 'meta', rows: [['Penerimaan tahap I', rupiah(angka(v.tahap1))], ['Penerimaan tahap II', rupiah(angka(v.tahap2))], ['Total penerimaan', `**${rupiah(angka(v.tahap1) + angka(v.tahap2))}**`]] },
        { t: 'table', head: ['No', 'Komponen', 'Rencana (Rp)', 'Realisasi (Rp)'], widths: [7, 49, 22, 22], rows: [
          ...r.map((x, i) => [String(i + 1), x[0] || '', angka(x[1]).toLocaleString('id-ID'), angka(x[2]).toLocaleString('id-ID')]),
          ['', '**JUMLAH**', `**${rr.toLocaleString('id-ID')}**`, `**${re.toLocaleString('id-ID')}**`],
        ] },
        { t: 'p', text: 'Masyarakat dapat menyampaikan pertanyaan atau pengaduan kepada kepala sekolah atau Komite Sekolah.', italic: true },
        { t: 'sign', left: bendahara(p, ' '), right: kepsek(p, tempatTgl(p, v.tgl!)) },
      ]
    },
  },
  {
    id: 'daftar-honor', judul: 'Daftar Penerimaan Honorarium (PPh 21 TER)', kategori: 'Keuangan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Daftar tanda terima honor bulanan dengan perhitungan otomatis PPh 21 TER dan jumlah bersih.',
    fields: [
      { key: 'tgl', label: 'Tanggal pembayaran', type: 'date', default: '2026-11-15' },
      { key: 'bulan', label: 'Bulan / periode', default: 'November 2026' },
      { key: 'kegiatan', label: 'Nama kegiatan / mata anggaran', default: 'Pembayaran Honorarium Guru Tidak Tetap / Tenaga Kependidikan' },
      { key: 'daftar', label: 'Penerima (Nama|Jabatan/NUPTK|Bruto|Tarif PPh %)', type: 'textarea', default: 'Nama Penerima Honor|Guru Agama Islam / NUPTK|1500000|0', hint: 'Tarif PPh 21 TER kategori A: 0% untuk bruto s.d. Rp5.400.000/bulan (sesuai PP 58/2023).' },
    ],
    build: (p, v) => {
      const rows = kolom(v.daftar).map((x, i) => {
        const bruto = angka(x[2])
        const tarif = Number(String(x[3] || '0').replace(/[^\d.]/g, '')) || 0
        const pph = Math.round(bruto * tarif / 100)
        const bersih = bruto - pph
        return { no: String(i + 1), nama: x[0] || '', jabatan: x[1] || '', bruto, tarif, pph, bersih }
      })
      const totBruto = rows.reduce((s, r) => s + r.bruto, 0)
      const totPph = rows.reduce((s, r) => s + r.pph, 0)
      const totBersih = rows.reduce((s, r) => s + r.bersih, 0)
      return [
        { t: 'kop' },
        { t: 'title', text: 'DAFTAR PENERIMAAN HONORARIUM', sub: `BULAN ${String(v.bulan || '').toUpperCase()}` },
        { t: 'meta', rows: [['Satuan Pendidikan', p.sekolah], ['NPSN', p.npsn], ['Kegiatan', v.kegiatan || ''], ['Sumber Dana', 'Dana BOSP Reguler']] },
        {
          t: 'table',
          head: ['No', 'Nama', 'Jabatan / NUPTK', 'Bruto (Rp)', 'PPh 21 TER', 'Diterima (Rp)', 'Tanda Tangan'],
          widths: [6, 20, 22, 13, 13, 14, 12],
          tall: true,
          rows: [
            ...rows.map(r => [r.no, r.nama, r.jabatan, r.bruto.toLocaleString('id-ID'), `${r.pph.toLocaleString('id-ID')} (${r.tarif}%)`, r.bersih.toLocaleString('id-ID'), `${r.no}.`]),
            ['', '**JUMLAH**', '', `**${totBruto.toLocaleString('id-ID')}**`, `**${totPph.toLocaleString('id-ID')}**`, `**${totBersih.toLocaleString('id-ID')}**`, ''],
          ],
        },
        { t: 'p', text: `Terbilang dibayarkan bersih: **${terbilang(totBersih)} Rupiah**.`, italic: true },
        { t: 'sign', left: kepsek(p, 'Mengetahui/Menyetujui,', ''), right: bendahara(p, tempatTgl(p, v.tgl!), 'Lunas dibayar,\n') },
      ]
    },
  },
  {
    id: 'spj-honor', judul: 'SPJ Pembayaran Honorarium', kategori: 'Keuangan', peran: ['bendahara', 'kepsek'],
    deskripsi: 'Rekapitulasi pertanggungjawaban belanja honorarium bulanan beserta potongan pajak untuk arsip BOSP.',
    fields: [
      { key: 'tgl', label: 'Tanggal SPJ', type: 'date', default: '2026-11-15' },
      { key: 'nomor', label: 'Nomor bukti / BKU', default: 'BKU-011/2026' },
      { key: 'bulan', label: 'Bulan / periode', default: 'November 2026' },
      { key: 'kodeRekening', label: 'Kode rekening ARKAS', default: '5.1.02.02.01.0013' },
      { key: 'uraian', label: 'Uraian belanja', default: 'Belanja Jasa Tenaga Pendidikan (Honorarium GTT/PTT)' },
      { key: 'bruto', label: 'Jumlah bruto (Rp)', type: 'number', default: '1500000' },
      { key: 'pph21', label: 'Potongan PPh 21 TER (Rp)', type: 'number', default: '0' },
      { key: 'kodeBilling', label: 'Nomor NTPN / kode billing (jika ada)', default: '-' },
    ],
    build: (p, v) => {
      const bruto = angka(v.bruto)
      const pph = angka(v.pph21)
      const bersih = bruto - pph
      return [
        { t: 'kop' },
        { t: 'title', text: 'SURAT PERTANGGUNGJAWABAN (SPJ) HONORARIUM', sub: `Nomor: ${v.nomor}` },
        { t: 'p', text: `Yang bertanda tangan di bawah ini Bendahara BOSP ${S(p)} menyatakan bahwa telah dilakukan pembayaran honorarium untuk periode **${v.bulan}** dengan rincian sebagai berikut:` },
        { t: 'meta', rows: [
          ['Kode Rekening', v.kodeRekening || ''],
          ['Uraian Belanja', v.uraian || ''],
          ['Jumlah Bruto', rupiah(bruto)],
          ['Potongan PPh 21 TER', rupiah(pph)],
          ['Jumlah Dibayarkan Bersih', `**${rupiah(bersih)}** (${terbilang(bersih)} Rupiah)`],
          ['Kode Billing / NTPN', v.kodeBilling || '-'],
        ] },
        { t: 'p', text: 'Lampiran kelengkapan SPJ:' },
        { t: 'list', style: 'num', items: [
          'SK Kepala Sekolah tentang Penugasan / Pembagian Tugas Mengajar.',
          'Daftar Penerimaan Honorarium yang ditandatangani masing-masing penerima.',
          'Daftar hadir / rekapitulasi jam kerja periode berkenaan.',
          'Bukti potong PPh 21 (e-Bupot Coretax DJP) dan bukti setor pajak (jika terutang).',
        ] },
        { t: 'sign', left: kepsek(p, 'Mengetahui/Menyetujui,\n', ''), right: bendahara(p, tempatTgl(p, v.tgl!)) },
      ]
    },
  },
]

export const templates: Template[] = [...rkas, ...skTemplates, ...dapodik, ...keuangan]

export const paket: Paket[] = [
  {
    id: 'paket-rkas',
    judul: 'Paket Dokumen Rapat RKAS Lengkap',
    deskripsi: 'Undangan + lampiran, daftar hadir, notulen, berita acara, lembar pengesahan, dan dokumentasi dalam satu file Word.',
    isi: ['rkas-undangan', 'rkas-daftar-hadir', 'rkas-notulen', 'rkas-berita-acara', 'rkas-pengesahan', 'rkas-dokumentasi'],
    fields: rkasFields,
  },
]

export function cariDokumen(id: string) {
  const t = templates.find(x => x.id === id)
  if (t) return { judul: t.judul, deskripsi: t.deskripsi, fields: t.fields, build: t.build, paket: false }
  const k = paket.find(x => x.id === id)
  if (!k) return null
  return {
    judul: k.judul, deskripsi: k.deskripsi, fields: k.fields, paket: true,
    build: (p: Profil, v: Values) => k.isi.flatMap((tid, i) => {
      const blocks = templates.find(x => x.id === tid)!.build(p, v)
      return i === 0 ? blocks : [{ t: 'break' } as Block, ...blocks]
    }),
  }
}

export function nilaiAwal(fields: Field[], p: Profil): Values {
  return Object.fromEntries(fields.map(f => [f.key, typeof f.default === 'function' ? f.default(p) : (f.default ?? '')]))
}

