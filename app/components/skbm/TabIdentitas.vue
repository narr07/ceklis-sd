<script setup lang="ts">
import { MENGINGAT_BAWAAN } from '~/utils/skbm'
import { daftarTahunAjaran } from '~/utils/tanggal'

const { profil, skbm } = useSkbmHalaman()

const semesterItems = [
  { label: 'Semester I (Ganjil)', value: 'ganjil' },
  { label: 'Semester II (Genap)', value: 'genap' },
]
const tahunItems = computed(() => daftarTahunAjaran(new Date(), [skbm.value.tahunAjaran]))
const tempatBawaan = computed(() => profil.value.kecamatan || profil.value.kota || 'kecamatan di Profil')
const jumlahMengingat = computed(() => skbm.value.mengingat.split('\n').filter(x => x.trim()).length)
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <UCard>
      <template #header>
        <p class="font-semibold">Nomor & penetapan</p>
      </template>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Nomor SK" class="sm:col-span-2">
          <UInput v-model="skbm.nomor" placeholder="mis. 800.1.11/Kep.002/Disdik-SDN/2026" class="w-full" />
        </UFormField>
        <UFormField label="Tanggal penetapan">
          <UInput v-model="skbm.tanggal" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Ditetapkan di" :hint="`Kosong = ${tempatBawaan}`">
          <UInput v-model="skbm.tempat" :placeholder="tempatBawaan" class="w-full" />
        </UFormField>
        <UFormField label="Semester">
          <USelect v-model="skbm.semester" :items="semesterItems" class="w-full" />
        </UFormField>
        <UFormField label="Tahun ajaran">
          <USelect v-model="skbm.tahunAjaran" :items="tahunItems" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold">Pengawas pembina (verifikator & penilai)</p>
          <UBadge color="neutral" variant="subtle" label="Tersimpan di Profil" />
        </div>
      </template>
      <div class="grid gap-3 sm:grid-cols-2">
        <UFormField label="Nama & gelar" class="sm:col-span-2">
          <UInput v-model="profil.pengawas" placeholder="mis. Hj. Nama Pengawas, S.Pd., M.Pd." class="w-full" />
        </UFormField>
        <UFormField label="NIP">
          <UInput v-model="profil.nipPengawas" class="w-full font-mono" />
        </UFormField>
        <UFormField label="Pangkat/golongan">
          <UInput v-model="profil.pangkatPengawas" placeholder="mis. Pembina Utama Tk. I, IV/c" class="w-full" />
        </UFormField>
      </div>
      <p class="mt-3 text-xs text-muted">
        Kepala sekolah: <span class="font-medium text-highlighted">{{ profil.kepsek || '-' }}</span> (NIP {{ profil.nipKepsek || '-' }}).
        Pangkat kepala sekolah diambil dari tab Guru & Tugas.
      </p>
    </UCard>

    <UCard class="lg:col-span-2">
      <template #header>
        <p class="font-semibold">Isi keputusan</p>
      </template>
      <div class="space-y-4">
        <UFormField label="Menimbang" help="Satu butir per baris. {sekolah} diganti nama sekolah.">
          <UTextarea v-model="skbm.menimbang" :rows="2" autoresize class="w-full" />
        </UFormField>
        <UFormField :label="`Mengingat (${jumlahMengingat} dasar hukum)`" help="Satu dasar hukum per baris; nomor urut ditambahkan otomatis. Cocokkan dengan peraturan terbaru sebelum ditandatangani.">
          <UTextarea v-model="skbm.mengingat" :rows="8" class="w-full" />
          <template #hint>
            <UButton size="xs" variant="link" color="neutral" label="Kembalikan bawaan" @click="skbm.mengingat = MENGINGAT_BAWAAN.join('\n')" />
          </template>
        </UFormField>
        <UFormField label="Tembusan" help="Satu per baris. {kabupaten} diganti nama kabupaten.">
          <UTextarea v-model="skbm.tembusan" :rows="2" autoresize class="w-full" />
        </UFormField>
        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-list-ordered"
          title="Diktum disusun otomatis"
          description="Pertama: Lampiran I & II (pembagian tugas & jam). Kedua: Lampiran III (bimbingan). Ketiga: Lampiran IV (pengelolaan kinerja). Keempat sampai Keenam: kewajiban melapor, pembiayaan, dan masa berlaku."
        />
      </div>
    </UCard>
  </div>
</template>
