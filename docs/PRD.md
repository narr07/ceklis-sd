# PRD — Ceklis SD: Checklist & Template Administrasi Sekolah Dasar

| | |
|---|---|
| **Produk** | Ceklis SD (webapp) |
| **Versi dokumen** | 1.2 — 16 November 2026 |
| **Pemilik** | Dinar Permadi Yusup |
| **Stack** | Nuxt 4.6 · Nuxt UI 4 · Tailwind CSS 4 · docx · Tauri 2 + Rust (desktop) |
| **Status** | v1.2: web statis, website + server sinkron, dan desktop Windows offline |

---

## 1. Latar Belakang

Setiap awal tahun anggaran (Januari), awal tahun ajaran (Juli), dan awal semester, SD harus menyelesaikan puluhan pekerjaan administrasi yang tersebar di banyak aplikasi: Dapodik, ARKAS 4, SIPLah, Coretax DJP, Ruang GTK/e-Kinerja, dan Rapor Pendidikan. Pekerjaan ini dibagi ke tiga peran: **operator**, **kepala sekolah**, dan **bendahara**.

Saat ini masalahnya:

1. **Tidak ada daftar tunggal.** Tugas diketahui dari surat edaran, grup WhatsApp, dan ingatan, sehingga ada yang terlewat, misalnya sinkron Dapodik sebelum *cut-off* 31 Agustus atau laporan tahap I paling lambat 31 Juli.
2. **Dokumen pendukung tidak lengkap.** Contohnya, paket dokumen rapat penyusunan RKAS 2026 yang menjadi bahan awal produk ini hanya berisi undangan, daftar peserta, notulen, dan berita acara. Beberapa bagian masih kurang:
   - komite sekolah tidak diundang dan tidak ikut menandatangani, padahal RKAS harus disetujui rapat dewan guru setelah mendengar pertimbangan komite;
   - belum ada daftar hadir yang ditandatangani;
   - belum ada lembar pengesahan RKAS (kepala sekolah, bendahara, komite, dinas);
   - belum ada SK Tim BOSP;
   - notulis belum menandatangani notulen;
   - belum ada lampiran dokumentasi foto.
3. **Aturan berubah setiap tahun.** Pada 2026 terbit Juknis BOSP baru (Permendikdasmen 8/2026), aturan belanja barang/jasa baru (Permendikdasmen 15/2026), serta perubahan alur Dapodik dan pajak melalui Coretax.

## 2. Tujuan

| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Setiap peran tahu persis apa yang harus dikerjakan di periodenya | 100% item wajib per periode tercantum dan bisa dicentang |
| G2 | Dokumen administrasi bisa dibuat dalam hitungan menit, dengan kop dan pejabat terisi otomatis | Paket RKAS lengkap (6 dokumen) terunduh ≤ 2 menit setelah profil diisi |
| G3 | Setiap item merujuk ke dasar aturan terbaru | Setiap item punya field `dasar` atau `aplikasi` |
| G4 | Bisa dipakai tanpa server dan tanpa login (MVP) | Berjalan sebagai SPA statis, data tersimpan di browser |

**Bukan tujuan (v1):** menggantikan Dapodik/ARKAS, menghitung pajak otomatis, dan multi-sekolah/multi-user (dijadwalkan di fase 2).

## 3. Pengguna & Persona

| Persona | Kebutuhan utama | Halaman utama |
|---|---|---|
| **Operator Sekolah** (sering guru dengan tugas tambahan) | Urutan pemutakhiran Dapodik tiap semester, SK operator, pernyataan kebenaran data | `/checklist/operator` |
| **Kepala Sekolah** | PBD dari Rapor Pendidikan, RKT/RKAS, SK pembagian tugas, pengelolaan kinerja di Ruang GTK, pengesahan ARKAS | `/checklist/kepsek` |
| **Bendahara BOSP** | RKAS di ARKAS, BKU, pajak (Coretax), bukti belanja sesuai Permendikdasmen 15/2026, laporan tahap | `/checklist/bendahara` |

## 4. Ruang Lingkup Fitur (MVP v1.0)

### F1. Profil Sekolah (`/profil`)
- Kolom: pemerintah daerah, dinas, nama sekolah, NPSN, alamat, desa, kecamatan, kabupaten, kode pos, email, website, kepala sekolah + NIP, bendahara + NIP, operator + NIP/NUPTK, ketua komite, kota penandatanganan.
- Unggah logo kiri (pemda) dan logo kanan (sekolah) untuk kop surat (PNG/JPG, disimpan sebagai data URL).
- Daftar GTK (nama, NIP, NUPTK, L/P, jabatan) dipakai di daftar hadir dan SK.
- Data awal: **profil contoh** dengan nama placeholder dan tanpa NIP/NUPTK. Kode sumber tidak boleh memuat data pribadi sungguhan (dijaga oleh test `tests/data-pribadi.test.ts`). Data asli masuk lewat isian manual, impor SPTJM Dapodik (F7), atau impor database.
- Peringatan "Profil masih berisi data contoh" tampil selama NPSN belum diisi.
- **Penerimaan:** perubahan tersimpan otomatis; tombol *Ekspor/Impor JSON* untuk pindah perangkat.

### F2. Checklist per Peran & Periode (`/checklist/[peran]`)
- Pemilih periode: **Tahun Ajaran** (mis. 2026/2027) × **Semester** (Ganjil/Genap).
- Item muncul berdasarkan fase:

| Fase | Tampil di | Contoh |
|---|---|---|
| `semester` | Ganjil & Genap | Unduh/instal Dapodik versi baru, sinkron, cek Info GTK |
| `tahun-ajaran` | Ganjil (Juli–Agustus) | Kenaikan kelas, lulusan, PD baru, SK operator baru |
| `genap` | Genap (Januari) | Data periodik ke-2, siapkan calon lulusan |
| `tahun-anggaran` | Genap (Januari) | Rapat & pengesahan RKAS, SK Tim BOSP, SKP tahunan |
| `rutin` | Ganjil & Genap | Tutup BKU bulanan, setor/lapor pajak, laporan tahap |

- Setiap item: judul, rincian, aplikasi terkait, dasar aturan, tenggat (jika ada), tautan ke template terkait, catatan bebas, status centang.
- Progres per kelompok dan total (progress bar). Filter: *semua / belum / selesai*.
- Tombol **Cetak** (print CSS) dan **Reset periode**.
- **Penerimaan:** progres disimpan per `peran + tahun ajaran + semester`; mengganti periode tidak menghapus progres periode lain.

### F3. Pustaka Template (`/template`, `/template/[id]`)
- Daftar template dengan filter peran dan kategori (RKAS, SK, Dapodik, Keuangan, Pengadaan).
- Halaman template: formulir isian khusus template (tanggal, nomor surat, nilai, dll.), **pratinjau langsung**, dan tombol **Unduh .docx**.
- Kop surat, nama pejabat, dan daftar GTK otomatis terisi dari profil.
- Tanggal ditulis dalam format Indonesia, dengan versi terbilang untuk berita acara dan kuitansi.
- **Paket**: "Paket RKAS Lengkap" menggabungkan undangan, daftar hadir, notulen, berita acara, lembar pengesahan, dan lembar dokumentasi ke dalam satu .docx (pemisah halaman antardokumen).

**Template v1 (17):**

| ID | Template | Peran |
|---|---|---|
| `rkas-undangan` | Undangan Rapat Penyusunan RKAS (GTK + Komite) | Kepsek |
| `rkas-daftar-hadir` | Daftar Hadir Rapat RKAS (kolom TTD) | Kepsek |
| `rkas-notulen` | Notulen Rapat RKAS (TTD notulis + kepsek) | Kepsek |
| `rkas-berita-acara` | Berita Acara Penyusunan RKAS (TTD kepsek, komite, perwakilan guru) | Kepsek |
| `rkas-pengesahan` | Lembar Pengesahan RKAS | Kepsek/Bendahara |
| `rkas-dokumentasi` | Lampiran Dokumentasi Kegiatan | Kepsek |
| `sk-tim-bosp` | SK Tim Pengelola Dana BOSP | Kepsek |
| `sk-operator` | SK Penunjukan Operator Dapodik | Kepsek |
| `sk-pembagian-tugas` | SK Pembagian Tugas Mengajar & Tugas Tambahan | Kepsek |
| `pernyataan-dapodik` | Surat Pernyataan Kebenaran Data Dapodik | Operator |
| `ba-pemeriksaan-kas` | Berita Acara Pemeriksaan Kas | Bendahara |
| `persiapan-pengadaan` | Dokumen Persiapan Belanja Barang/Jasa | Bendahara |
| `ba-perbandingan` | BA Hasil Perbandingan Penyedia (≥ 2 penyedia) | Bendahara |
| `ba-serah-terima` | BA Pemeriksaan & Serah Terima Barang/Jasa | Bendahara |
| `kuitansi` | Kuitansi Pembayaran | Bendahara |
| `sptjm` | Surat Pernyataan Tanggung Jawab Mutlak Penggunaan Dana BOSP | Kepsek |
| `papan-informasi` | Pengumuman Rencana/Realisasi Penggunaan Dana BOSP | Bendahara |

### F4. Dasar Aturan (`/regulasi`)
- Daftar regulasi dengan ringkasan poin penting dan tanggal penetapan. Item checklist merujuk ke ID regulasi.

### F5. Beranda (`/`)
- Kartu tiga peran beserta persentase progres periode aktif, kartu "tenggat terdekat", dan pintasan ke Paket RKAS.
- Periode bawaan mengikuti tanggal hari ini (Juli–Desember = ganjil, Januari–Juni = genap); pilihan tahun ajaran dihitung dari tahun berjalan.

### F6. Daftar 1: Laporan Bulanan SD (`/daftar-1`)
- Rekap siswa per kelas, umur 5–14 tahun, agama, mutasi, BB/TB, keadaan guru (19 kolom), sarpras/mebeler, dan daftar absen kelas.
- Sumber siswa & GTK: SPTJM Dapodik (F7) bila sudah diimpor; tanpa SPTJM, GTK diambil dari Profil dan siswa diisi manual atau lewat impor Excel Daftar 1.
- Cetak F4/A4 dan unduh/impor Excel (.xlsx).

### F7. Impor SPTJM Dapodik (`/profil`)
- Membaca PDF SPTJM langsung di perangkat (tanpa upload): profil sekolah, rekening BOS, sarpras, GTK, rombel, dan peserta didik.
- **Penerimaan:** diuji regresi dengan SPTJM asli di folder lokal `data-pribadi/` (tidak ikut repo; test dilewati di CI).

### F8. Desktop Offline & Database Lokal
- Database di `%APPDATA%\ceklis-sd\database.json`, ditulis atomik (file sementara → flush → rename, tanpa menghapus file lama dulu).
- Backup: manual, otomatis sebelum impor/pulih/sinkron, dan **backup harian** saat aplikasi dibuka (bisa dimatikan). Maksimal 20 file terbaru.
- Pulih, impor, dan tarik dari server **mengganti** data lokal persis seperti sumbernya (bukan digabung).
- Pengingat tenggat memakai notifikasi Windows (plugin notifikasi Tauri).

### F9. Sinkronisasi Server (opsional)
- Endpoint `/api/ceklis` hanya aktif bila server mengisi `NUXT_SYNC_TOKENS` dengan token **per NPSN** (minimal 16 karakter). Tanpa itu server menjawab 503.
- Token & URL disimpan di perangkat saja; tidak ikut file ekspor, backup, atau data yang dikirim.
- Deteksi konflik: kiriman membawa versi server terakhir yang diketahui; bila server sudah berubah, pengguna memilih *Ambil data server* atau *Timpa server*.
- Checksum BLAKE3 hanya mendeteksi file/paket rusak, bukan bukti keaslian.

## 5. Ringkasan Aturan yang Dipakai (per 15 Nov 2026)

| Topik | Ketentuan | Sumber |
|---|---|---|
| Juknis BOSP | Permendikdasmen 8/2026, ditetapkan 5 Feb 2026, mencabut Permendikdasmen 8/2025 | BPK, kiakrikil |
| Batas BOS reguler | Honor maks. 20% (negeri) / 40% (swasta); buku min. 10%; pemeliharaan sarpras maks. 20% | Pasal 42 |
| Laporan | Tahap I paling lambat 31 Juli; tahunan paling lambat 31 Januari tahun berikutnya; tahap II butuh realisasi tahap I ≥ 50% | Pasal 56–58 |
| Sanksi | Terlambat lapor dipotong 2/3/4%; lewat 25 Okt tahap II tidak cair; lewat 25 Juni dana tahun berjalan tidak cair | Pasal 59–60 |
| Larangan | Rekening pribadi, meminjamkan, pungutan, investasi, rehab sedang/berat & ruang baru, pembiayaan ganda, menjadi distributor | Pasal 66 |
| Belanja barang/jasa | Permendikdasmen 15/2026 (28 Juli 2026): persiapan → pemilihan → pelaksanaan → pelaporan; > Rp1 juta wajib dokumen persiapan; bandingkan ≥ 2 penyedia; penyedia ber-NPWP; 5 bukti wajib | Pasal 11–26 |
| Pajak | Bukti potong lewat e-Bupot Coretax; PPh 21 (honor), PPh 23 (2%, jasa), PPh 4(2), PPN 12% × DPP 11/12; dana BOS dikecualikan dari pemungutan PPh 22 (PMK 81/2024 Ps. 219(1)e) | DJP, DDTC |
| Dapodik | 2027.b untuk semester ganjil 2026/2027; PD baru SD melalui Aplikasi Manajemen Satuan Pendidikan | Sevima, Kemendikdasmen |
| RKAS | Disetujui rapat dewan guru dengan pertimbangan komite, disahkan dinas; disusun & disahkan di ARKAS 4 | Panduan ARKAS |
| Kinerja | Pengelolaan kinerja guru & kepsek ASN di Ruang GTK, sinkron ke e-Kinerja BKN | Kepdirjen GTK 5539/2024, Kepmen 271/O/2025 |

> Semua isi aturan ditulis sebagai data (`app/data/regulasi.ts`, `app/data/checklists.ts`) supaya bisa diperbarui tanpa mengubah kode tampilan.

## 6. Arsitektur

```
app/
  app.vue                  # UApp + header + navigasi
  pages/
    index.vue              # beranda
    profil.vue             # profil sekolah & GTK
    regulasi.vue
    checklist/[peran].vue  # operator | kepsek | bendahara
    template/index.vue
    template/[id].vue      # form + pratinjau + unduh
  components/
    DocPreview.vue         # render blok dokumen ke HTML
  composables/
    useProfil.ts           # state profil (localStorage)
    usePeriode.ts          # tahun ajaran & semester aktif
    useProgress.ts         # status centang + catatan
  data/
    checklists.ts          # item checklist (data murni)
    templates.ts           # definisi template → blok dokumen
    regulasi.ts
  utils/
    blocks.ts              # tipe blok dokumen
    docx.ts                # blok → .docx (pustaka docx)
    tanggal.ts             # format tanggal & terbilang
```

**Model blok dokumen.** Setiap template adalah fungsi `(profil, isian) => Block[]`. Blok yang tersedia: `kop`, `title`, `p`, `meta`, `list`, `table`, `sign`, `space`, `break`, `photos`. Satu model dipakai oleh dua renderer, yaitu pratinjau HTML dan ekspor `.docx`, sehingga yang terlihat di layar sama dengan yang diunduh.

**Penyimpanan.** `localStorage` dengan kunci `ceklis:profil`, `ceklis:periode`, `ceklis:progress:{peran}:{ta}:{semester}`, `ceklis:isian:{template}`, `ceklis:daftar1`. Di desktop, file `database.json` adalah sumber kebenaran dan localStorage WebView hanya cache. Gagal simpan (mis. kuota penuh) ditampilkan sebagai peringatan, tidak ditelan diam-diam.

**Rendering & target build.** `ssr: false` di semua mode. Tiga target: `static` (`nuxt generate`, data di browser), `web` (`nuxt build`, server Nitro + `/api/ceklis`), dan `desktop` (Tauri; `bun run generate:desktop`).

**Struktur tambahan.** `pages/daftar-1.vue` hanya kerangka; logikanya di `composables/useDaftar1Halaman.ts` dan tiap tab di `components/daftar1/`. Ekspor Excel dipecah ke `utils/xlsx/` (zip, helper sheet, builder sheet Daftar 1). Backend desktop di `src-tauri/src/` (`commands.rs`, `storage.rs`, `safety.rs`).

## 7. Kebutuhan Non-Fungsional

- **Offline-first:** ikon dibundel lokal dan tidak memanggil API eksternal saat runtime.
- **Responsif:** nyaman di HP (operator sering bekerja dari HP).
- **Aksesibel:** kontras memadai dan checkbox berlabel.
- **Privasi:** data sekolah (NIP, NUPTK, NIK, biodata siswa) hanya disimpan di perangkat pengguna dan baru dikirim ke server bila pengguna menyalakan sinkronisasi sendiri. Repo tidak boleh memuat data pribadi sungguhan; dokumen referensi asli disimpan di `data-pribadi/` yang di-*gitignore*.
- **Kinerja:** halaman pertama < 300 KB gzip (di luar pustaka docx yang dimuat lazy saat unduh).

## 8. Roadmap

| Fase | Fitur |
|---|---|
| **v1.0 (MVP)** | F1–F5, 17 template, ±90 item checklist, localStorage |
| **v1.1** | Pengingat tenggat, ekspor checklist ke PDF, template SPJ honor & daftar penerimaan honor (dengan PPh 21 TER), versi desktop Windows |
| **v1.2** | Data bawaan tanpa data pribadi, sinkronisasi dengan token per sekolah & deteksi konflik, backup harian, Daftar 1 & impor SPTJM terdokumentasi, test otomatis |
| **v1.3** | SK Beban Mengajar (SK + Lampiran I–IV) dan penyusun jadwal pelajaran 5 hari tanpa bentrok guru mapel |
| **v2.0** | Login (akun belajar.id/Google), database (Supabase/Nuxt Hub), multi-user satu sekolah (kepsek melihat progres operator & bendahara), riwayat versi dokumen |
| **v2.1** | Mode dinas/korwil: memantau progres banyak sekolah |
| **v3.0** | Kalkulator batas komponen BOS (honor 20%, buku 10%, pemeliharaan 20%) dari impor Excel RKAS ARKAS |

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Aturan berubah di tengah tahun | Data terpisah dari kode; halaman `/regulasi` mencantumkan tanggal "terakhir diperiksa" |
| Ringkasan aturan dari sumber sekunder | Setiap item menyebut pasal; pengguna diarahkan mencocokkan dengan salinan resmi (JDIH/BPK) |
| Data hilang karena cache browser dibersihkan | Ekspor/impor JSON; versi desktop dengan backup harian; peringatan saat gagal simpan |
| Data pribadi siswa/GTK ikut tersebar lewat repo atau bundel | Data bawaan placeholder; test penjaga angka mirip NIP/NIK; folder `data-pribadi/` di-*gitignore* |
| Dua perangkat mengubah data server bersamaan | Deteksi konflik (409) dengan pilihan ambil atau timpa |
| Token sinkron bocor | Token per NPSN, tidak ikut ekspor/backup; server mati bila token belum diatur |
| Format surat berbeda per kabupaten | Semua teks template bisa disunting setelah diunduh (.docx) |

## 10. Kriteria Rilis v1.0

- [x] `nuxt generate` sukses tanpa error
- [x] Tiga halaman checklist tampil, centang tersimpan setelah reload
- [x] Semua 17 template bisa dipratinjau & diunduh sebagai .docx yang terbuka di Word/LibreOffice
- [x] Paket RKAS Lengkap terunduh sebagai satu file
- [x] Profil bisa diekspor & diimpor
