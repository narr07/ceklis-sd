# Ceklis SD

Checklist dan generator dokumen untuk **operator, kepala sekolah, dan bendahara SD**, dipakai setiap awal semester, awal tahun ajaran, dan awal tahun anggaran.

Dibuat dengan **Nuxt 4.6 · Nuxt UI 4 · Tailwind CSS 4 · docx · Tauri 2 + Rust**. Spesifikasi lengkap ada di [`docs/PRD.md`](docs/PRD.md); panduan logo & brand di [`DESIGN.md`](DESIGN.md).

## Menjalankan

```bash
bun install
bun run dev            # pengembangan web (http://localhost:3000)
bun run generate       # situs statis di .output/public (data hanya di browser)
bun run build          # website + server Nitro dengan endpoint sinkronisasi /api/ceklis
bun run desktop:dev    # aplikasi desktop (Tauri) mode pengembangan
bun run desktop:build  # installer Windows .exe (NSIS) & .msi
```

Pemeriksaan sebelum rilis:

```bash
bun run lint && bun run typecheck && bun run test
bun run clippy && bun run test:rust
```

## Tiga Mode

| Mode | Perintah | Penyimpanan |
|---|---|---|
| **Situs statis** | `bun run generate` | `localStorage` browser. Bisa hilang bila data situs dibersihkan, jadi unduh file database (.json) secara berkala. |
| **Website + server sinkron** | `bun run build` | `localStorage` + salinan opsional di server (`/api/ceklis`). |
| **Desktop offline (Windows)** | `bun run desktop:build` | `%APPDATA%\ceklis-sd\database.json`, ditulis atomik, dengan backup di `%APPDATA%\ceklis-sd\backups\`. |

Di desktop, backup dibuat otomatis sebelum impor, pulih, dan sinkron, ditambah **backup harian** saat aplikasi dibuka (bisa dimatikan di halaman Profil). Yang disimpan hanya 20 backup terbaru.

## Sinkronisasi Server (opsional)

Endpoint `/api/ceklis` **mati** sampai pengelola server mengisi token per sekolah:

```bash
NUXT_SYNC_TOKENS="10000001:token-acak-minimal-16-karakter,10000002:token-lain-untuk-sekolah-kedua"
```

- Setiap token hanya berlaku untuk satu NPSN, jadi sekolah A tidak bisa membaca atau menimpa data sekolah B.
- Token dan URL server hanya disimpan di perangkat pengguna. Keduanya **tidak** ikut file ekspor, backup, atau data yang dikirim.
- Bila data di server sudah diubah dari perangkat lain, pengiriman ditolak (409), lalu pengguna memilih *Ambil data server* atau *Timpa server*.
- Checksum BLAKE3 hanya mendeteksi file atau paket yang rusak. Keaslian data dijaga oleh token dan HTTPS.

## Data Pribadi

Kode sumber **tidak boleh** memuat data sekolah sungguhan (nama siswa, NIK, NIP, NUPTK, biodata GTK).

- Profil bawaan hanya berisi placeholder. Saat pertama kali dibuka, aplikasi memandu operator mengunduh PDF SPTJM sekolahnya dari [SP Datadik](https://sp.datadik.kemendikdasmen.go.id) lalu mengimpornya. Data juga bisa diisi manual atau lewat impor database.
- `tests/data-pribadi.test.ts` gagal bila ada angka mirip NIP/NIK/NUPTK di file data bawaan.
- Simpan dokumen referensi asli (SPTJM, Daftar 1, SKBM, dsb.) di folder `data-pribadi/`. Folder itu di-*gitignore*. `tests/referensi-lokal.test.ts` memakainya untuk uji regresi impor SPTJM bila filenya ada, dan dilewati di CI.

## Fitur

- **Checklist per peran dan per periode**: centang, catatan, progres, pengingat tenggat, serta ekspor PDF/cetak. Periode bawaan mengikuti tanggal hari ini.
- **19 template + Paket RKAS lengkap**: isi formulir, sesuaikan kop surat & logo, lihat pratinjau langsung, lalu unduh `.docx`.
- **SK Beban Mengajar & Jadwal Pelajaran**: pembagian tugas & pemetaan jam (SK + Lampiran I–IV) dan penyusun jadwal 5 hari yang mencegah guru PAI/PJOK/mapel bentrok.
- **Daftar 1 (Laporan Bulanan SD)**: rekap siswa, umur, BB/TB, keadaan guru, sarpras, dan absen, dengan cetak F4/A4 serta impor/ekspor Excel.
- **Impor SPTJM Dapodik**: PDF dibaca langsung di perangkat untuk mengisi profil, GTK, rombel, sarpras, dan peserta didik.
- **Dasar aturan**: ringkasan Permendikdasmen 8/2026 (Juknis BOSP), 15/2026 (belanja sekolah), Dapodik, pajak/Coretax, dan pengelolaan kinerja. Setiap ringkasan mencantumkan tanggal pemeriksaan dan tautan sumber resmi bila sudah ada. Isinya alat bantu, bukan rujukan hukum.

## Memperbarui isi

Semua isi berupa data, jadi tampilan tidak perlu diubah:

| Yang diubah | File |
|---|---|
| Item checklist | `app/data/checklists.ts` |
| Template dokumen | `app/data/templates.ts` |
| Ringkasan aturan | `app/data/regulasi.ts` |
| Profil contoh bawaan | `app/utils/profil.ts` |

## Catatan Rilis Desktop

Installer belum ditandatangani (*code signing*), jadi Windows SmartScreen akan menampilkan peringatan saat instalasi pertama. Installer rilis dibangun oleh GitHub Actions dari source di repo ini.
