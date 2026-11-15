<script setup lang="ts">
// Tab "Daftar Absen Kelas". State & aksi dibagi dengan halaman lewat pakaiDaftar1Halaman().
const {
  daftar1,
  filterKelasAbsen,
  rekap,
  kelasAbsenOptions,
  siswaAbsenKelas,
} = pakaiDaftar1Halaman()
</script>

<template>
<UCard
  :ui="{ body: 'space-y-3 overflow-x-auto' }"
>
  <template #header>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="font-semibold">Daftar Hadir Siswa Bulanan (Siap Cetak / Ekspor Excel)</p>
        <p class="text-xs text-muted">
          Bulan {{ daftar1.bulan }} {{ daftar1.tahun }} | Hari Efektif: {{ rekap.hariEfektifBulanIni }} Hari
        </p>
      </div>
      <div class="no-print flex items-center gap-2">
        <USelect
          v-model="filterKelasAbsen"
          :items="kelasAbsenOptions"
          size="sm"
          class="w-40"
        />
      </div>
    </div>
  </template>

  <table class="w-full border-collapse text-[11px] tabular-nums">
    <thead>
      <tr class="bg-elevated/60 text-center">
        <th class="border border-default px-1.5 py-1.5 w-8">No</th>
        <th class="border border-default px-2 py-1.5 text-left min-w-44">Nama Siswa</th>
        <th class="border border-default px-1 py-1.5 w-8">L/P</th>
        <th
          v-for="tgl in 31"
          :key="`d-${tgl}`"
          class="border border-default px-1 py-1.5 min-w-5"
        >
          {{ tgl }}
        </th>
        <th class="border border-default px-1.5 py-1.5 w-7">S</th>
        <th class="border border-default px-1.5 py-1.5 w-7">I</th>
        <th class="border border-default px-1.5 py-1.5 w-7">A</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(s, idx) in siswaAbsenKelas"
        :key="s.key"
      >
        <td class="border border-default px-1.5 py-1 text-center">{{ idx + 1 }}</td>
        <td class="border border-default px-2 py-1 font-medium whitespace-nowrap">{{ s.nama }}</td>
        <td class="border border-default px-1 py-1 text-center">{{ s.jk }}</td>
        <td
          v-for="tgl in 31"
          :key="`${s.key}-${tgl}`"
          class="border border-default px-1 py-1"
        />
        <td class="border border-default px-1 py-1" />
        <td class="border border-default px-1 py-1" />
        <td class="border border-default px-1 py-1" />
      </tr>
    </tbody>
  </table>
</UCard>
</template>
