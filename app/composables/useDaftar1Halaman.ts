import {
  AGAMA_LIST,
  BULAN_DAFTAR1,
  BULAN_TAHUN_AJARAN,
  ROMAWI_MAP,
  TINGKAT_LIST,
  formatTtlDaftar1,
  hitungRekapDaftar1,
  normalisasiKunciGuru,
  normalisasiKunciSiswa,
  TAHUN_DAFTAR1,
  labelAcuanDaftar1,
  periodeBulanIni,
  saranTahunPelajaran,
  tanggalLaporanDaftar1,
} from '~/utils/daftar1'
import type {
  AgamaKey,
  Daftar1GuruMeta,
  Daftar1GuruRow,
  Daftar1SiswaBase,
  Daftar1SiswaRow,
  TingkatKelas,
} from '~/utils/daftar1'
import { buildDaftar1XlsxBlob, parseDaftar1Xlsx } from '~/utils/daftar1Xlsx'
import { DAFTAR1_DEFAULT_SISWA } from '~/data/daftar1Default'
import type { InjectionKey } from 'vue'

/**
 * Seluruh state & aksi halaman Daftar 1. Dibuat sekali oleh halaman (`sediakanDaftar1Halaman`)
 * dan dipakai komponen tab di app/components/daftar1 (`pakaiDaftar1Halaman`).
 */
function buatDaftar1Halaman() {
  const { profil } = useProfil()
  const { daftar1, reset: resetDaftar1 } = useDaftar1()
  const { memproses: memprosesSptjm, imporFileSptjm } = useSptjmImport()
  const toast = useToast()

  // Bulan laporan dipilih bebas (Januari 2020 - Desember 2050); bawaan saat aplikasi dibuka = bulan berjalan.
  // Tahun pelajaran & tanggal tanda tangan (tanggal terakhir bulan) mengikuti pilihan itu.
  const tahunItems = TAHUN_DAFTAR1.map(t => ({ label: String(t), value: t }))
  watch(
    () => [daftar1.value.bulan, daftar1.value.tahun] as const,
    ([bulan, tahun]) => {
      const tp = saranTahunPelajaran(bulan, tahun)
      const tgl = tanggalLaporanDaftar1({ bulan, tahun })
      if (daftar1.value.tahunPelajaran !== tp) daftar1.value.tahunPelajaran = tp
      if (daftar1.value.tanggalLaporan !== tgl) daftar1.value.tanggalLaporan = tgl
    },
    { immediate: true },
  )
  const bulanIni = computed(() => {
    const p = periodeBulanIni()
    return daftar1.value.bulan === p.bulan && daftar1.value.tahun === p.tahun
  })
  function pilihBulanIni() {
    const p = periodeBulanIni()
    daftar1.value.bulan = p.bulan
    daftar1.value.tahun = p.tahun
  }

  const tabAktif = ref<'rekap' | 'guru' | 'siswa' | 'absen'>('rekap')
  const tabItems = [
    { label: 'Laporan Daftar 1', value: 'rekap', icon: 'i-lucide-file-spreadsheet' },
    { label: 'Keadaan Guru (19 Kolom)', value: 'guru', icon: 'i-lucide-users' },
    { label: 'Data Usia & BB/TB', value: 'siswa', icon: 'i-lucide-baby' },
    { label: 'Daftar Absen Kelas', value: 'absen', icon: 'i-lucide-calendar-check' },
  ]

  type UkuranKertasDaftar1 = 'F4' | 'A4'
  const ukuranKertas = ref<UkuranKertasDaftar1>('F4')
  const ukuranKertasItems: Array<{ label: string, value: UkuranKertasDaftar1 }> = [
    { label: 'F4 / Folio (330 x 215 mm)', value: 'F4' },
    { label: 'A4 (297 x 210 mm)', value: 'A4' },
  ]
  const editLaporanOpen = ref(false)

  useHead(() => ({
    style: [
      {
        key: 'daftar1-print-page',
        innerHTML: ukuranKertas.value === 'A4'
          ? '@page { size: 297mm 210mm; margin: 5mm; }'
          : '@page { size: 330mm 215mm; margin: 6mm; }',
      },
    ],
  }))

  const filterKelasSiswa = ref<string>('Semua')
  const filterKelasAbsen = ref<TingkatKelas>('1')
  const cariSiswa = ref('')

  const sptjmFileInput = ref<HTMLInputElement | null>(null)
  const xlsxFileInput = ref<HTMLInputElement | null>(null)
  const sarprasModalOpen = ref(false)
  const guruModalOpen = ref(false)
  const tambahSiswaModalOpen = ref(false)
  const resetModalOpen = ref(false)
  const memprosesXlsx = ref(false)

  const guruEditKey = ref('')
  const guruForm = ref<Daftar1GuruMeta>({})
  const siswaBaruForm = ref<Daftar1SiswaBase>({
    nama: '',
    jk: 'L',
    tglLahir: '',
    tingkat: '1',
    rombel: 'Kelas 1',
    agama: 'islam',
  })

  const rekap = computed(() => hitungRekapDaftar1(profil.value, daftar1.value))

  const kelasOptions = [
    { label: 'Semua Kelas', value: 'Semua' },
    ...TINGKAT_LIST.map(t => ({ label: `Kelas ${t} (${ROMAWI_MAP[t]})`, value: t })),
  ]

  const kelasAbsenOptions = TINGKAT_LIST.map(t => ({
    label: `Kelas ${t} (${ROMAWI_MAP[t]})`,
    value: t,
  }))

  const agamaOptions = AGAMA_LIST.map(a => ({ label: a.label, value: a.key }))

  const siswaTersaring = computed(() => {
    const q = cariSiswa.value.trim().toLowerCase()
    return rekap.value.siswa.filter((s) => {
      if (filterKelasSiswa.value !== 'Semua' && s.tingkat !== filterKelasSiswa.value) return false
      if (!q) return true
      return s.nama.toLowerCase().includes(q)
        || (s.nisn && s.nisn.includes(q))
        || (s.nik && s.nik.includes(q))
    })
  })

  const siswaAbsenKelas = computed(() =>
    rekap.value.siswa.filter(s => s.tingkat === filterKelasAbsen.value),
  )

  const bbTbTerisiCount = computed(() =>
    rekap.value.siswa.filter(s => s.bb !== null || s.tb !== null).length,
  )

  function perbaruiPeriodeLaporan() {
    daftar1.value.tahunPelajaran = saranTahunPelajaran(daftar1.value.bulan, daftar1.value.tahun)
  }

  function angkaNolAtauStrip(v: number): string | number {
    return v === 0 ? '-' : v
  }

  function setBbTbSiswa(row: Daftar1SiswaRow, field: 'bb' | 'tb', raw: string | number | null | undefined) {
    const prev = daftar1.value.bbTbByKey[row.key] || daftar1.value.bbTbByKey[normalisasiKunciSiswa(row.nama)] || { bb: null, tb: null }
    const val = raw === '' || raw === null || raw === undefined ? null : Number(raw)
    const parsed = val !== null && Number.isFinite(val) ? val : null
    daftar1.value.bbTbByKey[row.key] = {
      bb: field === 'bb' ? parsed : prev.bb,
      tb: field === 'tb' ? parsed : prev.tb,
    }
  }

  function setAgamaSiswa(row: Daftar1SiswaRow, agama: AgamaKey) {
    daftar1.value.agamaByKey[row.key] = agama
  }

  function perbaruiTglLahirSiswa(row: Daftar1SiswaRow, val: string) {
    if (row.sumber === 'sptjm' && profil.value.dapodik) {
      const target = profil.value.dapodik.pesertaDidik.find(pd =>
        (row.nisn && pd.nisn === row.nisn) || normalisasiKunciSiswa(pd.nama) === normalisasiKunciSiswa(row.nama),
      )
      if (target) target.tglLahir = val
      return
    }
    if (daftar1.value.siswaLokal === null) {
      daftar1.value.siswaLokal = structuredClone(DAFTAR1_DEFAULT_SISWA)
    }
    const inLokal = daftar1.value.siswaLokal.find(s => normalisasiKunciSiswa(s.nama) === normalisasiKunciSiswa(row.nama))
    if (inLokal) {
      inLokal.tglLahir = val
      return
    }
    const inCustom = daftar1.value.customSiswa.find(s => normalisasiKunciSiswa(s.nama) === normalisasiKunciSiswa(row.nama))
    if (inCustom) inCustom.tglLahir = val
  }

  function hapusSiswaManual(row: Daftar1SiswaRow) {
    if (row.sumber === 'sptjm') return
    const keyNama = normalisasiKunciSiswa(row.nama)
    const customIdx = daftar1.value.customSiswa.findIndex(s => normalisasiKunciSiswa(s.nama) === keyNama)
    if (customIdx >= 0) {
      daftar1.value.customSiswa.splice(customIdx, 1)
      return
    }
    if (daftar1.value.siswaLokal === null) {
      daftar1.value.siswaLokal = structuredClone(DAFTAR1_DEFAULT_SISWA)
    }
    const lokalIdx = daftar1.value.siswaLokal.findIndex(s => normalisasiKunciSiswa(s.nama) === keyNama)
    if (lokalIdx >= 0) daftar1.value.siswaLokal.splice(lokalIdx, 1)
  }

  function simpanSiswaBaru() {
    const nama = siswaBaruForm.value.nama.trim().toUpperCase()
    if (!nama) {
      toast.add({ title: 'Nama siswa wajib diisi', color: 'warning' })
      return
    }
    daftar1.value.customSiswa.push({
      ...siswaBaruForm.value,
      nama,
      rombel: `Kelas ${siswaBaruForm.value.tingkat}`,
    })
    if (siswaBaruForm.value.agama && siswaBaruForm.value.agama !== 'islam') {
      daftar1.value.agamaByKey[normalisasiKunciSiswa(nama)] = siswaBaruForm.value.agama
    }
    siswaBaruForm.value = {
      nama: '',
      jk: 'L',
      tglLahir: '',
      tingkat: siswaBaruForm.value.tingkat,
      rombel: `Kelas ${siswaBaruForm.value.tingkat}`,
      agama: 'islam',
    }
    tambahSiswaModalOpen.value = false
    toast.add({ title: 'Siswa ditambahkan ke Daftar 1', color: 'success' })
  }

  function bukaEditGuru(g: Daftar1GuruRow) {
    guruEditKey.value = g.key || normalisasiKunciGuru(g.nama)
    guruForm.value = {
      nama: g.nama,
      nip: g.nip,
      nuptk: g.nuptk,
      jk: g.jk,
      tempatLahir: g.tempatLahir,
      tglLahir: g.tglLahir === '-' ? '' : g.tglLahir,
      agama: g.agama,
      kawin: g.kawin,
      anakDibawah18: g.anakDibawah18,
      ijazahTahun: g.ijazahTahun,
      jabatanDaftar1: g.jabatanDaftar1,
      tmtDiangkat: g.tmtDiangkat,
      tmtSekolahIni: g.tmtSekolahIni,
      mengajarKelas: g.mengajarKelas,
      tglSkTerakhir: g.tglSkTerakhir,
      noSkTerakhir: g.noSkTerakhir,
      golongan: g.golongan,
      gajiPokok: g.gajiPokok,
      absenSakit: g.absenSakit,
      absenIzin: g.absenIzin,
      absenLain: g.absenLain,
      keterangan: g.keterangan,
      tersertifikasi: g.tersertifikasi,
    }
    guruModalOpen.value = true
  }

  function simpanEditGuru() {
    if (!guruEditKey.value) return
    daftar1.value.guruMetaByKey[guruEditKey.value] = { ...guruForm.value }
    guruModalOpen.value = false
    toast.add({ title: 'Detail kepegawaian guru diperbarui', color: 'success' })
  }

  async function onPilihSptjm(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await imporFileSptjm(file)
    input.value = ''
  }

  async function onPilihXlsx(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    memprosesXlsx.value = true
    try {
      const buf = await file.arrayBuffer()
      const hasil = await parseDaftar1Xlsx(buf)
      if (hasil.patch.siswaLokal) {
        daftar1.value.siswaLokal = hasil.patch.siswaLokal
      }
      if (hasil.patch.bbTbByKey) {
        daftar1.value.bbTbByKey = { ...daftar1.value.bbTbByKey, ...hasil.patch.bbTbByKey }
      }
      if (hasil.patch.guruMetaByKey) {
        daftar1.value.guruMetaByKey = { ...daftar1.value.guruMetaByKey, ...hasil.patch.guruMetaByKey }
      }
      if (hasil.patch.hariEfektif) {
        daftar1.value.hariEfektif = { ...daftar1.value.hariEfektif, ...hasil.patch.hariEfektif }
      }
      toast.add({
        title: 'File Excel Daftar 1 berhasil diimpor',
        description: `${hasil.jumlahSiswa} data siswa, ${hasil.jumlahBbTb} BB/TB, dan ${hasil.jumlahGuru} profil guru dimuat.`,
        color: 'success',
      })
    }
    catch (err) {
      toast.add({
        title: 'Gagal membaca file Excel Daftar 1',
        description: err instanceof Error ? err.message : 'Pastikan format berkas adalah .xlsx Daftar 1.',
        color: 'error',
      })
    }
    finally {
      memprosesXlsx.value = false
      input.value = ''
    }
  }

  function unduhExcel() {
    const blob = buildDaftar1XlsxBlob(profil.value, daftar1.value)
    const namaSekolah = profil.value.sekolah.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DAFTAR_1_${namaSekolah}_${daftar1.value.bulan.toUpperCase()}_${daftar1.value.tahun}.xlsx`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2500)
  }

  async function cetakLaporan() {
    if (tabAktif.value !== 'rekap') {
      tabAktif.value = 'rekap'
      await nextTick()
    }
    window.print()
  }

  function jalankanResetDaftar1() {
    resetDaftar1()
    resetModalOpen.value = false
    toast.add({ title: 'Data Daftar 1 dikembalikan ke bawaan awal', color: 'neutral' })
  }

  return {
    AGAMA_LIST,
    BULAN_DAFTAR1,
    BULAN_TAHUN_AJARAN,
    ROMAWI_MAP,
    TINGKAT_LIST,
    formatTtlDaftar1,
    hitungRekapDaftar1,
    normalisasiKunciGuru,
    normalisasiKunciSiswa,
    saranTahunPelajaran,
    buildDaftar1XlsxBlob,
    parseDaftar1Xlsx,
    DAFTAR1_DEFAULT_SISWA,
    profil,
    daftar1,
    resetDaftar1,
    memprosesSptjm,
    imporFileSptjm,
    toast,
    tabAktif,
    tabItems,
    ukuranKertas,
    ukuranKertasItems,
    editLaporanOpen,
    filterKelasSiswa,
    filterKelasAbsen,
    cariSiswa,
    sptjmFileInput,
    xlsxFileInput,
    sarprasModalOpen,
    guruModalOpen,
    tambahSiswaModalOpen,
    resetModalOpen,
    memprosesXlsx,
    guruEditKey,
    guruForm,
    siswaBaruForm,
    rekap,
    kelasOptions,
    kelasAbsenOptions,
    agamaOptions,
    siswaTersaring,
    siswaAbsenKelas,
    bbTbTerisiCount,
    perbaruiPeriodeLaporan,
    labelAcuanDaftar1,
    tanggalLaporanDaftar1,
    tahunItems,
    bulanIni,
    pilihBulanIni,
    angkaNolAtauStrip,
    setBbTbSiswa,
    setAgamaSiswa,
    perbaruiTglLahirSiswa,
    hapusSiswaManual,
    simpanSiswaBaru,
    bukaEditGuru,
    simpanEditGuru,
    onPilihSptjm,
    onPilihXlsx,
    unduhExcel,
    cetakLaporan,
    jalankanResetDaftar1,
  }
}

export type Daftar1HalamanCtx = ReturnType<typeof buatDaftar1Halaman>

const KUNCI_DAFTAR1: InjectionKey<Daftar1HalamanCtx> = Symbol('daftar1-halaman')

export function sediakanDaftar1Halaman(): Daftar1HalamanCtx {
  const ctx = buatDaftar1Halaman()
  provide(KUNCI_DAFTAR1, ctx)
  return ctx
}

export function pakaiDaftar1Halaman(): Daftar1HalamanCtx {
  const ctx = inject(KUNCI_DAFTAR1)
  if (!ctx) throw new Error('pakaiDaftar1Halaman() hanya bisa dipakai di dalam halaman Daftar 1.')
  return ctx
}
