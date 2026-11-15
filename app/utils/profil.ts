import type { DataDapodikSptjm } from '~/utils/sptjm'

export interface Gtk {
  /** Nama lengkap dengan gelar, mis. "Drs. Ahmad, S.Pd." (gelar ditambahkan manual setelah impor SPTJM). */
  nama: string
  nip: string
  nuptk: string
  jk: 'L' | 'P'
  jabatan: string
  /** TMT pengangkatan (YYYY-MM-DD); dasar hitung masa kerja di Daftar 1. Tidak ada di SPTJM, diisi manual. */
  tmt?: string
  /** TMT bertugas di sekolah ini (YYYY-MM-DD). */
  tmtSekolah?: string
}

export interface Profil {
  pemda: string
  dinas: string
  sekolah: string
  npsn: string
  alamat: string
  desa: string
  kecamatan: string
  kabupaten: string
  kodepos: string
  email: string
  website: string
  kota: string // tempat penandatanganan
  kodeSurat: string // mis. SD-01
  kepsek: string
  nipKepsek: string
  bendahara: string
  nipBendahara: string
  operator: string
  nipOperator: string
  komite: string
  logoKiri?: string
  logoKanan?: string
  kopAlamat?: string // opsional: override baris alamat pada kop surat
  kopKontak?: string // opsional: override baris kontak/NPSN pada kop surat
  gtk: Gtk[]
  dapodik?: DataDapodikSptjm
}

/**
 * Profil contoh bawaan. Semua nama di sini adalah placeholder, bukan orang sungguhan,
 * dan NIP/NUPTK sengaja dikosongkan. Isi data asli lewat halaman Profil, impor SPTJM
 * Dapodik, atau impor database (.json).
 */
export const profilAwal: Profil = {
  pemda: 'PEMERINTAH KABUPATEN CONTOH',
  dinas: 'DINAS PENDIDIKAN',
  sekolah: 'SEKOLAH DASAR NEGERI CONTOH 1',
  npsn: '',
  alamat: 'Jl. Pendidikan No. 1',
  desa: 'Sukamaju',
  kecamatan: 'Sukamaju',
  kabupaten: 'Contoh',
  kodepos: '',
  email: '',
  website: '',
  kota: 'Sukamaju',
  kodeSurat: 'SD-01',
  kepsek: 'NAMA KEPALA SEKOLAH, S.Pd.',
  nipKepsek: '',
  bendahara: 'Nama Bendahara, S.Pd.',
  nipBendahara: '',
  operator: 'Nama Operator, S.Pd.',
  nipOperator: '',
  komite: 'Nama Ketua Komite',
  gtk: [
    { nama: 'Nama Kepala Sekolah, S.Pd.', nip: '', nuptk: '', jk: 'P', jabatan: 'Kepala Sekolah' },
    { nama: 'Nama Guru Kelas 1, S.Pd.', nip: '', nuptk: '', jk: 'L', jabatan: 'Guru Kelas' },
    { nama: 'Nama Guru Kelas 2, S.Pd.', nip: '', nuptk: '', jk: 'P', jabatan: 'Guru Kelas' },
    { nama: 'Nama Guru PAI, S.Pd.I.', nip: '', nuptk: '', jk: 'P', jabatan: 'Guru Agama Islam' },
    { nama: 'Nama Guru PJOK, S.Pd.', nip: '', nuptk: '', jk: 'L', jabatan: 'Guru Penjasorkes' },
  ],
}

/** Perkiraan apakah nama sudah memuat gelar (gelar belakang setelah koma atau gelar depan umum). */
export const namaBergelar = (nama: string) =>
  /,\s*\S/.test(nama) || /^(drs?|dra|hj?|ir|prof|dr)\.?\s/i.test(nama.trim())

/** Profil dianggap masih contoh selama NPSN belum diisi. */
export const profilMasihContoh = (p: Profil) => !p.npsn.trim()

/** Alamat SP Datadik tempat operator mengunduh PDF SPTJM sekolahnya. */
export const URL_SP_DATADIK = 'https://sp.datadik.kemendikdasmen.go.id'

/**
 * Profil kosong: dasar impor SPTJM pertama kali, agar nama placeholder profil contoh
 * (mis. "Nama Bendahara, S.Pd.") tidak tertinggal di kolom yang tidak diisi SPTJM.
 */
export function profilKosong(): Profil {
  return {
    pemda: '',
    dinas: '',
    sekolah: '',
    npsn: '',
    alamat: '',
    desa: '',
    kecamatan: '',
    kabupaten: '',
    kodepos: '',
    email: '',
    website: '',
    kota: '',
    kodeSurat: profilAwal.kodeSurat,
    kepsek: '',
    nipKepsek: '',
    bendahara: '',
    nipBendahara: '',
    operator: '',
    nipOperator: '',
    komite: '',
    gtk: [],
  }
}

export const namaSekolahPendek = (p: Profil) =>
  p.sekolah.replace(/^SEKOLAH DASAR NEGERI/i, 'SD Negeri').replace(/^SEKOLAH DASAR/i, 'SD')
    .split(' ').map(w => /^[IVX]+$/.test(w) || w === 'SD' ? w : w[0] + w.slice(1).toLowerCase()).join(' ')

export function kopLines(p: Profil) {
  const alamatParts = [
    p.alamat && `Alamat: ${p.alamat}`,
    p.desa && `Desa ${p.desa}`,
    p.kecamatan && `Kecamatan ${p.kecamatan}`,
    p.kabupaten && `Kabupaten ${p.kabupaten}`,
  ].filter(Boolean).join(', ')
  const defaultAlamat = [alamatParts, p.kodepos].filter(Boolean).join(' ').trim()

  const defaultKontak = [
    p.npsn && `NPSN ${p.npsn}`,
    p.email && `E-mail: ${p.email}`,
    p.website && `Website: ${p.website}`,
  ].filter(Boolean).join('  •  ')

  return {
    pemda: p.pemda,
    dinas: p.dinas,
    sekolah: p.sekolah,
    alamat: p.kopAlamat?.trim() || defaultAlamat,
    kontak: p.kopKontak?.trim() || defaultKontak,
  }
}
