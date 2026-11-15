import { describe, expect, it } from 'vitest'
import { alignKolom, lebarKolom } from '~/utils/blocks'
import type { Block } from '~/utils/blocks'
import { cariDokumen, nilaiAwal } from '~/data/templates'
import { profilAwal } from '~/utils/profil'

type Tabel = Extract<Block, { t: 'table' }>

describe('perataan kolom tabel', () => {
  it('nomor di tengah, angka & rupiah rata kanan, teks rata kiri', () => {
    const t: Tabel = {
      t: 'table',
      head: ['No', 'Uraian', 'Jumlah (Rp)', 'PPh 21 TER', 'Satuan'],
      rows: [
        ['1', 'Bola voli', '555.000', '0 (0%)', 'buah'],
        ['', '**JUMLAH**', '**555.000**', '**0**', ''],
      ],
    }
    expect(alignKolom(t)).toEqual(['center', 'left', 'right', 'right', 'center'])
  })

  it('align manual mengalahkan tebakan', () => {
    const t: Tabel = { t: 'table', head: ['No', 'Nilai'], rows: [['1', '10']], align: [undefined as never, 'center'] }
    expect(alignKolom(t)).toEqual(['center', 'center'])
  })

  it('lebar kolom dinormalkan menjadi 100%', () => {
    const w = lebarKolom({ t: 'table', head: ['A', 'B'], rows: [], widths: [30, 90] })
    expect(w[0]! + w[1]!).toBeCloseTo(100)
    expect(lebarKolom({ t: 'table', head: ['A', 'B', 'C', 'D'], rows: [] })).toEqual([25, 25, 25, 25])
    // Jumlah lebar tidak cocok dengan jumlah kolom → dibagi rata.
    expect(lebarKolom({ t: 'table', head: ['A', 'B'], rows: [], widths: [100] })).toEqual([50, 50])
  })

  it('tabel rincian RKAS: kolom rupiah rata kanan', () => {
    const dok = cariDokumen('rkas-pengesahan')!
    const tabel = dok.build(profilAwal, nilaiAwal(dok.fields, profilAwal)).find((b): b is Tabel => b.t === 'table')!
    const rata = alignKolom(tabel)
    expect(rata[0]).toBe('center')
    expect(rata[tabel.head.indexOf('Jumlah (Rp)')]).toBe('right')
  })
})
