# DESIGN.md — Brand & Logo Ceklis SD

| | |
|---|---|
| **Versi** | 1.0, 15 November 2026 |
| **Berlaku untuk** | Webapp Ceklis SD, ikon aplikasi, kartu media sosial (OG), dan materi sosialisasi |
| **File aset** | `public/brand/` (SVG master dan PNG ikon) |
| **Papan brand** | [`docs/brand-board.png`](docs/brand-board.png) |
| **Token kode** | `app/assets/css/main.css`, `app/app.config.ts`, `app/components/AppLogo.vue` |

---

## 1. Inti brand

### Cerita
Ceklis SD membantu operator, kepala sekolah, dan bendahara menyelesaikan pekerjaan administrasi yang datang berulang setiap semester. Brand ini meminjam tiga benda yang akrab di setiap SD:

| Benda | Diterjemahkan menjadi |
|---|---|
| **Papan klip** tempat daftar hadir dan berkas | Bentuk dasar logo |
| **Papan tulis hijau** di kelas | Warna utama *Hijau Papan* |
| **Seragam merah-putih** siswa SD | Aksen *Merah Seragam* dan label "SD" |

Tanda centang di tengah papan klip berarti satu hal: *pekerjaan ini sudah beres*.

### Kepribadian

| Kami | Bukan |
|---|---|
| Rapi dan bisa dipercaya, layaknya arsip yang siap diperiksa | Kaku dan birokratis |
| Membantu dan langsung ke inti | Menggurui atau penuh jargon |
| Akrab dengan sekolah | Kekanak-kanakan |
| Tenang menghadapi tenggat | Panik dan penuh tanda seru |

### Tagline
- **Utama:** *Checklist & template administrasi SD*
- **Pendek (ikon dan kartu kecil):** *Beres tiap semester.*
- **Deskriptif:** *Untuk operator, kepala sekolah, dan bendahara SD.*

---

## 2. Logo

### 2.1 Anatomi

```
      ┌──────┐        ← Klip (Merah Seragam #C8102E) dengan lubang
  ┌───┴──────┴───┐
  │              │
  │    ╲    ╱    │    ← Centang putih, goresan 6.5/64, ujung bulat
  │     ╲  ╱     │
  │      ╲╱      │    ← Papan (Hijau Papan #0E6E66), radius 14/64
  └──────────────┘
```

Dibangun di grid 64 × 64:

| Elemen | Ukuran (unit grid) |
|---|---|
| Papan | x 6, y 10, 52 × 50, radius 14 |
| Klip | x 21, y 3, 22 × 13, radius 5 |
| Lubang klip | lingkaran r 2.6 di (32, 9.5), warna sama dengan papan |
| Centang | titik 19.5,36.5 → 28.5,45.5 → 45,27; tebal 6.5; cap & join bulat |

**Wordmark:** "Ceklis" ditulis dengan Plus Jakarta Sans ExtraBold (800) dan tracking −2%. Kata "SD" berada di dalam *pill* Merah Seragam dengan teks putih, tingginya 62% dari tinggi huruf "Ceklis". Di file SVG master, teks sudah dikonversi ke *outline* sehingga tidak bergantung pada font yang terpasang.

### 2.2 Varian

| File | Kapan dipakai |
|---|---|
| `logo-horizontal.svg` | Default: header web, kop materi sosialisasi, slide |
| `logo-stacked.svg` | Ruang persegi: sampul, poster, halaman login |
| `logo-mark.svg` | Ruang sangat sempit: avatar, ikon tab |
| `logo-horizontal-reverse.svg` / `logo-mark-reverse.svg` | Di atas latar Hijau Papan atau foto gelap |
| `logo-horizontal-mono.svg` / `logo-mark-mono.svg` | Cetak satu warna, stempel, fotokopi |
| `favicon.svg`, `icon-*.png`, `favicon.ico` | Favicon, ikon PWA, apple-touch-icon. Varian ini tanpa lubang klip dan dengan centang lebih tebal (8.5) agar terbaca di 16 px |
| `og-image.svg` / `public/og-image.png` | Pratinjau tautan (WhatsApp, Facebook, X), 1200 × 630 |

Di kode, gunakan komponen `<AppLogo />` dengan `variant="color" | "reverse" | "mono"`. Tambahkan prop `mark` untuk menampilkan simbol saja.

### 2.3 Ruang kosong & ukuran minimum
- **Ruang kosong:** di setiap sisi logo, sediakan ruang minimal setinggi **klip** (13/64 tinggi simbol), atau ± ¼ tinggi simbol.
- **Minimum:** horizontal 96 px / 25 mm, simbol 16 px / 5 mm (gunakan `favicon.svg` di bawah 24 px).

### 2.4 Yang tidak boleh

| ✗ Jangan | Alasan |
|---|---|
| Mengubah warna papan menjadi selain Hijau Papan, putih, atau tinta | Merusak pengenalan brand |
| Menukar posisi merah dan hijau (papan merah) | Merah pada area besar terbaca sebagai "galat" |
| Memiringkan, meregangkan, atau memberi bayangan/gradien | |
| Menulis ulang "Ceklis" dengan font lain | |
| Memisahkan pill "SD" dari "Ceklis" atau mewarnainya hijau | |
| Menaruh logo berwarna di atas latar ramai tanpa panel | Gunakan versi reverse atau panel putih |
| Memakai logo Tut Wuri Handayani, lambang pemda, atau logo kementerian sebagai bagian logo Ceklis SD | Ceklis SD bukan produk resmi pemerintah. Logo pemda/sekolah hanya muncul di **kop surat dokumen** dan diunggah oleh sekolah sendiri |

---

## 3. Warna

### 3.1 Warna inti

| Nama | Hex | Token | Peran |
|---|---|---|---|
| **Hijau Papan** | `#0E6E66` | `papan-700` → `primary` | Warna utama: tombol, tautan, progres, logo |
| **Merah Seragam** | `#C8102E` | `merah-600` → `secondary` | Aksen brand: pill "SD", klip, garis bawah OG. **Gunakan hemat** |
| **Tinta** | `#13232B` | `tinta` | Teks judul, logo mono |
| **Kapur** | `#FBFCFB` | `--ui-bg` (terang) | Latar aplikasi |
| **Kertas** | `#FFFDF7` | `kertas` | Latar pratinjau dokumen A4 |
| **Papan Malam** | `#0B1416` | `--ui-bg` (gelap) | Latar mode gelap |

Proporsi pemakaian kira-kira **70% netral (kapur/kertas/putih) · 20% Hijau Papan · 8% Tinta · 2% Merah Seragam**.

### 3.2 Skala lengkap

| | 50 | 100 | 200 | 300 | 400 | 500 | 600 | **700** | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **papan** | `#EEF8F6` | `#D5EFEA` | `#ADDFD6` | `#7CC7BB` | `#48A99C` | `#1F8C80` | `#127C72` | **`#0E6E66`** | `#0C5A54` | `#0A4A45` | `#052A27` |
| **merah** | `#FEF1F2` | `#FDE0E3` | `#FBC6CC` | `#F79AA5` | `#EF6273` | `#E3324A` | **`#C8102E`** | `#A70D27` | `#8A1027` | `#741226` | `#410410` |

Netral memakai skala **slate** Tailwind.

### 3.3 Warna status (dari Nuxt UI, tidak diubah)
`success` hijau · `warning` kuning untuk tenggat · `error` merah untuk galat dan reset · `info` biru untuk badge dasar aturan.

> **Aturan penting:** Merah Seragam adalah warna **brand**, bukan warna galat. Jangan pakai `secondary` untuk pesan kesalahan, dan jangan pakai `error` untuk elemen brand. Keduanya juga tidak boleh tampil bersebelahan dalam ukuran besar.

### 3.4 Kontras (WCAG 2.1)

| Pasangan | Rasio | Status |
|---|---|---|
| Putih di atas Hijau Papan | 6.10 : 1 | AA teks normal ✓ |
| Putih di atas Merah Seragam | 5.88 : 1 | AA teks normal ✓ |
| Tinta di atas Kapur | 15.67 : 1 | AAA ✓ |
| Hijau Papan di atas Kapur (tautan) | 5.93 : 1 | AA ✓ |
| `papan-400` di atas Papan Malam (primary mode gelap) | 6.60 : 1 | AA ✓ |
| Abu `#4B5D66` (tagline) di atas putih | 6.87 : 1 | AA ✓ |

---

## 4. Tipografi

| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Logo & judul | **Plus Jakarta Sans** | 800 / 700 | Font open-source (OFL) karya Tokotype, Jakarta: relevan dan terbaca jelas di layar kecil |
| Teks antarmuka | **Plus Jakarta Sans** | 400–600 | Dibundel lokal lewat `@fontsource-variable/plus-jakarta-sans` sehingga tetap jalan offline |
| Dokumen resmi (.docx & pratinjau) | **Times New Roman** | 12 pt | Lazim untuk naskah dinas sekolah dan tersedia di semua komputer sekolah |

### Skala teks (web)

| Token | Ukuran / tinggi baris | Pemakaian |
|---|---|---|
| Display | 36–40 px / 1.1, bobot 700, tracking −1% | Judul beranda |
| H1 | 30 px / 1.2, bobot 700 | Judul halaman |
| H2 | 18 px / 1.4, bobot 600 | Judul kelompok checklist |
| Body | 16 px / 1.6 | Teks umum |
| Small | 14 px / 1.5 | Rincian item |
| Caption | 12 px / 1.4 | Badge, keterangan |

---

## 5. Elemen antarmuka

- **Radius:** 8 px (`--ui-radius: 0.5rem`) untuk kartu dan input; *pill* penuh untuk badge. Radius ini selaras dengan sudut papan klip pada logo.
- **Ikon:** Lucide, garis 2 px, dibundel lokal. Ikon peran: `monitor-cog` (operator), `user-round-check` (kepala sekolah), `wallet` (bendahara).
- **Centang:** checkbox bulat-kotak memakai Hijau Papan saat aktif; item yang selesai dicoret dan diredupkan. Gerak centang ≤ 150 ms, tanpa animasi berlebihan.
- **Pola latar:** garis horizontal tipis (opasitas 7%) seperti buku bergaris/papan tulis. Pakai hanya di OG image dan sampul, tidak di layar kerja.
- **Kartu dokumen:** pratinjau di atas `kertas` dengan bayangan lembut agar mirip kertas A4 sungguhan.

---

## 6. Suara & gaya bahasa

- Gunakan Bahasa Indonesia baku yang luwes, sapa pengguna dengan **"Anda"**, dan buat kalimat aktif yang pendek.
- Tulis tombol sebagai kata kerja yang jelas: *Unduh .docx*, *Buat paket RKAS*, *Tambah catatan*. Hindari "Klik di sini".
- Sebut nama aplikasi resmi apa adanya: **Dapodik, ARKAS 4, SIPLah, Coretax DJP, Ruang GTK, Rapor Pendidikan**.
- Saat menyebut aturan, tulis nomor dan pasalnya: *"Permendikdasmen 8/2026 Pasal 42"*.
- Tulis tenggat secara tenang dan spesifik, misalnya *"Paling lambat 31 Juli"*. Hindari *"SEGERA!!!"*.

| ✓ | ✗ |
|---|---|
| Profil belum lengkap. Nama bendahara masih kosong. | ERROR: Data tidak valid! |
| Progres periode ini direset. | Berhasil menghapus semua data!!! |

---

## 7. Aplikasi brand

| Media | Spesifikasi |
|---|---|
| Header web | `AppLogo` horizontal, tinggi simbol 32 px |
| Favicon | `favicon.svg` + `favicon.ico` 32 px + `apple-touch-icon.png` 180 px |
| PWA | `site.webmanifest`, `theme_color #0E6E66`, ikon 192 & 512 |
| Kartu tautan (OG) | `og-image.png` 1200 × 630, latar Hijau Papan, garis bawah Merah Seragam 24 px |
| Dokumen .docx | **Tanpa logo Ceklis SD.** Kop memakai identitas dan logo sekolah/pemda dari profil karena dokumen itu milik sekolah |
| Materi sosialisasi (slide/poster) | Latar Kapur atau Hijau Papan, judul Plus Jakarta Sans 800, logo stacked di sampul |

---

## 8. Membuat ulang aset

Logo dihasilkan dari kode agar konsisten:

```bash
npm run brand   # menjalankan scripts/logo.py → public/brand/*.svg
```

Script membaca Plus Jakarta Sans dari `node_modules/@fontsource/plus-jakarta-sans` dan mengubah teks menjadi outline. Butuh Python 3 dengan `fonttools` dan `brotli`. Ikon PNG dirender dari `favicon.svg`.

---

## 9. Checklist sebelum rilis materi

- [ ] Logo memakai file dari `public/brand/`, tidak digambar ulang
- [ ] Ruang kosong ≥ tinggi klip
- [ ] Merah Seragam ≤ 2% area, tidak dipakai sebagai warna galat
- [ ] Kontras teks ≥ 4.5 : 1
- [ ] Nama aplikasi dan nomor aturan ditulis benar
- [ ] Tidak ada lambang pemerintah di dalam logo Ceklis SD
