<script setup lang="ts">
// Tab "Keadaan Guru (19 Kolom)". State & aksi dibagi dengan halaman lewat pakaiDaftar1Halaman().
const {
  formatTtlDaftar1,
  rekap,
  angkaNolAtauStrip,
  bukaEditGuru,
} = pakaiDaftar1Halaman()
</script>

<template>
<UCard
  :ui="{ body: 'p-0 overflow-x-auto' }"
>
  <template #header>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="font-semibold">Daftar Keadaan Guru (Format 19 Kolom)</p>
        <p class="text-xs text-muted">
          Data induk GTK otomatis tersinkron dari SPTJM / Profil sekolah. Klik Edit untuk melengkapi Golongan, Gaji Pokok, TMT, SK, dan Absen Guru.
        </p>
      </div>
      <UBadge
        :color="rekap.sumberGuru === 'sptjm' ? 'success' : 'neutral'"
        variant="subtle"
        :label="`${rekap.guru.length} GTK (${rekap.sumberGuru === 'sptjm' ? 'SPTJM' : 'Profil/Excel'})`"
      />
    </div>
  </template>

  <table class="w-full border-collapse text-xs">
    <thead>
      <tr class="bg-elevated/60 text-center">
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5"
        >
          No
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 text-left min-w-48"
        >
          Nama & Tempat Tanggal Lahir
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-36"
        >
          NIP / NUPTK
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          L/P
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          Agama
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          K/TK
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          Anak &lt;18
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-24"
        >
          Ijazah & Thn
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-28"
        >
          Jabatan
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5"
        >
          Masa Kerja
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-28"
        >
          TMT Diangkat / Sekolah Ini
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          Kelas
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-44"
        >
          Tgl & No. SK Terakhir
        </th>
        <th
          rowspan="2"
          class="border border-default px-1.5 py-1.5"
        >
          Gol
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-24"
        >
          Gaji Pokok
        </th>
        <th
          colspan="3"
          class="border border-default px-1 py-1"
        >
          Absen Guru
        </th>
        <th
          rowspan="2"
          class="border border-default px-2 py-1.5 min-w-28"
        >
          Ket / Sertifikasi
        </th>
        <th
          rowspan="2"
          class="no-print border border-default px-2 py-1.5"
        >
          Aksi
        </th>
      </tr>
      <tr class="bg-elevated/40 text-center">
        <th class="border border-default px-1.5 py-1">S</th>
        <th class="border border-default px-1.5 py-1">I</th>
        <th class="border border-default px-1.5 py-1">L</th>
      </tr>
    </thead>
    <tbody class="tabular-nums">
      <tr
        v-for="g in rekap.guru"
        :key="g.key"
        class="hover:bg-elevated/25"
      >
        <td class="border border-default px-2 py-1.5 text-center">{{ g.no }}</td>
        <td class="border border-default px-2 py-1.5">
          <p class="font-semibold">{{ g.nama }}</p>
          <p class="text-[11px] text-muted">{{ formatTtlDaftar1(g.tempatLahir, g.tglLahir) }}</p>
        </td>
        <td class="border border-default px-2 py-1.5 text-center">
          <p>{{ g.nip }}</p>
          <p
            v-if="g.nuptk && g.nuptk !== '-'"
            class="text-[11px] text-muted"
          >
            {{ g.nuptk }}
          </p>
        </td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.jk }}</td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.agama }}</td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.kawin }}</td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.anakDibawah18 }}</td>
        <td class="border border-default px-2 py-1.5 text-center">{{ g.ijazahTahun }}</td>
        <td class="border border-default px-2 py-1.5">{{ g.jabatanDaftar1 }}</td>
        <td class="border border-default px-2 py-1.5 text-center">
          <p>{{ g.masaKerjaTahun }} Thn</p>
          <p class="text-[11px] text-muted">{{ String(g.masaKerjaBulan).padStart(2, '0') }} Bln</p>
        </td>
        <td class="border border-default px-2 py-1.5 text-center">
          <p>{{ g.tmtDiangkat }}</p>
          <p class="text-[11px] text-muted">{{ g.tmtSekolahIni }}</p>
        </td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.mengajarKelas }}</td>
        <td class="border border-default px-2 py-1.5">
          <p class="text-center font-medium">{{ g.tglSkTerakhir }}</p>
          <p class="text-[11px] text-muted break-all">{{ g.noSkTerakhir }}</p>
        </td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ g.golongan }}</td>
        <td class="border border-default px-2 py-1.5 text-right">
          {{ g.gajiPokok > 0 ? g.gajiPokok.toLocaleString('id-ID') : '-' }}
        </td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ angkaNolAtauStrip(g.absenSakit) }}</td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ angkaNolAtauStrip(g.absenIzin) }}</td>
        <td class="border border-default px-1.5 py-1.5 text-center">{{ angkaNolAtauStrip(g.absenLain) }}</td>
        <td class="border border-default px-2 py-1.5 text-center">
          <p class="font-medium">{{ g.keterangan }}</p>
          <p class="text-[11px] text-muted">{{ g.tersertifikasi }}</p>
        </td>
        <td class="no-print border border-default px-2 py-1.5 text-center">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            aria-label="Edit GTK"
            @click="bukaEditGuru(g)"
          />
        </td>
      </tr>
    </tbody>
  </table>
</UCard>
</template>
