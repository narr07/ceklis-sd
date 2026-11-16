# Changelog

## Belum dirilis
- **Simpan PDF** di template dokumen, SK Beban Mengajar & Jadwal, dan Daftar 1. Di aplikasi desktop, PDF dibuat langsung oleh WebView2 (`Page.printToPDF`) sehingga sama dengan pratinjau, termasuk halaman lanskap Lampiran I–II dan margin seperti file .docx; lokasi simpan dipilih lewat dialog Windows. Di peramban, tombol membuka dialog cetak ("Simpan sebagai PDF").
- **Google Drive sekolah** (Profil → Database): hubungkan akun Google sekolah lewat browser (OAuth loopback + PKCE, izin hanya `drive.file`). Token tersimpan di Windows Credential Manager. Tombol **Simpan ke Drive** di template dokumen, SK Beban Mengajar & Jadwal, dan Daftar 1 menyimpan PDF/Word/Excel ke `Ceklis SD/Dokumen/<periode>`; berkas bernama sama diperbarui, tidak digandakan.
- **Sinkron database lewat Google Drive**: database dienkripsi di komputer (Argon2id + XChaCha20-Poly1305) dengan kata sandi sekolah sebelum diunggah. Ambil dari Drive membuat backup lokal dulu; perubahan dari komputer lain terdeteksi sebagai konflik dengan pilihan ambil/timpa. Di komputer baru, NPSN bisa diketik untuk mencari salinan database.
- **Perbarui SPTJM** untuk tahun ajaran baru: bila sudah ada SPTJM, impor PDF baru menampilkan ringkasan perubahan dulu (siswa baru per kelas, lulus kelas 6, keluar/mutasi, naik kelas, pindah rombel, GTK masuk/keluar, peringatan bila SPTJM lebih lama atau milik sekolah lain). Isian BB/TB dan agama siswa yang keluar bisa dibersihkan dari Daftar 1; gelar dan TMT GTK tetap dipertahankan; backup dibuat sebelum diterapkan.

## 1.3.0
- **SK Beban Mengajar (SKBM) & Jadwal Pelajaran** (halaman `/skbm`): tugas tiap guru (kepala sekolah, guru kelas, guru mapel) ditebak dari Profil dan bisa diubah; struktur JJM per kelas; jumlah siswa per rombel dari SPTJM atau manual, termasuk rekap peserta pramuka; tugas bimbingan. Menghasilkan SK + Lampiran I (pemetaan jam, mendatar), II (siswa per rombel, mendatar), III (bimbingan), IV (pengelolaan kinerja) dalam satu file .docx, dengan rujukan diktum ke lampiran yang benar.
- **Penyusun jadwal 5 hari**: jam guru mapel (PAI, PJOK, dll.) ditempatkan sebagai blok berurutan dengan backtracking sehingga satu guru tidak pernah mengajar dua kelas pada jam yang sama; sisa jam guru kelas disebar per 2 jam. Jadwal bisa diubah per sel, bentrok dan selisih JJM ditandai, dan bisa diunduh sebagai .docx.
- **Mesin dokumen**: halaman mendatar per section, judul tabel bertingkat, tabel huruf kecil, baris pangkat pada tanda tangan, dan indentasi gantung untuk daftar bernomor (Menimbang/Mengingat) di semua SK.
- **Profil**: kolom pangkat/golongan per GTK dan data pengawas pembina.
- **Situs resmi** di `website/` (ceklis.permadi.dev): beranda, panduan, catatan rilis, dan tombol unduh yang otomatis mengambil installer dari GitHub Releases.

## 1.2.0
- **Privasi:** data bawaan diganti profil contoh (placeholder, tanpa NIP/NUPTK); daftar siswa, BB/TB, dan biodata GTK bawaan dikosongkan. Test penjaga menolak angka mirip NIP/NIK di file data. Folder `data-pribadi/` untuk dokumen referensi asli di-*gitignore*.
- **Sinkronisasi server:** token wajib dan berlaku per NPSN (`NUXT_SYNC_TOKENS`); endpoint mati bila token belum diatur. Perbandingan token waktu-konstan, batas body 10 MB, validasi isi, dan deteksi konflik (409) dengan pilihan ambil/timpa. Token & URL tidak lagi ikut file ekspor, backup, atau data yang dikirim, dan tidak lagi ditanam saat build.
- **Desktop:** penulisan database benar-benar atomik (tanpa menghapus file lama lebih dulu, dengan flush ke disk); backup harian otomatis yang bisa dimatikan; pengingat tenggat memakai notifikasi Windows (plugin notifikasi Tauri).
- **Data:** impor, pulih backup, dan tarik dari server kini mengganti data lokal persis seperti sumbernya (bukan digabung). Gagal simpan (mis. penyimpanan penuh) ditampilkan sebagai peringatan.
- **Daftar 1:** tanpa SPTJM, daftar GTK diambil dari Profil. Respons server yang tidak dikenali tidak pernah ditulis ke database lokal.
- **Periode:** tahun ajaran & semester bawaan mengikuti tanggal hari ini; pilihan tahun ajaran dihitung otomatis.
- **Build:** `ssr: false` di semua mode; target `static`, `web`, dan `desktop` dibedakan dengan benar.
- **Perbaikan:** `terbilang(0)` kini menghasilkan "Nol".
- **Tabel dokumen lebih rapi:** pratinjau tidak lagi memakai kelas `grid` (yang oleh Tailwind diubah menjadi `display: grid` sehingga kolom berantakan). Pratinjau memakai lebar kolom tetap. File .docx memakai grid kolom tetap dalam twip sehingga lebarnya sama di Word dan LibreOffice. Kolom nomor otomatis di tengah, kolom angka/rupiah rata kanan, judul kolom di tengah, dan baris tabel tidak terpotong antarhalaman.
- **Daftar 1: bulan laporan & tanggal tanda tangan:** bulan dan tahun laporan bisa dipilih dari Januari 2020 sampai Desember 2050. Saat aplikasi dibuka, otomatis terpilih bulan berjalan (ada tombol *Bulan Ini*). Tanggal tanda tangan = tanggal terakhir bulan yang dipilih (termasuk 29 Februari tahun kabisat) dan dipakai di layar, cetak, serta Excel. Usia siswa dan masa kerja dari TMT dihitung sampai tanggal itu. Tahun pelajaran menyesuaikan otomatis. Usia kini dihitung per kalender sehingga tepat di sekitar hari ulang tahun.
- **Data GTK: gelar & TMT:** daftar Guru & Tenaga Kependidikan di Profil punya kolom TMT Pengangkatan dan TMT di Sekolah Ini. Gelar ditulis langsung di kolom "Nama & gelar" setelah impor SPTJM (kolom yang belum bergelar atau belum ber-TMT diberi tanda kuning). Nama bergelar dari Profil dipakai di template dan Daftar 1, termasuk saat data guru berasal dari SPTJM. Masa kerja di Daftar 1 dihitung dari TMT Pengangkatan sampai tanggal laporan. Nama bergelar & TMT tetap dipertahankan saat SPTJM diimpor ulang.
- **Pencarian global dihapus:** tombol "Cari..." di sidebar dan jendela pencarian (Ctrl+K) tidak ada lagi.
- **Panduan pertama kali:** saat profil masih contoh, aplikasi menampilkan langkah mengunduh PDF SPTJM dari SP Datadik lalu mengimpornya. Ada tombol *Buka SP Datadik* (alamat ditetapkan di backend) dan *Pilih File SPTJM*. Impor pertama dimulai dari profil kosong sehingga nama placeholder tidak tercampur dengan data asli.
- **Kode:** halaman Daftar 1 dipecah menjadi composable + komponen per tab; modul Excel dipecah ke `utils/xlsx/`. Ditambah test Vitest (template & .docx, tanggal/terbilang, util server, Excel, privasi, impor SPTJM lokal) dan workflow CI/rilis.
- **Dasar aturan:** setiap ringkasan mencantumkan tanggal pemeriksaan, penanda bila sumber resmi belum ditautkan, dan penafian "alat bantu, bukan rujukan hukum".

## 1.1.0
- Versi desktop offline Windows (Nuxtor / Tauri 2 + Rust) dengan penyimpanan database atomik lokal di `%APPDATA%\ceklis-sd\database.json`.
- Snapshot backup otomatis lokal beserta fitur pulihkan, ekspor, dan impor database `.json`.
- Sistem sinkronisasi opsional ke server sekolah menggunakan `SyncEnvelope` dengan checksum `blake3`.
- Template `daftar-honor` (PPh 21 TER) dan `spj-honor`, pengingat tenggat berbasis Notification API, ekspor checklist ke PDF/cetak, editor kop surat manual, serta item checklist BMD/inventaris ruang kelas.

## 1.0.0
- Rilis awal web SPA statis (MVP): checklist per peran & periode, 17 template dokumen + Paket RKAS lengkap, profil sekolah & GTK, dasar aturan, dan identitas brand Ceklis SD.
