import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { cloneDaftar1DefaultState, hitungRekapDaftar1 } from '~/utils/daftar1'
import { profilAwal } from '~/utils/profil'
import { parseSptjmPdf } from '~/utils/sptjm'

/**
 * Uji regresi dengan dokumen referensi asli sekolah. File ini TIDAK ada di repo
 * (folder data-pribadi/ di-.gitignore), sehingga test otomatis dilewati di CI.
 * Test hanya memeriksa struktur/jumlah, tidak mencetak data pribadi.
 */
const SPTJM = fileURLToPath(new URL('../data-pribadi/SPTJM.pdf', import.meta.url))

describe.skipIf(!existsSync(SPTJM))('impor SPTJM Dapodik (referensi lokal)', () => {
  it('mengekstrak profil, GTK, rombel, sarpras, dan peserta didik', async () => {
    const { profilPatch, dapodik } = await parseSptjmPdf(new Uint8Array(readFileSync(SPTJM)))
    expect(profilPatch.npsn).toMatch(/^\d{8}$/)
    expect(profilPatch.kepsek).toBeTruthy()
    expect(dapodik.gtkDetail.length).toBeGreaterThan(0)
    expect(dapodik.rombel.length).toBeGreaterThan(0)
    expect(dapodik.sarpras.length).toBeGreaterThan(0)
    expect(dapodik.pesertaDidik.length).toBeGreaterThan(0)
    // Setiap siswa punya nama, jenis kelamin, dan tingkat yang terbaca.
    for (const pd of dapodik.pesertaDidik) {
      expect(pd.nama.trim()).not.toBe('')
      expect(['L', 'P']).toContain(pd.jk)
      expect(pd.tingkat).toBeTruthy()
    }
  })

  it('hasil impor langsung bisa dipakai untuk rekap Daftar 1', async () => {
    const { profilPatch, dapodik } = await parseSptjmPdf(new Uint8Array(readFileSync(SPTJM)))
    const profil = { ...profilAwal, ...profilPatch }
    const rekap = hitungRekapDaftar1(profil, cloneDaftar1DefaultState())
    expect(rekap.sumberSiswa).toBe('sptjm')
    expect(rekap.siswa.length).toBe(dapodik.pesertaDidik.length)
    expect(rekap.guru.length).toBe(dapodik.gtkDetail.length)
  })
})
