import { describe, expect, it } from 'vitest'
import { cariDokumen, nilaiAwal, paket, templates } from '~/data/templates'
import { buildDocx } from '~/utils/docx'
import { profilAwal } from '~/utils/profil'

const semuaId = [...templates.map(t => t.id), ...paket.map(p => p.id)]

describe('pustaka template', () => {
  it('setiap id unik', () => {
    expect(new Set(semuaId).size).toBe(semuaId.length)
  })

  it.each(semuaId)('%s: blok tersusun dari nilai awal tanpa error', (id) => {
    const dok = cariDokumen(id)
    expect(dok).not.toBeNull()
    const blocks = dok!.build(profilAwal, nilaiAwal(dok!.fields, profilAwal))
    expect(blocks.length).toBeGreaterThan(0)
    // Tidak boleh ada teks "undefined"/"NaN" yang bocor ke dokumen.
    const teks = JSON.stringify(blocks)
    expect(teks).not.toMatch(/\bundefined\b|\bNaN\b/)
  })

  it('paket RKAS menyisipkan pemisah halaman antardokumen', () => {
    const v = nilaiAwal(cariDokumen('paket-rkas')!.fields, profilAwal)
    const isi = paket[0]!.isi
    // Pemisah bawaan tiap dokumen (mis. lampiran undangan) + satu pemisah di antara dokumen.
    const bawaan = isi.reduce((n, id) => n + cariDokumen(id)!.build(profilAwal, v).filter(b => b.t === 'break').length, 0)
    const blocks = cariDokumen('paket-rkas')!.build(profilAwal, v)
    expect(blocks.filter(b => b.t === 'break').length).toBe(bawaan + isi.length - 1)
  })
})

describe('generator .docx', () => {
  it.each(semuaId)('%s: menghasilkan file Word (zip) yang valid', async (id) => {
    const dok = cariDokumen(id)!
    const blob = await buildDocx(dok.build(profilAwal, nilaiAwal(dok.fields, profilAwal)), profilAwal)
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(bytes.length).toBeGreaterThan(1000)
    // Berkas .docx adalah arsip zip: diawali tanda "PK".
    expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe('PK')
  })
})
