<script setup lang="ts">
useSeoMeta({
  title: 'Kebijakan Privasi',
  description: 'Data apa saja yang diolah Ceklis SD, di mana disimpan, dan bagaimana akses Google Drive dipakai.'
})

const DIPERBARUI = '16 November 2026'

const isi = `
## Ringkasnya

- Ceklis SD adalah **aplikasi desktop offline**. Semua data sekolah disimpan di komputer Anda sendiri.
- Pengembang **tidak menjalankan server** yang menampung data sekolah, dan tidak mengumpulkan analitik, iklan, atau pelacak.
- Jika Anda menghubungkan **Google Drive**, berkas disimpan di **Google Drive akun Anda sendiri**, bukan di akun pengembang.

## Data yang diolah aplikasi

Aplikasi mengolah data yang Anda masukkan atau impor sendiri, misalnya profil sekolah, data guru dan tenaga kependidikan, data siswa dari PDF SPTJM Dapodik, checklist, dan isian template dokumen.

Data itu disimpan di folder data aplikasi di komputer Anda (\`%APPDATA%\\ceklis-sd\`), termasuk cadangan otomatis harian. Data tidak dikirim ke mana pun kecuali Anda sendiri yang mengekspor, mengirim ke server sekolah Anda, atau menyimpannya ke Google Drive.

## Google Drive (opsional)

Fitur ini hanya aktif bila Anda memilih **Hubungkan Google Drive** dan menyetujui izin di layar login Google.

**Izin yang diminta:** \`drive.file\`. Dengan izin ini aplikasi **hanya bisa melihat dan mengubah berkas yang dibuat oleh Ceklis SD sendiri** (atau yang Anda buka secara eksplisit dengan aplikasi ini). Aplikasi tidak dapat membaca berkas lain di Drive Anda.

**Untuk apa dipakai:**
- membuat folder *Ceklis SD* di Drive Anda;
- mengunggah dokumen yang Anda simpan (PDF dan .docx);
- menyimpan dan mengambil salinan database sekolah yang **dienkripsi di komputer Anda** sebelum diunggah, dengan kata sandi yang hanya Anda ketahui.

**Penyimpanan token:** token akses Google disimpan di komputer Anda dan tidak dikirim ke pengembang. Anda dapat memutus sambungan kapan saja dari menu aplikasi atau dari [pengaturan akun Google](https://myaccount.google.com/permissions).

**Tidak dibagikan:** data dari Google Drive tidak dikirim ke pengembang atau pihak ketiga, tidak dijual, tidak dipakai untuk iklan, dan tidak dipakai untuk melatih model AI.

Penggunaan dan pemindahan informasi yang diterima dari Google API mematuhi [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), termasuk ketentuan *Limited Use*.

## Situs ini

Situs ceklis.permadi.dev adalah halaman statis. Saat dibuka, peramban Anda mengambil daftar rilis dari GitHub untuk menampilkan tombol unduh; permintaan itu tunduk pada [kebijakan privasi GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement). Situs ini tidak memasang cookie pelacak.

## Menghapus data

- Data lokal: hapus folder \`%APPDATA%\\ceklis-sd\` atau gunakan menu reset di aplikasi.
- Data di Google Drive: hapus folder *Ceklis SD* di Drive Anda, lalu cabut akses aplikasi di pengaturan akun Google.

## Perubahan dan kontak

Kebijakan ini dapat diperbarui seiring fitur baru; tanggal di bawah judul menunjukkan versi terakhir. Pertanyaan atau laporan dapat disampaikan melalui [GitHub Issues](${URL_ISSUE}).
`
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Kebijakan Privasi"
      :description="`Terakhir diperbarui ${DIPERBARUI}`"
      class="py-12"
    />

    <UPageBody class="max-w-3xl">
      <MDC :value="isi" />
    </UPageBody>
  </UContainer>
</template>
