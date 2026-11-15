import {
  BULAN_TAHUN_AJARAN,
  normalisasiKunciGuru,
  normalisasiKunciSiswa,
  normalisasiTingkat,
} from './daftar1'
import type {
  BulanDaftar1,
  Daftar1BbTb,
  Daftar1GuruMeta,
  Daftar1SiswaBase,
  Daftar1State,
} from './daftar1'
import type { Profil } from './profil'
import { buildZip, unzipEntries } from './xlsx/zip'
import { escXml, unescXml, colIndexFromRef, buildWorksheetXml, stylesXml } from './xlsx/sheet'
import type { SheetSpec } from './xlsx/sheet'
import { buildSiswaSheet, buildGuruSheet, buildUsiaSheet, buildBbTbSheet, buildAbsenSheet } from './xlsx/daftar1Sheets'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8')

export function buildDaftar1Xlsx(profil: Profil, state: Daftar1State): Uint8Array {
  const sheets: SheetSpec[] = [
    buildSiswaSheet(profil, state),
    buildGuruSheet(profil, state),
    buildUsiaSheet(profil, state),
    buildBbTbSheet(profil, state),
    buildAbsenSheet(profil, state),
  ]

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/package/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, i) => `<sheet name="${escXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('\n    ')}
  </sheets>
</workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const zipFiles: Array<{ name: string, data: Uint8Array }> = [
    { name: '[Content_Types].xml', data: encoder.encode(contentTypes) },
    { name: '_rels/.rels', data: encoder.encode(rootRels) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRels) },
    { name: 'xl/styles.xml', data: encoder.encode(stylesXml()) },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: encoder.encode(buildWorksheetXml(s)),
    })),
  ]

  return buildZip(zipFiles)
}

export function buildDaftar1XlsxBlob(profil: Profil, state: Daftar1State): Blob {
  const bytes = buildDaftar1Xlsx(profil, state)
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function excelSerialToIso(serial: number): string {
  if (!Number.isFinite(serial) || serial < 10000 || serial > 80000) return String(serial)
  const epochMs = Date.UTC(1899, 11, 30)
  const d = new Date(epochMs + Math.round(serial) * 86_400_000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = []
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g
  let m: RegExpExecArray | null
  while ((m = siRe.exec(xml)) !== null) {
    const inner = m[1] || ''
    const tParts: string[] = []
    const tRe = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g
    let tm: RegExpExecArray | null
    while ((tm = tRe.exec(inner)) !== null) {
      tParts.push(unescXml(tm[1] || ''))
    }
    out.push(tParts.join(''))
  }
  return out
}

function parseSheetCells(xml: string, sharedStrings: string[]): Map<number, Map<number, string>> {
  const grid = new Map<number, Map<number, string>>()
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g
  let rm: RegExpExecArray | null
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowAttrs = rm[1] || ''
    const rNumMatch = rowAttrs.match(/\br="(\d+)"/)
    if (!rNumMatch?.[1]) continue
    const rowNum = Number(rNumMatch[1])
    const rowMap = new Map<number, string>()

    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cm: RegExpExecArray | null
    while ((cm = cellRe.exec(rm[2] || '')) !== null) {
      const cAttrs = cm[1] || ''
      const cBody = cm[2] || ''
      const refMatch = cAttrs.match(/\br="([A-Z]+\d+)"/i)
      if (!refMatch?.[1]) continue
      const col = colIndexFromRef(refMatch[1])
      if (!col) continue

      const typeMatch = cAttrs.match(/\bt="([^"]+)"/)
      const cellType = typeMatch?.[1] || ''

      let value: string
      if (cellType === 'inlineStr') {
        const tParts: string[] = []
        const tRe = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g
        let tm: RegExpExecArray | null
        while ((tm = tRe.exec(cBody)) !== null) {
          tParts.push(unescXml(tm[1] || ''))
        }
        value = tParts.join('')
      }
      else {
        const vMatch = cBody.match(/<v[^>]*>([\s\S]*?)<\/v>/)
        const rawV = vMatch?.[1] ?? ''
        if (cellType === 's') {
          value = sharedStrings[Number(rawV)] ?? ''
        }
        else if (cellType === 'str' || cellType === 'b') {
          value = unescXml(rawV)
        }
        else {
          value = rawV
        }
      }
      rowMap.set(col, value.replace(/\u00a0/g, ' ').trim())
    }
    if (rowMap.size > 0) grid.set(rowNum, rowMap)
  }
  return grid
}

function normalizeDateCell(raw: string): string {
  const s = (raw || '').trim()
  if (!s || s === '-') return ''
  if (/^\d{4,5}(\.\d+)?$/.test(s)) {
    return excelSerialToIso(Number(s))
  }
  return s.split(/\s+/)[0] || s
}

export interface ParsedDaftar1XlsxSummary {
  patch: Partial<Daftar1State>
  jumlahSiswa: number
  jumlahBbTb: number
  jumlahGuru: number
}

export async function parseDaftar1Xlsx(buffer: ArrayBuffer): Promise<ParsedDaftar1XlsxSummary> {
  const entries = await unzipEntries(buffer)
  const wbData = entries.get('xl/workbook.xml')
  const relsData = entries.get('xl/_rels/workbook.xml.rels')
  if (!wbData || !relsData) {
    throw new Error('Struktur workbook .xlsx tidak lengkap.')
  }

  const ssData = entries.get('xl/sharedStrings.xml')
  const sharedStrings = ssData ? parseSharedStrings(decoder.decode(ssData)) : []

  const relMap = new Map<string, string>()
  const relRe = /<Relationship\b([^>]*)\/?>/g
  const relXml = decoder.decode(relsData)
  let relM: RegExpExecArray | null
  while ((relM = relRe.exec(relXml)) !== null) {
    const attrs = relM[1] || ''
    const id = attrs.match(/\bId="([^"]+)"/)?.[1]
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1]
    if (id && target) {
      const normalized = target.startsWith('xl/') ? target : `xl/${target.replace(/^\/+/, '')}`
      relMap.set(id, normalized)
    }
  }

  const sheetsByName = new Map<string, Map<number, Map<number, string>>>()
  const wbXml = decoder.decode(wbData)
  const sheetRe = /<sheet\b([^>]*)\/?>/g
  let sm: RegExpExecArray | null
  while ((sm = sheetRe.exec(wbXml)) !== null) {
    const attrs = sm[1] || ''
    const name = unescXml(attrs.match(/\bname="([^"]+)"/)?.[1] || '')
    const rId = attrs.match(/\br:id="([^"]+)"/)?.[1] || ''
    const targetPath = relMap.get(rId)
    const bytes = targetPath ? entries.get(targetPath) : undefined
    if (name && bytes) {
      sheetsByName.set(name.toUpperCase(), parseSheetCells(decoder.decode(bytes), sharedStrings))
    }
  }

  const findSheet = (prefix: string) => {
    for (const [k, v] of sheetsByName.entries()) {
      if (k === prefix || k.startsWith(prefix)) return v
    }
    return undefined
  }

  const siswaLokal: Daftar1SiswaBase[] = []
  const hariEfektifPatch: Partial<Record<BulanDaftar1, number>> = {}
  const sertifikasiByNama = new Map<string, { status?: string, tersertifikasi?: 'Sudah' | 'Belum' }>()

  const usiaSheet = findSheet('DATA USIA SISWA')
  if (usiaSheet) {
    for (const [rowNum, cols] of usiaSheet.entries()) {
      if (rowNum <= 1) continue
      const nama = cols.get(1) || ''
      const tglRaw = cols.get(2) || ''
      const jkRaw = (cols.get(3) || '').toUpperCase()
      const klsRaw = cols.get(4) || ''
      if (nama && (jkRaw === 'L' || jkRaw === 'P')) {
        const tingkat = normalisasiTingkat(klsRaw)
        siswaLokal.push({
          nama: nama.toUpperCase(),
          jk: jkRaw,
          tglLahir: normalizeDateCell(tglRaw),
          tingkat,
          rombel: `Kelas ${tingkat}`,
        })
      }

      const bulanCell = cols.get(8)
      const efCell = cols.get(9)
      if (bulanCell && efCell && BULAN_TAHUN_AJARAN.includes(bulanCell as BulanDaftar1)) {
        const n = Number(efCell)
        if (Number.isFinite(n)) hariEfektifPatch[bulanCell as BulanDaftar1] = Math.round(n)
      }

      const gtkNama = cols.get(17) || ''
      const gtkStatus = cols.get(19) || ''
      const gtkSert = cols.get(20) || ''
      if (gtkNama && !/^NAMA(\s|$)/i.test(gtkNama)) {
        sertifikasiByNama.set(normalisasiKunciGuru(gtkNama), {
          status: gtkStatus,
          tersertifikasi: /SUDAH/i.test(gtkSert) ? 'Sudah' : 'Belum',
        })
      }
    }
  }

  const bbTbByKey: Record<string, Daftar1BbTb> = {}
  const bbSheet = findSheet('BB TB')
  if (bbSheet) {
    for (const [rowNum, cols] of bbSheet.entries()) {
      if (rowNum <= 1) continue
      const nama = cols.get(2) || ''
      if (!nama || /^NAMA(\s+SISWA)?$/i.test(nama)) continue
      const bb = cols.get(7) ? Number(cols.get(7)) : null
      const tb = cols.get(8) ? Number(cols.get(8)) : null
      if ((bb !== null && Number.isFinite(bb)) || (tb !== null && Number.isFinite(tb))) {
        bbTbByKey[normalisasiKunciSiswa(nama)] = {
          bb: bb !== null && Number.isFinite(bb) ? bb : null,
          tb: tb !== null && Number.isFinite(tb) ? tb : null,
        }
      }
    }
  }

  const guruMetaByKey: Record<string, Daftar1GuruMeta> = {}
  const guruSheet = findSheet('GURU')
  if (guruSheet) {
    const rowNums = Array.from(guruSheet.keys()).sort((a, b) => a - b)
    for (const r of rowNums) {
      const cols = guruSheet.get(r)
      if (!cols) continue
      const no = Number(cols.get(1))
      const nama = cols.get(2) || ''
      if (!Number.isInteger(no) || no < 1 || !nama || /^\d+$/.test(nama)) continue

      const row2 = guruSheet.get(r + 1)
      const ttlRaw = row2?.get(2) || ''
      const [tempatLahirRaw, tglLahirRaw] = ttlRaw.includes(',')
        ? ttlRaw.split(',').map(s => s.trim())
        : ['', ttlRaw]

      const jabPart1 = cols.get(9) || ''
      const jabPart2 = row2?.get(9) || ''
      const jabatanGabung = `${jabPart1} ${jabPart2}`.replace(/\s+/g, ' ').trim()

      const key = normalisasiKunciGuru(nama)
      const certInfo = sertifikasiByNama.get(key)
      const gajiNum = Number((cols.get(15) || '').replace(/[^\d.]/g, ''))

      guruMetaByKey[key] = {
        nama,
        nip: cols.get(3) || '-',
        jk: (cols.get(4) || '').toUpperCase() === 'P' ? 'P' : 'L',
        tempatLahir: tempatLahirRaw || '',
        tglLahir: normalizeDateCell(tglLahirRaw || ''),
        agama: cols.get(5) || 'ISLAM',
        kawin: cols.get(6) || '-',
        anakDibawah18: cols.get(7) || '-',
        ijazahTahun: cols.get(8) || '-',
        jabatanDaftar1: jabatanGabung || 'Guru Kelas',
        tmtDiangkat: normalizeDateCell(cols.get(11) || '') || '-',
        tmtSekolahIni: normalizeDateCell(row2?.get(11) || '') || '-',
        mengajarKelas: cols.get(12) || '-',
        tglSkTerakhir: normalizeDateCell(cols.get(13) || '') || '-',
        noSkTerakhir: row2?.get(13) || '-',
        golongan: cols.get(14) || '-',
        gajiPokok: Number.isFinite(gajiNum) ? gajiNum : 0,
        absenSakit: Number(cols.get(16)) || 0,
        absenIzin: Number(cols.get(17)) || 0,
        absenLain: Number(cols.get(18)) || 0,
        keterangan: cols.get(19) || certInfo?.status || '-',
        tersertifikasi: certInfo?.tersertifikasi || (/SUDAH/i.test(row2?.get(19) || '') ? 'Sudah' : 'Belum'),
      }
    }
  }

  const patch: Partial<Daftar1State> = {}
  if (siswaLokal.length > 0) patch.siswaLokal = siswaLokal
  if (Object.keys(bbTbByKey).length > 0) patch.bbTbByKey = bbTbByKey
  if (Object.keys(guruMetaByKey).length > 0) patch.guruMetaByKey = guruMetaByKey
  if (Object.keys(hariEfektifPatch).length > 0) {
    patch.hariEfektif = hariEfektifPatch as Record<BulanDaftar1, number>
  }

  return {
    patch,
    jumlahSiswa: siswaLokal.length,
    jumlahBbTb: Object.keys(bbTbByKey).length,
    jumlahGuru: Object.keys(guruMetaByKey).length,
  }
}
