<script setup lang="ts">
// Modal edit sarpras, guru, tambah siswa, dan reset Daftar 1. State & aksi dibagi dengan halaman lewat pakaiDaftar1Halaman().
const {
  daftar1,
  sarprasModalOpen,
  guruModalOpen,
  tambahSiswaModalOpen,
  resetModalOpen,
  guruForm,
  siswaBaruForm,
  rekap,
  kelasAbsenOptions,
  agamaOptions,
  simpanSiswaBaru,
  simpanEditGuru,
  jalankanResetDaftar1,
} = pakaiDaftar1Halaman()
</script>

<template>
<!-- MODAL: EDIT SARPRAS & IDENTITAS DAFTAR 1 -->
<UModal
  v-model:open="sarprasModalOpen"
  title="Ubah Data Tanah, Bangunan & Mebeler"
>
  <template #body>
    <div class="space-y-4 text-xs">
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="NSS Sekolah">
          <UInput v-model="daftar1.sarpras.nss" />
        </UFormField>
        <UFormField label="Tahun Pendirian">
          <UInput v-model="daftar1.sarpras.tahunPendirian" />
        </UFormField>
        <UFormField label="Luas Tanah (m²)">
          <UInput
            v-model.number="daftar1.sarpras.tanahLuasM2"
            type="number"
            min="0"
          />
        </UFormField>
        <UFormField label="No. Persil Tanah">
          <UInput v-model="daftar1.sarpras.tanahNoPersil" />
        </UFormField>
        <UFormField label="Sumber Air Bersih">
          <UInput v-model="daftar1.sarpras.airBersih" />
        </UFormField>
        <UFormField label="Menumpang di Sekolah (bila ada)">
          <UInput v-model="daftar1.sarpras.menumpangDi" />
        </UFormField>
      </div>

      <div>
        <p class="font-semibold mb-2">Kondisi Bangunan & Ruangan (Bgn / Rgn)</p>
        <div class="grid gap-2 sm:grid-cols-3">
          <div class="rounded border border-default p-2 space-y-1.5">
            <p class="font-medium">Baik</p>
            <UInput
              v-model.number="daftar1.sarpras.bangunanBaik.bgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Bgn"
            />
            <UInput
              v-model.number="daftar1.sarpras.bangunanBaik.rgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Rgn"
            />
          </div>
          <div class="rounded border border-default p-2 space-y-1.5">
            <p class="font-medium">Sedang</p>
            <UInput
              v-model.number="daftar1.sarpras.bangunanSedang.bgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Bgn"
            />
            <UInput
              v-model.number="daftar1.sarpras.bangunanSedang.rgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Rgn"
            />
          </div>
          <div class="rounded border border-default p-2 space-y-1.5">
            <p class="font-medium">Rusak</p>
            <UInput
              v-model.number="daftar1.sarpras.bangunanRusak.bgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Bgn"
            />
            <UInput
              v-model.number="daftar1.sarpras.bangunanRusak.rgn"
              type="number"
              min="0"
              size="xs"
              placeholder="Rgn"
            />
          </div>
        </div>
      </div>

      <div>
        <p class="font-semibold mb-2">Mebeler (Baik / Sedang / Rusak)</p>
        <div class="space-y-1.5">
          <div
            v-for="m in daftar1.sarpras.mebeler"
            :key="m.nama"
            class="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2"
          >
            <span>{{ m.nama }}</span>
            <UInput
              v-model.number="m.baik"
              type="number"
              min="0"
              size="xs"
            />
            <UInput
              v-model.number="m.sedang"
              type="number"
              min="0"
              size="xs"
            />
            <UInput
              v-model.number="m.rusak"
              type="number"
              min="0"
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>
  </template>
  <template #footer>
    <div class="flex justify-end">
      <UButton
        color="primary"
        label="Selesai"
        @click="sarprasModalOpen = false"
      />
    </div>
  </template>
</UModal>

<!-- MODAL: EDIT KEPEGAWAIAN GURU -->
<UModal
  v-model:open="guruModalOpen"
  title="Detail Kepegawaian Guru (Daftar 1)"
>
  <template #body>
    <div class="grid gap-3 text-xs sm:grid-cols-2">
      <UFormField label="Nama & Gelar">
        <UInput v-model="guruForm.nama" />
      </UFormField>
      <UFormField label="Jabatan Daftar 1">
        <UInput
          v-model="guruForm.jabatanDaftar1"
          placeholder="Kepala Sekolah / Guru Kelas / Guru PAI"
        />
      </UFormField>
      <UFormField label="Tempat Lahir">
        <UInput v-model="guruForm.tempatLahir" />
      </UFormField>
      <UFormField label="Tanggal Lahir (DD-MM-YYYY)">
        <UInput
          v-model="guruForm.tglLahir"
          :disabled="rekap.sumberGuru === 'sptjm' && Boolean(guruForm.tglLahir)"
        />
      </UFormField>
      <UFormField label="Agama">
        <USelect
          v-model="guruForm.agama"
          :items="['ISLAM', 'KATOLIK', 'PROTESTAN', 'HINDU', 'BUDHA']"
        />
      </UFormField>
      <UFormField label="Status Kawin (K/TK)">
        <USelect
          v-model="guruForm.kawin"
          :items="['K', 'TK', '-']"
        />
      </UFormField>
      <UFormField label="Anak < 18 Tahun">
        <UInput v-model="guruForm.anakDibawah18" />
      </UFormField>
      <UFormField label="Ijazah & Tahun">
        <UInput
          v-model="guruForm.ijazahTahun"
          placeholder="S1 2019"
        />
      </UFormField>
      <UFormField label="Mengajar Kelas">
        <UInput
          v-model="guruForm.mengajarKelas"
          placeholder="I / II / I-VI / -"
        />
      </UFormField>
      <UFormField label="TMT Diangkat (DD-MM-YYYY)">
        <UInput v-model="guruForm.tmtDiangkat" />
      </UFormField>
      <UFormField label="TMT Sekolah Ini (DD-MM-YYYY)">
        <UInput v-model="guruForm.tmtSekolahIni" />
      </UFormField>
      <UFormField label="Tanggal SK Terakhir">
        <UInput v-model="guruForm.tglSkTerakhir" />
      </UFormField>
      <UFormField label="Nomor SK Terakhir">
        <UInput v-model="guruForm.noSkTerakhir" />
      </UFormField>
      <UFormField label="Golongan / Ruang">
        <UInput
          v-model="guruForm.golongan"
          placeholder="III/D / IX / -"
        />
      </UFormField>
      <UFormField label="Gaji Pokok (Rp)">
        <UInput
          v-model.number="guruForm.gajiPokok"
          type="number"
          min="0"
        />
      </UFormField>
      <UFormField label="Keterangan (PNS / PPPK / PPPK PW / TKS)">
        <UInput v-model="guruForm.keterangan" />
      </UFormField>
      <UFormField label="Sertifikasi Pendidik">
        <USelect
          v-model="guruForm.tersertifikasi"
          :items="['Sudah', 'Belum']"
        />
      </UFormField>
      <UFormField label="Absen Sakit (Hari)">
        <UInput
          v-model.number="guruForm.absenSakit"
          type="number"
          min="0"
        />
      </UFormField>
      <UFormField label="Absen Izin / Lain (Hari)">
        <div class="grid grid-cols-2 gap-2">
          <UInput
            v-model.number="guruForm.absenIzin"
            type="number"
            min="0"
            placeholder="Izin"
          />
          <UInput
            v-model.number="guruForm.absenLain"
            type="number"
            min="0"
            placeholder="Lain"
          />
        </div>
      </UFormField>
    </div>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton
        color="neutral"
        variant="outline"
        label="Batal"
        @click="guruModalOpen = false"
      />
      <UButton
        color="primary"
        label="Simpan Perubahan"
        @click="simpanEditGuru"
      />
    </div>
  </template>
</UModal>

<!-- MODAL: TAMBAH SISWA MANUAL -->
<UModal
  v-model:open="tambahSiswaModalOpen"
  title="Tambah Siswa Manual ke Daftar 1"
>
  <template #body>
    <div class="grid gap-3 text-xs sm:grid-cols-2">
      <UFormField
        label="Nama Lengkap Siswa"
        class="sm:col-span-2"
      >
        <UInput
          v-model="siswaBaruForm.nama"
          placeholder="NAMA SISWA"
        />
      </UFormField>
      <UFormField label="Jenis Kelamin">
        <USelect
          v-model="siswaBaruForm.jk"
          :items="['L', 'P']"
        />
      </UFormField>
      <UFormField label="Kelas">
        <USelect
          v-model="siswaBaruForm.tingkat"
          :items="kelasAbsenOptions"
        />
      </UFormField>
      <UFormField label="Tanggal Lahir">
        <UInput
          v-model="siswaBaruForm.tglLahir"
          type="date"
        />
      </UFormField>
      <UFormField label="Agama">
        <USelect
          v-model="siswaBaruForm.agama"
          :items="agamaOptions"
        />
      </UFormField>
    </div>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton
        color="neutral"
        variant="outline"
        label="Batal"
        @click="tambahSiswaModalOpen = false"
      />
      <UButton
        color="primary"
        label="Tambahkan"
        @click="simpanSiswaBaru"
      />
    </div>
  </template>
</UModal>

<!-- MODAL: RESET DATA DAFTAR 1 -->
<UModal
  v-model:open="resetModalOpen"
  title="Kembalikan Daftar 1 ke data bawaan awal?"
>
  <template #body>
    <p class="text-sm text-default">
      Perubahan mutasi bulanan, hari efektif, BB/TB, data tambahan guru, dan siswa manual pada Daftar 1 akan dikembalikan ke data awal. Data profil & lampiran SPTJM tetap aman.
    </p>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton
        color="neutral"
        variant="outline"
        label="Batal"
        @click="resetModalOpen = false"
      />
      <UButton
        color="error"
        label="Reset Daftar 1"
        @click="jalankanResetDaftar1"
      />
    </div>
  </template>
</UModal>
</template>
