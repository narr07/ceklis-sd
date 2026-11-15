export interface Regulasi {
  id: string
  judul: string
  nomor: string
  ditetapkan?: string
  poin: string[]
  /** Tautan teks resmi (BPK/JDIH/kementerian). Kosong = belum ditautkan, pengguna perlu mencari salinan resmi. */
  url?: string
  /** Tanggal ringkasan item ini terakhir dicocokkan dengan sumbernya. */
  diperiksa: string
}

export const DIPERIKSA = '15 November 2026'

export const regulasi: Regulasi[] = [
  {
    id: 'bosp',
    judul: 'Petunjuk Teknis Pengelolaan Dana BOSP',
    nomor: 'Permendikdasmen No. 8 Tahun 2026',
    ditetapkan: '5 Februari 2026 (diundangkan 6 Februari 2026)',
    url: 'https://peraturan.bpk.go.id/Details/345734/permendikdasmen-no-8-tahun-2026',
    diperiksa: DIPERIKSA,
    poin: [
      'Mencabut Permendikdasmen No. 8 Tahun 2025 (Pasal 75).',
      'Prinsip: fleksibel, efektif, efisien, akuntabel, transparan (Pasal 2).',
      'BOS reguler: wajib NPSN terdata di Dapodik dan punya rekening satuan pendidikan (Pasal 8).',
      'Batas BOS reguler (Pasal 42): honor maks. 20% (negeri) / 40% (swasta), buku min. 10%, pemeliharaan sarpras maks. 20%.',
      'Sisa dana wajib dicatat dalam RKAS (Pasal 54).',
      'Laporan tahap I paling lambat 31 Juli; laporan keseluruhan paling lambat 31 Januari tahun berikutnya (Pasal 56).',
      'Penyaluran tahap II mensyaratkan realisasi tahap I minimal 50% (Pasal 58).',
      'Terlambat lapor: pengurangan dana 2%, 3%, atau 4% (Pasal 59). Lewat 25 Oktober tanpa laporan tahap I, tahap II tidak diterima; lewat 25 Juni tanpa laporan tahun lalu, dana tahun berjalan tidak diterima (Pasal 60).',
      'Larangan (Pasal 66): rekening/kepentingan pribadi, meminjamkan, memungut biaya, investasi, pemeliharaan rusak sedang/berat dan bangun ruang baru, pembiayaan ganda, bertindak sebagai distributor/pengecer.',
      'Dana BOSP tidak boleh dipakai membeli bahan pangan program MBG.',
    ],
  },
  {
    id: 'pbj',
    judul: 'Belanja Barang/Jasa Satuan Pendidikan',
    nomor: 'Permendikdasmen No. 15 Tahun 2026',
    ditetapkan: '28 Juli 2026',
    diperiksa: DIPERIKSA,
    poin: [
      'Mencabut Permendikbudristek No. 18 Tahun 2022. Belanja honor/gaji tidak termasuk (Pasal 4 ayat 3).',
      'Kepala satuan pendidikan adalah pelaksana belanja, boleh dibantu tim (Pasal 7).',
      'Empat tahap (Pasal 11): persiapan, pemilihan, pelaksanaan, pelaporan.',
      'Belanja ≤ Rp1.000.000 boleh tanpa dokumen persiapan (Pasal 12 ayat 4); bukti bayar & terima tetap wajib.',
      'Membandingkan minimal 2 penyedia (Pasal 15 ayat 1), ada pengecualian penyedia tunggal (ayat 2).',
      'Penyedia: punya NPWP, identitas jelas, mampu menyediakan (Pasal 9 ayat 2). UMKM boleh dibayar tunai/uang muka (Pasal 19 ayat 2).',
      'Bukti wajib (Pasal 24 ayat 2): dokumen persiapan, hasil perbandingan, perjanjian, BA pemeriksaan & penerimaan, bukti pembayaran.',
      'Pengawasan oleh kementerian, pemda, dan komite sekolah (Pasal 31).',
    ],
  },
  {
    id: 'arkas',
    judul: 'Panduan ARKAS 4 & Penyusunan RKAS',
    nomor: 'Buku Panduan ARKAS 4',
    url: 'https://arkas.kemdikbud.go.id',
    diperiksa: DIPERIKSA,
    poin: [
      'RKJM, RKT, dan RKAS disetujui dalam rapat dewan guru setelah memperhatikan pertimbangan Komite Sekolah dan disahkan dinas pendidikan.',
      'Pengguna ARKAS: kepala sekolah, bendahara, dan komite sekolah yang tergabung dalam Tim BOSP.',
      'Kertas kerja disusun sampai nominal (termasuk pajak, biaya admin, ongkos kirim); kertas kerja yang sudah disahkan disebut RKAS.',
      'Alur: aktivasi kertas kerja → ajukan pengesahan → aktivasi BKU → penatausahaan → tutup BKU; pergeseran/perubahan sesuai ketentuan.',
    ],
  },
  {
    id: 'pajak',
    judul: 'Kewajiban Pajak Bendahara BOS (Coretax DJP)',
    nomor: 'PMK 81/2024 & ketentuan PPh/PPN',
    diperiksa: DIPERIKSA,
    poin: [
      'Bendahara memotong/memungut, menyetor, membuat bukti potong (e-Bupot Coretax) untuk PPh 21, PPh 23, PPh 4(2).',
      'Pembelian dengan dana BOS dikecualikan dari pemungutan PPh 22 (PMK 81/2024 Pasal 219 ayat 1 huruf e).',
      'PPh 23 jasa/sewa harta: 2% dari nilai transaksi. PPN: 12% × DPP nilai lain 11/12.',
      'Untuk sekolah negeri, SPT Masa sering dilaporkan oleh instansi induk (Dinas Pendidikan). Bukti potong tetap wajib dibuat bendahara.',
      'Setor dan lapor sesuai tenggat PMK 81/2024; konfirmasi jadwal dengan KPP/dinas setempat.',
    ],
  },
  {
    id: 'dapodik',
    judul: 'Pemutakhiran Dapodik',
    nomor: 'SE Dirjen PAUD Dikdasmen tiap rilis versi',
    url: 'https://dapo.kemendikdasmen.go.id/unduhan',
    diperiksa: DIPERIKSA,
    poin: [
      'Semester ganjil 2026/2027 memakai Dapodik 2027 (18 Juli 2026), patch 2027.a (13 Agustus 2026), dan 2027.b.',
      'Penambahan peserta didik baru PAUD & SD melalui Aplikasi Manajemen Satuan Pendidikan.',
      'Operator wajib terdaftar dan surat tugasnya diperbarui di sdm.data.kemdikbud.go.id.',
      'Alokasi BOSP tahun berikutnya dihitung dari data Dapodik cut-off 31 Agustus.',
      'Installer penuh: uninstall versi lama (backup dulu). Patch: tidak perlu uninstall.',
    ],
  },
  {
    id: 'kinerja',
    judul: 'Pengelolaan Kinerja Guru & Kepala Sekolah',
    nomor: 'Kepdirjen GTK 5539/B.B1/HK.03.01/2024; Kepmendikdasmen 271/O/2025',
    diperiksa: DIPERIKSA,
    poin: [
      'Dilakukan di Ruang GTK (akun belajar.id) dan disinkronkan ke e-Kinerja BKN.',
      'Siklus: perencanaan (SKP + dialog kinerja) → pelaksanaan & dokumentasi → penilaian, umumnya per semester.',
      'Kepala sekolah adalah pejabat penilai kinerja guru; kepala dinas menilai kepala sekolah.',
    ],
  },
  {
    id: 'rapor',
    judul: 'Rapor Pendidikan & Perencanaan Berbasis Data (PBD)',
    nomor: 'Platform Rapor Pendidikan',
    url: 'https://raporpendidikan.kemendikdasmen.go.id',
    diperiksa: DIPERIKSA,
    poin: [
      'Hasil Asesmen Nasional menjadi dasar PBD: identifikasi, refleksi, benahi.',
      'Prioritas PBD dituangkan dalam RKT dan RKAS.',
      'Diunduh dengan akun belajar.id kepala sekolah.',
    ],
  },
]
