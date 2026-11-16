<script setup lang="ts">
useSeoMeta({
  title: 'Ketentuan Layanan',
  description: 'Syarat penggunaan aplikasi Ceklis SD dan situs ceklis.permadi.dev.'
})

const DIPERBARUI = '16 November 2026'

const isi = `
Dengan memasang atau memakai Ceklis SD, Anda menyetujui ketentuan berikut.

## Lisensi

Ceklis SD adalah perangkat lunak **gratis dan sumber terbuka** dengan [Lisensi MIT](${URL_REPO}/blob/main/LICENSE). Anda boleh memakai, menyalin, mengubah, dan membagikannya sesuai lisensi tersebut.

## Alat bantu, bukan rujukan hukum

- Checklist, ringkasan dasar aturan, dan template dokumen disusun untuk **membantu** administrasi sekolah. Isinya bukan nasihat hukum dan bukan pengganti peraturan resmi.
- Selalu periksa kembali dokumen yang dihasilkan (nama, NIP, angka, tanggal, dan dasar hukum) sebelum ditandatangani atau dikirim.
- Tanggung jawab atas isi dokumen resmi tetap ada pada sekolah dan penandatangan.

## Data Anda

- Data sekolah tersimpan di komputer Anda dan, bila Anda pilih, di Google Drive akun Anda sendiri. Rinciannya ada di [Kebijakan Privasi](/privasi).
- Anda bertanggung jawab menjaga kerahasiaan data pribadi siswa dan GTK, menyimpan cadangan, serta menjaga kata sandi enkripsi. **Kata sandi yang hilang tidak dapat dipulihkan** oleh pengembang.
- Pakai fitur Google Drive hanya dengan akun yang berhak Anda kelola, misalnya akun resmi sekolah.

## Layanan pihak ketiga

Fitur tertentu memakai layanan pihak ketiga seperti Google Drive, GitHub (unduhan dan pembaruan), dan SP Datadik (sumber PDF SPTJM). Penggunaannya juga tunduk pada ketentuan masing-masing layanan.

## Tanpa jaminan

Perangkat lunak disediakan **"sebagaimana adanya"**, tanpa jaminan apa pun. Pengembang tidak bertanggung jawab atas kerugian akibat penggunaan aplikasi, termasuk kehilangan data, kesalahan dokumen, atau gangguan layanan pihak ketiga, sejauh diizinkan hukum yang berlaku.

## Perubahan

Ketentuan ini dapat diperbarui. Versi terbaru selalu ada di halaman ini, dengan tanggal pembaruan di bawah judul.

## Kontak

Pertanyaan dan laporan masalah dapat disampaikan melalui [GitHub Issues](${URL_ISSUE}).
`
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Ketentuan Layanan"
      :description="`Terakhir diperbarui ${DIPERBARUI}`"
      class="py-12"
    />

    <UPageBody class="max-w-3xl">
      <MDC :value="isi" />
    </UPageBody>
  </UContainer>
</template>
