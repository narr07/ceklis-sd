<script setup lang="ts">
import {
  AGAMA_LIST,
  ROMAWI_MAP,
  TINGKAT_LIST,
  formatTtlDaftar1,
} from '~/utils/daftar1'
import type {
  Daftar1GuruRow,
  Daftar1State,
  RekapDaftar1,
} from '~/utils/daftar1'
import { namaSekolahPendek } from '~/utils/profil'
import type { Profil } from '~/utils/profil'

const props = defineProps<{
  profil: Profil
  daftar1: Daftar1State
  rekap: RekapDaftar1
  ukuranKertas: 'A4' | 'F4'
}>()

const isA4 = computed(() => props.ukuranKertas === 'A4')

const kodeNegeri = computed(() =>
  props.daftar1.sarpras.statusKepemilikanSekolah.startsWith('1') ? '1' : '2',
)
const kodeInti = computed(() =>
  props.daftar1.sarpras.kategoriWilayahSekolah.startsWith('1') ? '1' : '2',
)
const kodeDesa = computed(() =>
  props.daftar1.sarpras.kategoriDesa.startsWith('1') ? '1' : '2',
)

const tanggalTtd = computed(() => tanggalTtdDaftar1(props.profil, props.daftar1))

const jabatanTtd = computed(() => `Kepala ${namaSekolahPendek(props.profil)}`)
const kepsekGuru = computed(() =>
  props.rekap.guru.find(g => g.jabatanDaftar1.toUpperCase().includes('KEPALA')),
)
const namaKepsekTtd = computed(() => kepsekGuru.value?.nama || props.profil.kepsek)
const nipKepsekTtd = computed(() => {
  const nip = kepsekGuru.value?.nip
  return nip && nip !== '-' ? nip : props.profil.nipKepsek
})

function fmtAngka(n: number | null | undefined): string {
  if (!n || n === 0) return '-'
  return String(n)
}

function fmtRibuan(n: number | null | undefined): string {
  if (!n || n === 0) return '-'
  return n.toLocaleString('id-ID')
}

function fmtDesimalPersen(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} % Hadir`
}

function fmtNipNuptk(g: Daftar1GuruRow): string {
  if (g.nip && g.nip !== '-') return g.nip
  if (g.nuptk && g.nuptk !== '-') return g.nuptk
  return '-'
}
</script>

<template>
  <div
    class="d1-print-sheet"
    :class="isA4 ? 'd1-kertas-a4' : 'd1-kertas-f4'"
  >
    <!-- HALAMAN 1: GURU - GURU (19 KOLOM) -->
    <section class="d1-page d1-page-1">
      <h2 class="d1-title-guru">GURU - GURU</h2>

      <table class="d1-tbl-guru">
        <thead>
          <tr>
            <th
              rowspan="2"
              class="d1-th-v w-no"
            >
              <span class="d1-lbl-screen">No</span>
              <div class="d1-vhead d1-lbl-print">No. Urut</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-nama"
            >
              <span class="d1-lbl-screen">Nama Guru &amp; TTL</span>
              <div class="d1-vhead d1-lbl-print">NAMA GURU-GURU<br>TEMPAT TANGGAL LAHIR</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-nip"
            >
              <span class="d1-lbl-screen">NIP / NUPTK</span>
              <div class="d1-vhead d1-lbl-print">NIP/NUPTK/KARPEG</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-jk"
            >
              <span class="d1-lbl-screen">L/P</span>
              <div class="d1-vhead d1-lbl-print">Jenis Kelamin</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-agama"
            >
              <span class="d1-lbl-screen">Agama</span>
              <div class="d1-vhead d1-lbl-print">Agama</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-kawin"
            >
              <span class="d1-lbl-screen">K/TK</span>
              <div class="d1-vhead d1-lbl-print">Kawin/Tidak Kawin</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-anak"
            >
              <span class="d1-lbl-screen">Anak<br>&lt;18</span>
              <div class="d1-vhead d1-lbl-print">Anak di bawah umur<br>18 Tahun</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-ijazah"
            >
              <span class="d1-lbl-screen">Ijazah<br>&amp; Thn</span>
              <div class="d1-vhead d1-lbl-print">Ijazah dan tahunnya</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-jabatan"
            >
              <span class="d1-lbl-screen">Jabatan</span>
              <div class="d1-vhead d1-lbl-print">Jabatan</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-mk"
            >
              <span class="d1-lbl-screen">Masa<br>Kerja</span>
              <div class="d1-vhead d1-lbl-print">Masa Kerja Seluruhnya<br>yang bisa dihitung<br>untuk pensiun</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-tmt"
            >
              <span class="d1-lbl-screen">TMT<br>Sekolah</span>
              <div class="d1-vhead d1-lbl-print">Mulai diangkat/Mulai<br>bekerja di sekolah ini</div>
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-kelas"
            >
              <span class="d1-lbl-screen">Kls</span>
              <div class="d1-vhead d1-lbl-print">Mengajar di kelas</div>
            </th>
            <th
              rowspan="2"
              class="w-sk"
            >
              Tanggal dan No. SK<br>terakhir
            </th>
            <th
              rowspan="2"
              class="d1-th-v w-gol"
            >
              <span class="d1-lbl-screen">Gol</span>
              <div class="d1-vhead d1-lbl-print">Golongan / Ruangan</div>
            </th>
            <th
              rowspan="2"
              class="w-gaji"
            >
              Gaji pokok<br>Rp.
            </th>
            <th colspan="3">Absen Guru</th>
            <th
              rowspan="2"
              class="w-ket"
            >
              KETERANGAN
            </th>
          </tr>
          <tr>
            <th class="d1-th-v d1-th-v-sm w-abs">
              <span class="d1-lbl-screen">S</span>
              <div class="d1-vhead d1-lbl-print">Sakit</div>
            </th>
            <th class="d1-th-v d1-th-v-sm w-abs">
              <span class="d1-lbl-screen">I</span>
              <div class="d1-vhead d1-lbl-print">Izin</div>
            </th>
            <th class="d1-th-v d1-th-v-sm w-abs">
              <span class="d1-lbl-screen">L</span>
              <div class="d1-vhead d1-lbl-print">Lain-lain</div>
            </th>
          </tr>
          <tr class="d1-col-num">
            <th
              v-for="idx in 19"
              :key="`col-${idx}`"
            >
              {{ idx }}
            </th>
          </tr>
        </thead>

        <tbody>
          <template
            v-for="g in rekap.guru"
            :key="g.key"
          >
            <tr class="d1-guru-top">
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.no }}
              </td>
              <td class="d1-split-top text-left font-bold">
                {{ g.nama }}
              </td>
              <td
                rowspan="2"
                class="text-center d1-num-cell"
              >
                {{ fmtNipNuptk(g) }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.jk }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.agama || 'ISLAM' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.kawin || '-' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.anakDibawah18 && g.anakDibawah18 !== '0' ? g.anakDibawah18 : '-' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.ijazahTahun || '-' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.jabatanDaftar1 || '-' }}
              </td>
              <td class="d1-split-top text-center">
                {{ g.masaKerjaTahun }} Thn
              </td>
              <td class="d1-split-top text-center">
                {{ g.tmtDiangkat || '-' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.mengajarKelas || '-' }}
              </td>
              <td class="d1-split-top text-center">
                {{ g.tglSkTerakhir || '-' }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ g.golongan || '-' }}
              </td>
              <td
                rowspan="2"
                class="text-right tabular-nums"
              >
                {{ fmtRibuan(g.gajiPokok) }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ fmtAngka(g.absenSakit) }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ fmtAngka(g.absenIzin) }}
              </td>
              <td
                rowspan="2"
                class="text-center"
              >
                {{ fmtAngka(g.absenLain) }}
              </td>
              <td
                rowspan="2"
                class="text-center font-medium"
              >
                {{ g.keterangan || '-' }}
              </td>
            </tr>
            <tr class="d1-guru-bot">
              <td class="d1-split-bot text-left">
                {{ formatTtlDaftar1(g.tempatLahir, g.tglLahir) }}
              </td>
              <td class="d1-split-bot text-center">
                {{ String(g.masaKerjaBulan).padStart(2, '0') }} Bln
              </td>
              <td class="d1-split-bot text-center">
                {{ g.tmtSekolahIni || '-' }}
              </td>
              <td class="d1-split-bot text-center d1-sk-no">
                {{ g.noSkTerakhir || '-' }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="d1-ttd-wrap">
        <div class="d1-ttd-box">
          <p>{{ tanggalTtd }}</p>
          <p>{{ jabatanTtd }}</p>
          <div class="d1-ttd-space" />
          <p class="font-bold underline">{{ namaKepsekTtd }}</p>
          <p>NIP {{ nipKepsekTtd }}</p>
        </div>
      </div>
    </section>

    <!-- HALAMAN 2: LAPORAN BULANAN SEKOLAH DASAR (DAFTAR 1) -->
    <section class="d1-page d1-page-2">
      <div class="d1-hdr-l2">
        <h2>LAPORAN BULANAN SEKOLAH DASAR (DAFTAR 1)</h2>
        <div class="d1-subhdr-l2">
          <span>Tahun Pelajaran : <strong>{{ daftar1.tahunPelajaran }}</strong></span>
          <span>Bulan : <strong>{{ daftar1.bulan }} {{ daftar1.tahun }}</strong></span>
        </div>
      </div>

      <div class="d1-two-col">
        <!-- KOLOM KIRI: IDENTITAS + MURID + UMUR + AGAMA -->
        <div class="d1-col-left">
          <div class="d1-id-box">
            <div class="d1-id-grid">
              <div>SEKOLAH DASAR</div>
              <div>: <strong>{{ profil.sekolah }}</strong></div>
              <div>Alamat</div>
              <div>: {{ profil.alamat }}</div>

              <div>Tahun Pendirian</div>
              <div>: {{ daftar1.sarpras.tahunPendirian || '-' }}</div>
              <div>Jalan/Nomor Telp</div>
              <div>: {{ profil.dapodik?.telepon || '-' }}</div>

              <div>NSS / NPSN</div>
              <div>: {{ daftar1.sarpras.nss || '-' }} / {{ profil.npsn || '-' }}</div>
              <div>Desa/Kelurahan *)</div>
              <div>: {{ profil.desa }}</div>
            </div>

            <div class="d1-status-grid">
              <div class="d1-status-left">
                <div class="d1-status-row">
                  <span>Status : a.</span>
                  <span class="d1-code-box">{{ kodeNegeri }}</span>
                  <span>1. Negeri</span>
                  <span>2. Swasta</span>
                </div>
                <div class="d1-status-row d1-status-indent">
                  <span>b.</span>
                  <span class="d1-code-box">{{ kodeInti }}</span>
                  <span>1. Inti</span>
                  <span>2. Imbas</span>
                </div>
              </div>
              <div class="d1-status-right">
                <div class="d1-status-row">
                  <span>Kategori Desa / Kelurahan *) :</span>
                  <span class="d1-code-box">{{ kodeDesa }}</span>
                  <span>1. IDT</span>
                  <span>2. Non IDT</span>
                </div>
                <div>Kecamatan : {{ profil.kecamatan }}</div>
                <div>Kabupaten / Propinsi : {{ profil.kabupaten }} / {{ profil.dapodik?.propinsi || 'Jawa Barat' }}</div>
              </div>
            </div>
          </div>

          <!-- BANYAKNYA MURID -->
          <table class="d1-tbl-l2 d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="3"
                  class="d1-lbl-col"
                >
                  BANYAKNYA MURID
                </th>
                <th
                  v-for="t in TINGKAT_LIST"
                  :key="`m-r-${t}`"
                  colspan="2"
                >
                  {{ ROMAWI_MAP[t] }}
                </th>
                <th colspan="2">Jumlah</th>
                <th
                  rowspan="3"
                  class="d1-tot-col"
                >
                  Jumlah
                </th>
              </tr>
              <tr>
                <th
                  v-for="t in TINGKAT_LIST"
                  :key="`m-b-${t}`"
                  colspan="2"
                >
                  1 Bag
                </th>
                <th colspan="2">6 Bag</th>
              </tr>
              <tr>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`m-lp-${t}`"
                >
                  <th>L</th>
                  <th>P</th>
                </template>
                <th>L</th>
                <th>P</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left">Jumlah Bulan Lalu</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`m-bl-${t}`"
                >
                  <td>{{ fmtAngka(rekap.perKelas[t].bulanLaluL) }}</td>
                  <td>{{ fmtAngka(rekap.perKelas[t].bulanLaluP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalKelas.bulanLaluL) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.bulanLaluP) }}</td>
                <td class="font-bold">{{ fmtAngka(rekap.totalKelas.bulanLaluL + rekap.totalKelas.bulanLaluP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Keluar Dalam Bulan Ini</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`m-kl-${t}`"
                >
                  <td>{{ fmtAngka(rekap.perKelas[t].keluarL) }}</td>
                  <td>{{ fmtAngka(rekap.perKelas[t].keluarP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalKelas.keluarL) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.keluarP) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.keluarL + rekap.totalKelas.keluarP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Masuk Dalam Bulan Ini</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`m-ms-${t}`"
                >
                  <td>{{ fmtAngka(rekap.perKelas[t].masukL) }}</td>
                  <td>{{ fmtAngka(rekap.perKelas[t].masukP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalKelas.masukL) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.masukP) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.masukL + rekap.totalKelas.masukP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Jumlah Penghabisan</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`m-ph-${t}`"
                >
                  <td>{{ fmtAngka(rekap.perKelas[t].penghabisanL) }}</td>
                  <td>{{ fmtAngka(rekap.perKelas[t].penghabisanP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalKelas.penghabisanL) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.penghabisanP) }}</td>
                <td class="font-bold">{{ fmtAngka(rekap.totalKelas.total) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="text-left">Jumlah Bulan Ini</td>
                <td
                  v-for="t in TINGKAT_LIST"
                  :key="`m-bi-${t}`"
                  colspan="2"
                >
                  {{ fmtAngka(rekap.perKelas[t].total) }}
                </td>
                <td colspan="2">{{ fmtAngka(rekap.totalKelas.total) }}</td>
                <td>{{ fmtAngka(rekap.totalKelas.total) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- BANYAKNYA MURID MENURUT UMUR -->
          <table class="d1-tbl-l2 d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="d1-lbl-col"
                >
                  BANYAKNYA MURID<br>MENURUT UMUR
                </th>
                <th
                  v-for="t in TINGKAT_LIST"
                  :key="`u-r-${t}`"
                  colspan="2"
                >
                  {{ ROMAWI_MAP[t] }}
                </th>
                <th colspan="2">Jumlah</th>
                <th
                  rowspan="2"
                  class="d1-tot-col"
                >
                  Jumlah
                </th>
              </tr>
              <tr>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`u-lp-${t}`"
                >
                  <th>L</th>
                  <th>P</th>
                </template>
                <th>L</th>
                <th>P</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rekap.umurRows"
                :key="`u-row-${row.umur}`"
              >
                <td class="text-left">{{ row.umur }} tahun</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`u-c-${row.umur}-${t}`"
                >
                  <td>{{ fmtAngka(row.perKelas[t].l) }}</td>
                  <td>{{ fmtAngka(row.perKelas[t].p) }}</td>
                </template>
                <td>{{ fmtAngka(row.totalL) }}</td>
                <td>{{ fmtAngka(row.totalP) }}</td>
                <td>{{ fmtAngka(row.total) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="text-left">Jumlah</td>
                <template
                  v-for="t in TINGKAT_LIST"
                  :key="`u-jl-${t}`"
                >
                  <td>{{ fmtAngka(rekap.umurJumlahPerKelas[t].l) }}</td>
                  <td>{{ fmtAngka(rekap.umurJumlahPerKelas[t].p) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.umurGrandTotal.l) }}</td>
                <td>{{ fmtAngka(rekap.umurGrandTotal.p) }}</td>
                <td>{{ fmtAngka(rekap.umurGrandTotal.total) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="text-left" />
                <td
                  v-for="t in TINGKAT_LIST"
                  :key="`u-jt-${t}`"
                  colspan="2"
                >
                  {{ fmtAngka(rekap.umurJumlahPerKelas[t].total) }}
                </td>
                <td colspan="2">{{ fmtAngka(rekap.umurGrandTotal.total) }}</td>
                <td />
              </tr>
            </tbody>
          </table>

          <!-- BANYAKNYA MURID MENURUT AGAMA -->
          <table class="d1-tbl-l2 d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="d1-lbl-col"
                >
                  BANYAKNYA MURID<br>MENURUT AGAMA
                </th>
                <th
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-h-${ag.key}`"
                  colspan="2"
                >
                  {{ ag.label }}
                </th>
                <th colspan="2">Jumlah</th>
                <th
                  rowspan="2"
                  class="d1-tot-col"
                >
                  Jumlah<br>Semua
                </th>
              </tr>
              <tr>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-lp-${ag.key}`"
                >
                  <th>L</th>
                  <th>P</th>
                </template>
                <th>L</th>
                <th>P</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left">Jumlah Bulan Lalu</td>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-bl-${ag.key}`"
                >
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].bulanLaluL) }}</td>
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].bulanLaluP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalAgama.bulanLaluL) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.bulanLaluP) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.bulanLaluL + rekap.totalAgama.bulanLaluP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Keluar Dalam Bulan Ini</td>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-kl-${ag.key}`"
                >
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].keluarL) }}</td>
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].keluarP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalAgama.keluarL) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.keluarP) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.keluarL + rekap.totalAgama.keluarP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Masuk Dalam Bulan Ini</td>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-ms-${ag.key}`"
                >
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].masukL) }}</td>
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].masukP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalAgama.masukL) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.masukP) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.masukL + rekap.totalAgama.masukP) }}</td>
              </tr>
              <tr>
                <td class="text-left">Jumlah Penghabisan</td>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-ph-${ag.key}`"
                >
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].penghabisanL) }}</td>
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].penghabisanP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalAgama.penghabisanL) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.penghabisanP) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.total) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="text-left">Jumlah Bulan Ini</td>
                <template
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-bi-${ag.key}`"
                >
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].penghabisanL) }}</td>
                  <td>{{ fmtAngka(rekap.perAgama[ag.key].penghabisanP) }}</td>
                </template>
                <td>{{ fmtAngka(rekap.totalAgama.penghabisanL) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.penghabisanP) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.total) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="text-left" />
                <td
                  v-for="ag in AGAMA_LIST"
                  :key="`ag-tot-${ag.key}`"
                  colspan="2"
                >
                  {{ fmtAngka(rekap.perAgama[ag.key].total) }}
                </td>
                <td colspan="2">{{ fmtAngka(rekap.totalAgama.total) }}</td>
                <td>{{ fmtAngka(rekap.totalAgama.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- KOLOM KANAN: A. TANAH .. I. ABSENSI MURID -->
        <div class="d1-col-right">
          <!-- A. TANAH -->
          <table class="d1-tbl-r">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="text-left d1-r-label"
                >
                  A. TANAH
                </th>
                <th>Luasnya (m²)</th>
                <th>No. Persil</th>
                <th>Tahun Pembelian</th>
                <th>Harga Rp.</th>
              </tr>
              <tr>
                <td>{{ fmtAngka(daftar1.sarpras.tanahLuasM2) }}</td>
                <td>{{ daftar1.sarpras.tanahNoPersil || '-' }}</td>
                <td>{{ daftar1.sarpras.tanahTahun || '-' }}</td>
                <td>{{ fmtRibuan(daftar1.sarpras.tanahHarga) }}</td>
              </tr>
            </thead>
          </table>

          <!-- B. BANGUNAN / RUANGAN & C. MENYEWA -->
          <table class="d1-tbl-r d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="text-left d1-r-label"
                >
                  B. BANGUNAN / RUANGAN
                </th>
                <th colspan="2">Baik</th>
                <th colspan="2">Sedang</th>
                <th colspan="2">Rusak</th>
                <th colspan="2">Jumlah</th>
              </tr>
              <tr>
                <th>Bgn</th>
                <th>Rgn</th>
                <th>Bgn</th>
                <th>Rgn</th>
                <th>Bgn</th>
                <th>Rgn</th>
                <th>Bgn</th>
                <th>Rgn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-left" />
                <td>{{ fmtAngka(daftar1.sarpras.bangunanBaik.bgn) }}</td>
                <td>{{ fmtAngka(daftar1.sarpras.bangunanBaik.rgn) }}</td>
                <td>{{ fmtAngka(daftar1.sarpras.bangunanSedang.bgn) }}</td>
                <td>{{ fmtAngka(daftar1.sarpras.bangunanSedang.rgn) }}</td>
                <td>{{ fmtAngka(daftar1.sarpras.bangunanRusak.bgn) }}</td>
                <td>{{ fmtAngka(daftar1.sarpras.bangunanRusak.rgn) }}</td>
                <td class="font-bold">{{ fmtAngka(rekap.bangunanJumlah.bgn) }}</td>
                <td class="font-bold">{{ fmtAngka(rekap.bangunanJumlah.rgn) }}</td>
              </tr>
              <tr>
                <td
                  colspan="9"
                  class="text-left"
                >
                  <strong>C. MENYEWA PERBULAN</strong> Rp. {{ daftar1.sarpras.menyewaRp > 0 ? daftar1.sarpras.menyewaRp.toLocaleString('id-ID') : '…………' }}
                  / MENUMPANG DI SD {{ daftar1.sarpras.menumpangDi && daftar1.sarpras.menumpangDi !== '-' ? daftar1.sarpras.menumpangDi : '…………' }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- D. JENIS / SIFAT BANGUNAN & E. PEKAKAS AIR BERSIH -->
          <table class="d1-tbl-r d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="text-left d1-r-label"
                >
                  D. JENIS / SIFAT BANGUNAN<br>
                  <span class="font-normal">(P = Permanen, SP = Semi<br>Permanen, Dr = Darurat)</span>
                </th>
                <th rowspan="2">P</th>
                <th rowspan="2">SP</th>
                <th rowspan="2">Dr</th>
                <th colspan="3">Tahun Pendirian</th>
                <th rowspan="2">Harga Rp.</th>
              </tr>
              <tr>
                <th>P</th>
                <th>SP</th>
                <th>Dr</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="jb in daftar1.sarpras.jenisBangunan"
                :key="`jb-${jb.nama}`"
              >
                <td class="text-left">{{ jb.nama }}</td>
                <td>{{ fmtAngka(jb.permanen) }}</td>
                <td>{{ fmtAngka(jb.semi) }}</td>
                <td>{{ fmtAngka(jb.darurat) }}</td>
                <td>{{ jb.tahunP || '-' }}</td>
                <td>{{ jb.tahunSp || '-' }}</td>
                <td>{{ jb.tahunDr || '-' }}</td>
                <td>{{ fmtRibuan(jb.hargaRp) }}</td>
              </tr>
              <tr>
                <td class="text-left font-bold">E. PEKAKAS AIR BERSIH</td>
                <td
                  colspan="7"
                  class="text-center font-bold"
                >
                  {{ daftar1.sarpras.airBersih || '-' }} *)
                </td>
              </tr>
            </tbody>
          </table>

          <!-- F. PEKAKAS / MEBELER -->
          <table class="d1-tbl-r d1-stacked">
            <thead>
              <tr>
                <th class="text-left d1-r-label">F. PEKAKAS / MEBELER</th>
                <th>Baik</th>
                <th>Sedang</th>
                <th>Rusak</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in rekap.mebelerTotal"
                :key="`meb-${m.nama}`"
              >
                <td class="text-left">{{ m.nama }}</td>
                <td>{{ fmtAngka(m.baik) }}</td>
                <td>{{ fmtAngka(m.sedang) }}</td>
                <td>{{ fmtAngka(m.rusak) }}</td>
                <td class="font-bold">{{ fmtAngka(m.jumlah) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- G. Jumlah Guru -->
          <table class="d1-tbl-r d1-stacked">
            <thead>
              <tr>
                <th
                  rowspan="2"
                  class="text-left"
                >
                  G. Jumlah Guru
                </th>
                <th>Kepala<br>Sekolah</th>
                <th>Guru<br>Kelas</th>
                <th>Guru<br>Agama</th>
                <th>Guru<br>Penjas</th>
                <th>Guru<br>Kelas<br>TKS</th>
                <th>Guru<br>Tendik</th>
                <th>Jumlah</th>
              </tr>
              <tr class="font-bold">
                <td>{{ fmtAngka(rekap.jumlahGuru.kepalaSekolah) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.guruKelas) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.guruAgama) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.guruPenjas) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.guruKelasTks) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.tendik) }}</td>
                <td>{{ fmtAngka(rekap.jumlahGuru.jumlah) }}</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colspan="6"
                  class="text-left font-bold"
                >
                  H. Hari Efektif
                </td>
                <td
                  colspan="2"
                  class="font-bold"
                >
                  {{ rekap.hariEfektifBulanIni }} Hari
                </td>
              </tr>
              <tr>
                <td
                  colspan="8"
                  class="text-left font-bold"
                >
                  I. ABSENSI MURID
                </td>
              </tr>
              <tr>
                <td
                  colspan="4"
                  class="text-center font-bold align-middle"
                >
                  Presentase Kehadiran<br>
                  <span class="d1-big-abs">{{ rekap.absensi.rataHadir }} Orang</span><br>
                  {{ fmtDesimalPersen(rekap.absensi.persenHadir) }}
                </td>
                <td
                  colspan="4"
                  class="p-0"
                >
                  <table class="d1-abs-sub">
                    <tbody>
                      <tr>
                        <td class="text-left">Sakit</td>
                        <td>:</td>
                        <td class="text-right font-bold">{{ fmtAngka(rekap.absensi.sakit) }} Orang</td>
                      </tr>
                      <tr>
                        <td class="text-left">Ijin</td>
                        <td>:</td>
                        <td class="text-right font-bold">{{ fmtAngka(rekap.absensi.ijin) }} Orang</td>
                      </tr>
                      <tr>
                        <td class="text-left">Lain-lain</td>
                        <td>:</td>
                        <td class="text-right font-bold">{{ fmtAngka(rekap.absensi.lainLain) }} Orang</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.d1-print-sheet {
  background: #ffffff;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.15;
  overflow-x: auto;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.d1-page {
  background: #ffffff;
  color: #000000;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #d4d4d8;
  border-radius: 6px;
}

.d1-page-2 {
  margin-top: 20px;
}

/* Penyesuaian skala A4 vs F4 */
.d1-kertas-f4 {
  font-size: 7.2pt;
}

.d1-kertas-a4 {
  font-size: 6.5pt;
}

/* HALAMAN 1: GURU - GURU */
.d1-title-guru {
  text-align: center;
  font-weight: 700;
  font-size: 11pt;
  letter-spacing: 0.4px;
  margin: 0 0 6px;
}

.d1-tbl-guru {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000000;
  font-size: 6.5pt;
}

.d1-tbl-guru th,
.d1-tbl-guru td {
  border: 1px solid #000000;
  padding: 2px 2px;
  vertical-align: middle;
}

.d1-kertas-a4 .d1-tbl-guru th,
.d1-kertas-a4 .d1-tbl-guru td {
  padding: 1.5px 1.5px;
}

.d1-tbl-guru thead th {
  font-weight: 700;
  text-align: center;
}

.d1-th-v {
  height: auto;
  vertical-align: middle !important;
  padding: 3px 2px !important;
}

.d1-th-v-sm {
  height: auto;
}

.d1-lbl-screen {
  display: inline;
  font-size: 6pt;
  line-height: 1.1;
}

.d1-lbl-print {
  display: none;
}

.d1-col-num th {
  font-size: 6.5pt;
  padding: 1px 1px !important;
}

.d1-num-cell {
  font-size: 6.2pt;
  word-break: break-all;
}

.d1-sk-no {
  font-size: 6pt;
  word-break: break-all;
}

.d1-split-top {
  border-bottom: 1px dashed #666666 !important;
}

.d1-split-bot {
  border-top: 0 !important;
}

.w-no { width: 18px; }
.w-nama { width: 112px; }
.w-nip { width: 82px; }
.w-jk { width: 18px; }
.w-agama { width: 28px; }
.w-kawin { width: 22px; }
.w-anak { width: 22px; }
.w-ijazah { width: 38px; }
.w-jabatan { width: 48px; }
.w-mk { width: 36px; }
.w-tmt { width: 48px; }
.w-kelas { width: 22px; }
.w-sk { width: 96px; }
.w-gol { width: 24px; }
.w-gaji { width: 44px; }
.w-abs { width: 18px; }
.w-ket { width: 36px; }

.d1-ttd-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-right: 4%;
}

.d1-ttd-box {
  min-width: 210px;
  text-align: left;
  font-size: 8.5pt;
  line-height: 1.25;
}

.d1-ttd-space {
  height: 40px;
}

/* HALAMAN 2: DAFTAR 1 */
.d1-hdr-l2 {
  text-align: center;
  margin-bottom: 5px;
}

.d1-hdr-l2 h2 {
  margin: 0;
  font-weight: 700;
  font-size: 10.5pt;
}

.d1-subhdr-l2 {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 2px;
  font-size: 8.5pt;
}

.d1-two-col {
  display: grid;
  grid-template-columns: 57.5% 41.5%;
  gap: 1%;
  align-items: start;
}

.d1-id-box {
  border: 1px solid #000000;
  padding: 3px 5px;
  font-size: 7.2pt;
  line-height: 1.25;
}

.d1-kertas-a4 .d1-id-box {
  font-size: 6.5pt;
  padding: 2px 4px;
}

.d1-id-grid {
  display: grid;
  grid-template-columns: auto 1.1fr auto 1fr;
  gap: 1px 6px;
}

.d1-status-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 4px 8px;
  margin-top: 3px;
  padding-top: 3px;
  border-top: 1px solid #000000;
}

.d1-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.d1-status-indent {
  margin-top: 2px;
  padding-left: 34px;
}

.d1-code-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 13px;
  height: 13px;
  border: 1px solid #000000;
  font-weight: 700;
  padding: 0 2px;
}

.d1-tbl-l2,
.d1-tbl-r {
  width: 100%;
  border-collapse: collapse;
  font-size: 7pt;
  text-align: center;
}

.d1-kertas-a4 .d1-tbl-l2,
.d1-kertas-a4 .d1-tbl-r {
  font-size: 6.4pt;
}

.d1-tbl-l2 th,
.d1-tbl-l2 td,
.d1-tbl-r th,
.d1-tbl-r td {
  border: 1px solid #000000;
  padding: 1.5px 2px;
}

.d1-kertas-a4 .d1-tbl-l2 th,
.d1-kertas-a4 .d1-tbl-l2 td,
.d1-kertas-a4 .d1-tbl-r th,
.d1-kertas-a4 .d1-tbl-r td {
  padding: 1px 1.5px;
}

.d1-stacked {
  margin-top: -1px;
}

.d1-lbl-col {
  width: 24%;
  text-align: left !important;
}

.d1-tot-col {
  width: 7%;
}

.d1-r-label {
  width: 34%;
}

.d1-big-abs {
  font-size: 8.5pt;
}

.d1-abs-sub {
  width: 100%;
  border-collapse: collapse;
}

.d1-abs-sub td {
  border: 0 !important;
  border-bottom: 1px solid #000000 !important;
  padding: 1.5px 4px !important;
}

.d1-abs-sub tr:last-child td {
  border-bottom: 0 !important;
}

@media print {
  .d1-print-sheet {
    overflow: visible !important;
    background: #ffffff !important;
  }

  .d1-page {
    min-width: 0 !important;
    width: 100% !important;
    border: 0 !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  .d1-page-2 {
    margin-top: 0 !important;
    break-before: page;
    page-break-before: always;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .d1-kertas-f4 {
    font-size: 8pt;
  }

  .d1-kertas-a4 {
    font-size: 7pt;
  }

  .d1-tbl-guru {
    font-size: inherit;
  }

  .d1-lbl-screen {
    display: none !important;
  }

  .d1-lbl-print {
    display: block !important;
  }

  .d1-th-v {
    height: 88px;
    padding: 3px 1px !important;
  }

  .d1-kertas-a4 .d1-th-v {
    height: 74px;
  }

  .d1-th-v-sm {
    height: 50px;
  }

  .d1-kertas-a4 .d1-th-v-sm {
    height: 42px;
  }

  .d1-vhead {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin: 0 auto;
    white-space: nowrap;
    text-align: left;
    font-size: inherit;
    word-break: normal;
  }
}
</style>
