<script setup lang="ts">
import type { BulanDaftar1 } from '~/utils/daftar1'

// Tab "Data Usia & BB/TB" siswa. State & aksi dibagi dengan halaman lewat pakaiDaftar1Halaman().
const {
  BULAN_TAHUN_AJARAN,
  ROMAWI_MAP,
  daftar1,
  filterKelasSiswa,
  cariSiswa,
  tambahSiswaModalOpen,
  kelasOptions,
  agamaOptions,
  siswaTersaring,
  setBbTbSiswa,
  setAgamaSiswa,
  perbaruiTglLahirSiswa,
  hapusSiswaManual,
} = pakaiDaftar1Halaman()
</script>

<template>
<div
  class="space-y-6"
>
  <UCard :ui="{ body: 'space-y-4' }">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="font-semibold">Data Usia, Berat Badan & Tinggi Badan Siswa ({{ siswaTersaring.length }})</p>
          <p class="text-xs text-muted">
            Umur dihitung otomatis dari tanggal lahir pada akhir bulan {{ daftar1.bulan }} {{ daftar1.tahun }} (identik dengan rumus Excel BB TB & DATA USIA SISWA).
          </p>
        </div>
        <UButton
          size="sm"
          color="primary"
          variant="soft"
          icon="i-lucide-user-plus"
          label="Tambah Siswa Manual"
          @click="tambahSiswaModalOpen = true"
        />
      </div>
    </template>

    <div class="flex flex-wrap gap-2">
      <UInput
        v-model="cariSiswa"
        icon="i-lucide-search"
        placeholder="Cari nama, NISN, atau NIK..."
        size="sm"
        class="w-full sm:w-64"
      />
      <USelect
        v-model="filterKelasSiswa"
        :items="kelasOptions"
        size="sm"
        class="w-44"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr class="bg-elevated/60 text-left">
            <th class="border border-default px-2 py-1.5 text-center w-10">No</th>
            <th class="border border-default px-2 py-1.5 min-w-52">Nama Siswa</th>
            <th class="border border-default px-2 py-1.5 text-center w-12">L/P</th>
            <th class="border border-default px-2 py-1.5 w-36">Tanggal Lahir</th>
            <th class="border border-default px-2 py-1.5 text-center w-16">Kelas</th>
            <th class="border border-default px-2 py-1.5 text-center w-20">Usia (Thn)</th>
            <th class="border border-default px-2 py-1.5 text-center w-24">BB (kg)</th>
            <th class="border border-default px-2 py-1.5 text-center w-24">TB (cm)</th>
            <th class="border border-default px-2 py-1.5 w-32">Agama</th>
            <th class="border border-default px-2 py-1.5 text-center w-20">Sumber</th>
            <th class="no-print border border-default px-2 py-1.5 text-center w-14">Aksi</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr
            v-for="(s, idx) in siswaTersaring"
            :key="s.key"
            class="hover:bg-elevated/25"
          >
            <td class="border border-default px-2 py-1 text-center">{{ idx + 1 }}</td>
            <td class="border border-default px-2 py-1 font-medium">
              <p>{{ s.nama }}</p>
              <p
                v-if="s.nisn"
                class="text-[11px] text-muted"
              >
                NISN {{ s.nisn }}
              </p>
            </td>
            <td class="border border-default px-2 py-1 text-center">{{ s.jk }}</td>
            <td class="border border-default px-2 py-1 text-center">
              <span
                v-if="s.sumber === 'sptjm' && s.tglLahir"
                class="text-default"
                title="Otomatis dari SPTJM"
              >
                {{ s.tglLahir }}
              </span>
              <UInput
                v-else
                :model-value="s.tglLahir"
                type="date"
                size="xs"
                @update:model-value="val => perbaruiTglLahirSiswa(s, String(val || ''))"
              />
            </td>
            <td class="border border-default px-2 py-1 text-center">{{ ROMAWI_MAP[s.tingkat] }} ({{ s.tingkat }})</td>
            <td class="border border-default px-2 py-1 text-center font-semibold">
              {{ s.usia ?? '-' }}
            </td>
            <td class="border border-default p-1">
              <UInput
                :model-value="s.bb ?? undefined"
                type="number"
                step="0.5"
                min="0"
                size="xs"
                placeholder="-"
                @update:model-value="val => setBbTbSiswa(s, 'bb', val)"
              />
            </td>
            <td class="border border-default p-1">
              <UInput
                :model-value="s.tb ?? undefined"
                type="number"
                step="0.5"
                min="0"
                size="xs"
                placeholder="-"
                @update:model-value="val => setBbTbSiswa(s, 'tb', val)"
              />
            </td>
            <td class="border border-default p-1">
              <USelect
                :model-value="s.agama || 'islam'"
                :items="agamaOptions"
                size="xs"
                @update:model-value="val => setAgamaSiswa(s, val as AgamaKey)"
              />
            </td>
            <td class="border border-default px-2 py-1 text-center">
              <UBadge
                :color="s.sumber === 'sptjm' ? 'success' : 'neutral'"
                variant="subtle"
                size="xs"
                :label="s.sumber === 'sptjm' ? 'SPTJM' : 'Lokal'"
              />
            </td>
            <td class="no-print border border-default px-1 py-1 text-center">
              <UButton
                v-if="s.sumber !== 'sptjm'"
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                aria-label="Hapus siswa"
                @click="hapusSiswaManual(s)"
              />
              <span
                v-else
                class="text-muted"
              >-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>

  <UCard :ui="{ body: 'grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6' }">
    <template #header>
      <p class="font-semibold text-sm">Kalender Hari Efektif per Bulan ({{ daftar1.tahunPelajaran }})</p>
    </template>
    <UFormField
      v-for="bln in BULAN_TAHUN_AJARAN"
      :key="bln"
      :label="bln"
    >
      <UInput
        v-model.number="daftar1.hariEfektif[bln as BulanDaftar1]"
        type="number"
        min="0"
        max="31"
        size="xs"
      />
    </UFormField>
  </UCard>
</div>
</template>
