export type Peran = 'operator' | 'kepsek' | 'bendahara'
export type Fase = 'semester' | 'tahun-ajaran' | 'genap' | 'tahun-anggaran' | 'rutin'
export type Semester = 'ganjil' | 'genap'

export interface Item {
  id: string
  judul: string
  detail?: string
  aplikasi?: string
  dasar?: string // id regulasi
  tenggat?: string
  template?: string // id template
}

export interface Kelompok {
  id: string
  judul: string
  fase: Fase
  items: Item[]
}

export const peranInfo: Record<Peran, { nama: string, icon: string, deskripsi: string }> = {
  kepsek: { nama: 'Kepala Sekolah', icon: 'i-lucide-user-round-check', deskripsi: 'PBD, RKT/RKAS, SK, kinerja, pengesahan' },
  operator: { nama: 'Operator Sekolah', icon: 'i-lucide-monitor-cog', deskripsi: 'Dapodik, Info GTK, data siswa & rombel' },
  bendahara: { nama: 'Bendahara BOSP', icon: 'i-lucide-wallet', deskripsi: 'ARKAS, BKU, pajak, bukti belanja, laporan' },
}

export const faseInfo: Record<Fase, { label: string, tampil: Semester[], color: string }> = {
  'semester': { label: 'Setiap awal semester', tampil: ['ganjil', 'genap'], color: 'primary' },
  'tahun-ajaran': { label: 'Awal tahun ajaran (Juli–Agustus)', tampil: ['ganjil'], color: 'info' },
  'genap': { label: 'Awal semester genap (Januari)', tampil: ['genap'], color: 'secondary' },
  'tahun-anggaran': { label: 'Awal tahun anggaran (Januari)', tampil: ['genap'], color: 'warning' },
  'rutin': { label: 'Rutin & tenggat', tampil: ['ganjil', 'genap'], color: 'neutral' },
}

export const checklists: Record<Peran, Kelompok[]> = {
  /* ───────────────────────── OPERATOR ───────────────────────── */
  operator: [
    {
      id: 'op-persiapan', judul: 'Persiapan aplikasi & akun', fase: 'semester', items: [
        { id: 'op-se', judul: 'Baca surat edaran rilis Dapodik versi semester ini', detail: 'Pantau dapo.kemendikdasmen.go.id dan surat dinas kabupaten. Catat apakah rilisnya installer penuh atau patch.', aplikasi: 'Dapodik', dasar: 'dapodik' },
        { id: 'op-backup', judul: 'Backup database Dapodik sebelum update/uninstall', aplikasi: 'Dapodik' },
        { id: 'op-install', judul: 'Instal versi terbaru (uninstall dulu jika installer penuh)', detail: 'Semester ganjil 2026/2027: Dapodik 2027 + patch 2027.a + 2027.b.', aplikasi: 'Dapodik', dasar: 'dapodik' },
        { id: 'op-sdm', judul: 'Pastikan akun operator terdaftar & surat tugas diperbarui di sdm.data.kemdikbud.go.id', aplikasi: 'SDM Data', dasar: 'dapodik', template: 'sk-operator' },
        { id: 'op-registrasi', judul: 'Registrasi (online/prefill), login, pilih semester yang benar, cek nomor versi di beranda', aplikasi: 'Dapodik' },
      ],
    },
    {
      id: 'op-data', judul: 'Pemutakhiran data', fase: 'semester', items: [
        { id: 'op-sekolah', judul: 'Data sekolah: identitas, kepala sekolah, rekening, listrik & internet', aplikasi: 'Dapodik' },
        { id: 'op-sarpras', judul: 'Sarana prasarana: kondisi ruang, kerusakan, perolehan baru', aplikasi: 'Dapodik' },
        { id: 'op-bmd', judul: 'Alat & barang tiap ruang/kelas: cocokkan jumlah meja, kursi, dan inventaris dengan data BMD / bendahara', detail: 'Pastikan jumlah barang di setiap kelas/ruang pada Dapodik sama dengan catatan aset BMD dan data belanja barang dari bendahara.', aplikasi: 'Dapodik', dasar: 'dapodik' },
        { id: 'op-ptk', judul: 'PTK: penugasan, mutasi masuk/keluar, riwayat pendidikan, pangkat, sertifikasi', aplikasi: 'Dapodik' },
        { id: 'op-rombel', judul: 'Rombel: wali kelas, pembelajaran & jam mengajar tiap guru, tugas tambahan', detail: 'Cocokkan dengan SK Pembagian Tugas Mengajar. Guru sertifikasi wajib memenuhi beban 24 JTM.', aplikasi: 'Dapodik', template: 'sk-pembagian-tugas' },
        { id: 'op-anggota', judul: 'Anggota rombel: cocokkan dengan daftar wali kelas', detail: 'Siswa pindah kelas paling sering masih tercatat di rombel lama.', aplikasi: 'Dapodik' },
        { id: 'op-rangkap', judul: 'Kelas rangkap (jika ada)', aplikasi: 'Dapodik' },
        { id: 'op-mutasi', judul: 'Peserta didik mutasi masuk/keluar & yang keluar (putus sekolah)', aplikasi: 'Dapodik' },
        { id: 'op-pip', judul: 'Usulan & kelayakan PIP, KIP, data KKS/PKH', aplikasi: 'Dapodik' },
      ],
    },
    {
      id: 'op-validasi', judul: 'Validasi, sinkron & verifikasi', fase: 'semester', items: [
        { id: 'op-val', judul: 'Jalankan validasi; perbaiki semua invalid (merah) dan peringatan (kuning)', aplikasi: 'Dapodik' },
        { id: 'op-sinkron', judul: 'Sinkronisasi & cek hasil di Manajemen Dapodik / Sekolah Kita', aplikasi: 'Dapodik' },
        { id: 'op-infogtk', judul: 'Minta semua guru cek Info GTK; tindak lanjuti status "Belum Valid"', detail: '"Belum Ada Data" berarti sinkron awal semester belum dilakukan.', aplikasi: 'Info GTK' },
        { id: 'op-vervalpd', judul: 'Verval PD / NISN untuk data yang residu', aplikasi: 'Verval PD' },
        { id: 'op-pernyataan', judul: 'Cetak & arsipkan surat pernyataan kebenaran data bertanda tangan kepala sekolah', template: 'pernyataan-dapodik' },
        { id: 'op-erapor', judul: 'Siapkan data e-Rapor dari Dapodik (rombel, mapel, siswa)', aplikasi: 'e-Rapor' },
      ],
    },
    {
      id: 'op-ta', judul: 'Khusus awal tahun ajaran', fase: 'tahun-ajaran', items: [
        { id: 'op-naik', judul: 'Proses kenaikan kelas dan tinggal kelas (prioritaskan PD status naik kelas)', aplikasi: 'Dapodik' },
        { id: 'op-lulus', judul: 'Keluarkan siswa kelas 6 yang lulus; isi nomor ijazah', aplikasi: 'Dapodik' },
        { id: 'op-pdbaru', judul: 'Input siswa baru kelas 1 melalui Aplikasi Manajemen Satuan Pendidikan', detail: 'Penambahan PD baru PAUD & SD tidak lagi langsung di aplikasi Dapodik.', aplikasi: 'Manajemen Satuan Pendidikan', dasar: 'dapodik' },
        { id: 'op-nik', judul: 'Cek NIK, NISN, KK, akta kelahiran siswa baru', aplikasi: 'Dapodik' },
        { id: 'op-rombelbaru', judul: 'Bentuk rombel tahun ajaran baru', aplikasi: 'Dapodik' },
        { id: 'op-daya', judul: 'Isi daya tampung sekolah di beranda (sekolah negeri)', aplikasi: 'Dapodik' },
        { id: 'op-gtkbaru', judul: 'Tambah GTK baru / keluarkan yang pensiun-mutasi', aplikasi: 'Dapodik' },
        { id: 'op-cutoff', judul: 'Pastikan data final sebelum cut-off 31 Agustus (dasar alokasi BOSP tahun depan)', tenggat: '31 Agustus', dasar: 'dapodik' },
        { id: 'op-prokja', judul: 'Susun program kerja operator untuk satu tahun pelajaran' },
      ],
    },
    {
      id: 'op-genap', judul: 'Khusus awal semester genap', fase: 'genap', items: [
        { id: 'op-periodik2', judul: 'Update data periodik kedua siswa (tinggi/berat badan, jarak, dll.)', aplikasi: 'Dapodik' },
        { id: 'op-mutasilibur', judul: 'Cek siswa mutasi selama libur semester', aplikasi: 'Dapodik' },
        { id: 'op-calonlulus', judul: 'Siapkan data calon lulusan kelas 6 (asesmen & ijazah)', aplikasi: 'Dapodik' },
      ],
    },
    {
      id: 'op-rutin', judul: 'Rutin', fase: 'rutin', items: [
        { id: 'op-sinkronbulan', judul: 'Sinkron ulang setiap ada perubahan data (minimal sebulan sekali)', aplikasi: 'Dapodik' },
        { id: 'op-arsip', judul: 'Arsipkan bukti sinkron & laporan kegiatan operator per bulan' },
      ],
    },
  ],

  /* ───────────────────────── KEPALA SEKOLAH ───────────────────────── */
  kepsek: [
    {
      id: 'ks-semester', judul: 'Manajemen awal semester', fase: 'semester', items: [
        { id: 'ks-sktugas', judul: 'Tetapkan SK Pembagian Tugas Mengajar & tugas tambahan semester ini', template: 'sk-pembagian-tugas' },
        { id: 'ks-rapat', judul: 'Rapat dewan guru awal semester (program, jadwal, supervisi)' },
        { id: 'ks-dapodik', judul: 'Periksa data Dapodik bersama operator & tanda tangani pernyataan kebenaran data', template: 'pernyataan-dapodik', dasar: 'dapodik' },
        { id: 'ks-kinerja-rencana', judul: 'Pengelolaan kinerja: perencanaan SKP guru (dialog kinerja) & SKP kepala sekolah di Ruang GTK', aplikasi: 'Ruang GTK', dasar: 'kinerja' },
        { id: 'ks-supervisi', judul: 'Jadwalkan observasi/supervisi kelas', aplikasi: 'Ruang GTK', dasar: 'kinerja' },
        { id: 'ks-infogtk', judul: 'Pastikan Info GTK semua guru valid (tunjangan profesi)', aplikasi: 'Info GTK' },
      ],
    },
    {
      id: 'ks-ta', judul: 'Khusus awal tahun ajaran', fase: 'tahun-ajaran', items: [
        { id: 'ks-spmb', judul: 'SPMB/PPDB: SK panitia, daya tampung, pengumuman', aplikasi: 'SPMB' },
        { id: 'ks-mpls', judul: 'Program MPLS ramah anak', },
        { id: 'ks-kaldik', judul: 'Tetapkan kalender pendidikan sekolah (mengacu kaldik provinsi)' },
        { id: 'ks-kosp', judul: 'Review Kurikulum Operasional Satuan Pendidikan (KOSP)' },
        { id: 'ks-skops', judul: 'Perbarui SK Operator Dapodik', template: 'sk-operator' },
        { id: 'ks-rapor', judul: 'Unduh Rapor Pendidikan terbaru & lakukan PBD (identifikasi–refleksi–benahi)', aplikasi: 'Rapor Pendidikan', dasar: 'rapor' },
        { id: 'ks-komite', judul: 'Rapat dengan komite & orang tua awal tahun ajaran' },
      ],
    },
    {
      id: 'ks-genap', judul: 'Khusus awal semester genap', fase: 'genap', items: [
        { id: 'ks-penilaian', judul: 'Selesaikan penilaian kinerja periode sebelumnya & sinkron ke e-Kinerja BKN', aplikasi: 'Ruang GTK / e-Kinerja', dasar: 'kinerja' },
        { id: 'ks-asesmen', judul: 'Rencanakan asesmen akhir & kelulusan kelas 6' },
      ],
    },
    {
      id: 'ks-ta-anggaran', judul: 'Awal tahun anggaran: RKT & RKAS', fase: 'tahun-anggaran', items: [
        { id: 'ks-skbosp', judul: 'Tetapkan SK Tim Pengelola Dana BOSP (kepsek, bendahara, anggota, unsur komite)', template: 'sk-tim-bosp', dasar: 'arkas' },
        { id: 'ks-rkt', judul: 'Susun RKT berbasis prioritas Rapor Pendidikan', dasar: 'rapor' },
        { id: 'ks-undangan', judul: 'Undang GTK DAN komite sekolah ke rapat RKAS', detail: 'Dokumen RKAS yang lama tidak mengundang komite. RKAS wajib memperhatikan pertimbangan komite.', template: 'rkas-undangan', dasar: 'arkas' },
        { id: 'ks-rapatrkas', judul: 'Laksanakan rapat RKAS: daftar hadir bertanda tangan, notulen, dokumentasi', template: 'rkas-daftar-hadir' },
        { id: 'ks-ba', judul: 'Tanda tangani Berita Acara (kepsek + komite + perwakilan guru)', template: 'rkas-berita-acara' },
        { id: 'ks-batas', judul: 'Cek batas komponen: honor ≤20% (negeri), buku ≥10%, pemeliharaan ≤20%', dasar: 'bosp' },
        { id: 'ks-mbg', judul: 'Pastikan tidak ada anggaran bahan pangan MBG atau rehab sedang/berat', dasar: 'bosp' },
        { id: 'ks-sahkan', judul: 'Ajukan pengesahan RKAS di ARKAS ke dinas & tanda tangani lembar pengesahan', aplikasi: 'ARKAS 4', template: 'rkas-pengesahan', dasar: 'arkas' },
        { id: 'ks-skp', judul: 'Susun SKP tahunan kepala sekolah di Ruang GTK', aplikasi: 'Ruang GTK', dasar: 'kinerja' },
      ],
    },
    {
      id: 'ks-rutin', judul: 'Rutin & pengawasan keuangan', fase: 'rutin', items: [
        { id: 'ks-kas', judul: 'Periksa kas bendahara tiap akhir bulan & tanda tangani BA pemeriksaan kas', template: 'ba-pemeriksaan-kas' },
        { id: 'ks-pbj', judul: 'Setujui belanja: persiapan → bandingkan ≥2 penyedia → serah terima', dasar: 'pbj', template: 'persiapan-pengadaan' },
        { id: 'ks-publikasi', judul: 'Umumkan rencana & realisasi dana BOSP di papan informasi sekolah', template: 'papan-informasi' },
        { id: 'ks-lap1', judul: 'Setujui laporan tahap I', tenggat: '31 Juli', dasar: 'bosp' },
        { id: 'ks-laptahun', judul: 'Setujui laporan keseluruhan & SPTJM', tenggat: '31 Januari', dasar: 'bosp', template: 'sptjm' },
      ],
    },
  ],

  /* ───────────────────────── BENDAHARA ───────────────────────── */
  bendahara: [
    {
      id: 'bd-semester', judul: 'Awal semester', fase: 'semester', items: [
        { id: 'bd-realisasi', judul: 'Rekap realisasi semester lalu vs RKAS', aplikasi: 'ARKAS 4' },
        { id: 'bd-pergeseran', judul: 'Ajukan pergeseran/perubahan RKAS jika kebutuhan berubah', aplikasi: 'ARKAS 4', dasar: 'arkas' },
        { id: 'bd-honor', judul: 'Perbarui daftar penerima honor (NUPTK valid, sesuai SK)', dasar: 'bosp', template: 'daftar-honor' },
      ],
    },
    {
      id: 'bd-anggaran', judul: 'Awal tahun anggaran', fase: 'tahun-anggaran', items: [
        { id: 'bd-pagu', judul: 'Cek pagu BOSP Reguler (dasar: Dapodik cut-off 31 Agustus tahun lalu)', aplikasi: 'ARKAS 4', dasar: 'dapodik' },
        { id: 'bd-silpa', judul: 'Catat sisa dana (SiLPA) tahun lalu ke RKAS', aplikasi: 'ARKAS 4', dasar: 'bosp' },
        { id: 'bd-kertas', judul: 'Input kertas kerja per kegiatan & kode rekening, sampai nominal + pajak + ongkir', aplikasi: 'ARKAS 4', dasar: 'arkas' },
        { id: 'bd-batas', judul: 'Hitung porsi honor (≤20% negeri), buku (≥10%), pemeliharaan (≤20%)', dasar: 'bosp' },
        { id: 'bd-pengesahan', judul: 'Cetak RKAS, lembar pengesahan & paraf tim', template: 'rkas-pengesahan' },
        { id: 'bd-bku', judul: 'Aktivasi BKU setelah RKAS disahkan', aplikasi: 'ARKAS 4', dasar: 'arkas' },
        { id: 'bd-rekening', judul: 'Pastikan rekening sekolah aktif dan sesuai data Dapodik', dasar: 'bosp' },
        { id: 'bd-coretax', judul: 'Pastikan akses Coretax (impersonate NPWP instansi) & sertifikat elektronik aktif', aplikasi: 'Coretax DJP', dasar: 'pajak' },
      ],
    },
    {
      id: 'bd-belanja', judul: 'Setiap belanja (Permendikdasmen 15/2026)', fase: 'rutin', items: [
        { id: 'bd-persiapan', judul: '> Rp1 juta: buat dokumen persiapan (jumlah, spesifikasi, waktu, anggaran)', dasar: 'pbj', template: 'persiapan-pengadaan' },
        { id: 'bd-banding', judul: 'Bandingkan minimal 2 penyedia; penyedia wajib ber-NPWP', dasar: 'pbj', template: 'ba-perbandingan' },
        { id: 'bd-siplah', judul: 'Transaksi melalui SIPLah/sistem pembelanjaan kementerian bila tersedia', aplikasi: 'SIPLah', dasar: 'pbj' },
        { id: 'bd-terima', judul: 'Periksa barang & buat BA serah terima', dasar: 'pbj', template: 'ba-serah-terima' },
        { id: 'bd-kuitansi', judul: 'Simpan bukti bayar/kuitansi, faktur, foto barang', template: 'kuitansi' },
        { id: 'bd-catat', judul: 'Catat transaksi ke BKU ARKAS secara kronologis', aplikasi: 'ARKAS 4' },
      ],
    },
    {
      id: 'bd-pajak', judul: 'Pajak', fase: 'rutin', items: [
        { id: 'bd-pph21', judul: 'Potong PPh 21 atas honor & buat bukti potong', aplikasi: 'Coretax DJP', dasar: 'pajak', template: 'spj-honor' },
        { id: 'bd-pph23', judul: 'Potong PPh 23 (2%) atas jasa/sewa harta badan', aplikasi: 'Coretax DJP', dasar: 'pajak' },
        { id: 'bd-pph22', judul: 'Jangan pungut PPh 22 untuk pembelian dana BOS (dikecualikan PMK 81/2024)', dasar: 'pajak' },
        { id: 'bd-ppn', judul: 'Pungut PPN (12% × DPP 11/12) ke rekanan PKP (sekolah negeri)', aplikasi: 'Coretax DJP', dasar: 'pajak' },
        { id: 'bd-setor', judul: 'Setor pajak (kode billing) & serahkan bukti potong ke dinas/rekanan', tenggat: 'bulan berikutnya', aplikasi: 'Coretax DJP', dasar: 'pajak' },
      ],
    },
    {
      id: 'bd-laporan', judul: 'Tutup buku & laporan', fase: 'rutin', items: [
        { id: 'bd-tutupbulan', judul: 'Tutup BKU tiap akhir bulan; cocokkan saldo dengan rekening koran', aplikasi: 'ARKAS 4' },
        { id: 'bd-kas', judul: 'BA pemeriksaan kas bulanan bersama kepala sekolah', template: 'ba-pemeriksaan-kas' },
        { id: 'bd-lap1', judul: 'Laporan realisasi tahap I (realisasi ≥50% agar tahap II cair)', tenggat: '31 Juli', dasar: 'bosp' },
        { id: 'bd-laptahun', judul: 'Laporan keseluruhan tahun anggaran + hasil pengadaan', tenggat: '31 Januari', dasar: 'bosp', template: 'sptjm' },
        { id: 'bd-publik', judul: 'Tempel pengumuman penggunaan dana di papan informasi', template: 'papan-informasi' },
        { id: 'bd-arsip', judul: 'Arsipkan SPJ per kegiatan (persiapan, perbandingan, perjanjian, BA terima, bukti bayar)', dasar: 'pbj' },
      ],
    },
  ],
}

export function kelompokUntuk(peran: Peran, semester: Semester) {
  return checklists[peran].filter(k => faseInfo[k.fase].tampil.includes(semester))
}
