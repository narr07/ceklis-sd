import type { Gtk, Profil } from '~/utils/profil'

export interface SptjmSarpras {
  no: number
  jenis: string
  bangunan: string
  ruang: string
  lantai: string
  panjang: string
  lebar: string
}

export interface SptjmGtk {
  no: number
  nama: string
  jk: 'L' | 'P'
  nik: string
  nip: string
  nuptk: string
  jenis: string
  status: string
  tglLahir: string
  sekolahInduk: string
  waliKelas?: string
}

export interface SptjmRombel {
  no: number
  nama: string
  tingkat: string
  prasarana: string
  wali: string
  kurikulum: string
  jumlahL: number
  jumlahP: number
  jumlahTotal: number
}

export interface SptjmPesertaDidik {
  no: number
  nama: string
  jk: 'L' | 'P'
  tglLahir: string
  namaIbu: string
  nik: string
  nisn: string
  tingkat: string
  rombel: string
}

export interface DataDapodikSptjm {
  tanggalSptjm: string
  importedAt: string
  bentukPendidikan: string
  statusSekolah: string
  statusKepemilikan: string
  skIzinOperasional: string
  tanggalSkIzin: string
  rt: string
  rw: string
  dusun: string
  propinsi: string
  lintang: string
  bujur: string
  layananKhusus: string
  skPendirian: string
  tanggalSkPendirian: string
  rekeningBos: string
  namaBank: string
  namaKcp: string
  atasNamaRekening: string
  mbs: string
  telepon: string
  sarpras: SptjmSarpras[]
  gtkDetail: SptjmGtk[]
  rombel: SptjmRombel[]
  pesertaDidik: SptjmPesertaDidik[]
}

interface PdfSpan {
  y: number
  x: number
  text: string
}

function bytesToLatin1(bytes: Uint8Array): string {
  let out = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return out
}

async function inflateZlib(slice: Uint8Array): Promise<string> {
  const copy = new Uint8Array(slice.byteLength)
  copy.set(slice)
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate'))
  const buf = await new Response(stream).arrayBuffer()
  return bytesToLatin1(new Uint8Array(buf))
}

function parseCMap(cmapText: string): Map<number, string> {
  const map = new Map<number, string>()
  for (const m of cmapText.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g)) {
    const start = Number.parseInt(m[1]!, 16)
    let idx = 0
    for (const im of m[3]!.matchAll(/<([0-9a-fA-F\s]+)>/g)) {
      const cps = im[1]!.trim().split(/\s+/).map(cp => String.fromCodePoint(Number.parseInt(cp, 16))).join('')
      map.set(start + idx, cps)
      idx++
    }
  }
  for (const cm of cmapText.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pm of cm[1]!.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F\s]+)>/g)) {
      const code = Number.parseInt(pm[1]!, 16)
      const cps = pm[2]!.trim().split(/\s+/).map(cp => String.fromCodePoint(Number.parseInt(cp, 16))).join('')
      map.set(code, cps)
    }
  }
  return map
}

function decodeTjHex(tjBody: string, cmap: Map<number, string>): string {
  let out = ''
  for (const hm of tjBody.matchAll(/<([0-9a-fA-F]+)>/g)) {
    const hex = hm[1]!
    for (let i = 0; i < hex.length; i += 4) {
      const gid = Number.parseInt(hex.slice(i, i + 4), 16)
      out += cmap.get(gid) ?? ''
    }
  }
  return out
}

function extractPageSpans(streamText: string, fontCmaps: Record<string, Map<number, string>>): PdfSpan[] {
  const spans: PdfSpan[] = []
  for (const m of streamText.matchAll(/BT\s+1 0 0 1 ([\d.]+) ([\d.]+) Tm\s+\/(F\d+) [\d.]+ Tf\s+\[([\s\S]*?)\] TJ\s+ET/g)) {
    const x = Number.parseFloat(m[1]!)
    const y = Number.parseFloat(m[2]!)
    const cmap = fontCmaps[m[3]!]
    if (!cmap) continue
    const text = decodeTjHex(m[4]!, cmap)
    if (text) spans.push({ y, x, text })
  }
  return spans
}

function joinCellSpans(spans: PdfSpan[], numericOnly = false): string {
  if (!spans.length) return ''
  const sorted = [...spans].sort((a, b) => (Math.abs(b.y - a.y) > 1.5 ? b.y - a.y : a.x - b.x))
  const joined = sorted.map(s => s.text).join('')
  return numericOnly ? joined.replace(/\s+/g, '').trim() : joined.replace(/\s+/g, ' ').trim()
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => (/^(ii|iii|iv|vi|vii|viii|ix|sd|sdn|pns|pppk|uptd)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export async function parseSptjmPdf(input: ArrayBuffer | Uint8Array): Promise<{ profilPatch: Partial<Profil>, dapodik: DataDapodikSptjm }> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const raw = bytesToLatin1(bytes)

  const objMeta = new Map<number, { start: number, end: number, text: string }>()
  for (const om of raw.matchAll(/(\d+)\s+0\s+obj\b/g)) {
    const id = Number.parseInt(om[1]!, 10)
    const bodyStart = (om.index ?? 0) + om[0].length
    const endIdx = raw.indexOf('endobj', bodyStart)
    if (endIdx !== -1) {
      objMeta.set(id, { start: bodyStart, end: endIdx, text: raw.slice(bodyStart, Math.min(endIdx, bodyStart + 1500)) })
    }
  }

  const streamCache = new Map<number, string>()
  const getDecompressedStream = async (oid: number): Promise<string> => {
    if (streamCache.has(oid)) return streamCache.get(oid)!
    const meta = objMeta.get(oid)
    if (!meta) return ''
    const fullObj = raw.slice(meta.start, meta.end)
    const sIdx = fullObj.indexOf('stream')
    if (sIdx === -1) return ''
    let dataStart = sIdx + 6
    if (fullObj[dataStart] === '\r') dataStart++
    if (fullObj[dataStart] === '\n') dataStart++
    const lenMatch = fullObj.slice(0, sIdx).match(/\/Length\s+(\d+)\b/)
    let dataEnd: number
    if (lenMatch) {
      dataEnd = dataStart + Number.parseInt(lenMatch[1]!, 10)
    }
    else {
      const eIdx = fullObj.lastIndexOf('endstream')
      if (eIdx === -1 || eIdx <= dataStart) return ''
      dataEnd = eIdx
      if (fullObj[dataEnd - 1] === '\n') dataEnd--
    }
    const slice = bytes.subarray(meta.start + dataStart, meta.start + dataEnd)
    try {
      const text = await inflateZlib(slice)
      streamCache.set(oid, text)
      return text
    }
    catch {
      return ''
    }
  }

  const fontToCmap = new Map<number, Map<number, string>>()
  for (const [oid, meta] of objMeta.entries()) {
    if (meta.text.includes('/ToUnicode')) {
      const tu = meta.text.match(/\/ToUnicode\s+(\d+)\s+0\s+R/)
      if (tu) {
        const cmapOid = Number.parseInt(tu[1]!, 10)
        const cmapStr = await getDecompressedStream(cmapOid)
        if (cmapStr) fontToCmap.set(oid, parseCMap(cmapStr))
      }
    }
  }

  const pageEntries: { pageOid: number, contentOid: number, resOid: number }[] = []
  for (const [oid, meta] of [...objMeta.entries()].sort((a, b) => a[0] - b[0])) {
    if (/\/Type\s*\/Page\b/.test(meta.text) && meta.text.includes('/Contents')) {
      const cm = meta.text.match(/\/Contents\s+(\d+)\s+0\s+R/)
      const rm = meta.text.match(/\/Resources\s+(\d+)\s+0\s+R/)
      if (cm && rm) {
        pageEntries.push({
          pageOid: oid,
          contentOid: Number.parseInt(cm[1]!, 10),
          resOid: Number.parseInt(rm[1]!, 10),
        })
      }
    }
  }

  if (!pageEntries.length) {
    throw new Error('File PDF tidak memiliki struktur halaman SPTJM Dapodik yang dikenali.')
  }

  const pagesSpans: PdfSpan[][] = []
  for (const pe of pageEntries) {
    const resMeta = objMeta.get(pe.resOid)
    const fontMap: Record<string, Map<number, string>> = {}
    if (resMeta) {
      for (const fm of resMeta.text.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
        const fKey = fm[1]!
        const fOid = Number.parseInt(fm[2]!, 10)
        const cmap = fontToCmap.get(fOid)
        if (cmap) fontMap[fKey] = cmap
      }
    }
    const streamText = await getDecompressedStream(pe.contentOid)
    pagesSpans.push(extractPageSpans(streamText, fontMap))
  }

  let pemda = ''
  let dinas = ''
  let sekolah = ''
  let npsn = ''
  let kepsek = ''
  let nipKepsek = ''
  let tanggalSptjm = ''

  // Parse Halaman 1 (SPTJM)
  const p1 = pagesSpans[0] ?? []
  const topLines = new Map<number, PdfSpan[]>()
  for (const sp of p1) {
    const yKey = [...topLines.keys()].find(k => Math.abs(k - sp.y) <= 2.0) ?? sp.y
    const arr = topLines.get(yKey) ?? []
    arr.push(sp)
    topLines.set(yKey, arr)
  }
  const sortedP1Lines = [...topLines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([y, sps]) => ({ y, text: joinCellSpans(sps), sps }))

  for (const ln of sortedP1Lines) {
    if (ln.text.startsWith('PEMERINTAH ') && !pemda) {
      pemda = ln.text.replace(/\bKABUPATEN\s+KAB\.\s*/i, 'KABUPATEN ').trim()
    }
    else if (ln.text.startsWith('DINAS ') && !dinas) {
      dinas = ln.text.trim()
    }
    const tglMatch = ln.text.match(/,\s*(\d{2}-\d{2}-\d{4})$/)
    if (tglMatch) tanggalSptjm = tglMatch[1]!
  }

  for (const ln of sortedP1Lines) {
    const labelSpans = ln.sps.filter(s => s.x >= 100 && s.x < 295)
    const valSpans = ln.sps.filter(s => s.x >= 305)
    const label = joinCellSpans(labelSpans)
    const val = joinCellSpans(valSpans)
    if (label === 'Nama' && val) kepsek = val
    else if (label === 'NIP' && val) nipKepsek = val.replace(/\s+/g, '')
    else if (label === 'Nama Sekolah' && val) sekolah = val
    else if (label === 'NPSN' && val) npsn = val.replace(/\s+/g, '')
  }

  // Lampiran 1: Data Satuan Pendidikan
  const lamp1Map: Record<string, string> = {}
  for (const sps of pagesSpans) {
    const pageTxt = joinCellSpans(sps)
    if (!pageTxt.includes('DATA SATUAN PENDIDIKAN')) continue
    const lines = new Map<number, PdfSpan[]>()
    for (const sp of sps) {
      if (sp.y > 680 || sp.y < 80) continue
      const yKey = [...lines.keys()].find(k => Math.abs(k - sp.y) <= 2.0) ?? sp.y
      const arr = lines.get(yKey) ?? []
      arr.push(sp)
      lines.set(yKey, arr)
    }
    for (const [, rowSps] of [...lines.entries()].sort((a, b) => b[0] - a[0])) {
      const k = joinCellSpans(rowSps.filter(s => s.x >= 55 && s.x < 178))
      const v = joinCellSpans(rowSps.filter(s => s.x >= 190))
      if (k && !(k in lamp1Map)) lamp1Map[k] = v
    }
  }

  // Helper untuk mengelompokkan baris tabel berdasarkan kolom No (55 <= x <= 85)
  const extractTableRows = (sectionMarker: string): { rowSps: PdfSpan[] }[] => {
    const out: { rowSps: PdfSpan[] }[] = []
    let active = false
    for (const sps of pagesSpans) {
      const headerTexts = sps.filter(s => s.y > 435 && s.y < 720).map(s => s.text).join('')
      if (headerTexts.includes('LAMPIRAN')) {
        active = headerTexts.includes(sectionMarker)
      }
      if (!active) continue

      const noHeader = sps.find(s => s.x >= 55 && s.x <= 85 && s.text.trim() === 'No' && s.y > 380 && s.y < 480)
      const maxTableY = noHeader ? noHeader.y - 4 : 450

      const anchors = sps
        .filter(s => s.x >= 55 && s.x <= 85 && s.y <= maxTableY && s.y > 60 && /^\d+$/.test(s.text.trim()))
        .sort((a, b) => b.y - a.y)

      for (let i = 0; i < anchors.length; i++) {
        const topY = anchors[i]!.y + 2
        const bottomY = i + 1 < anchors.length ? anchors[i + 1]!.y + 2 : 60
        const rowSps = sps.filter(s => s.y <= topY && s.y > bottomY)
        out.push({ rowSps })
      }
    }
    return out
  }

  // Lampiran 2: Sarana dan Prasarana
  const sarpras: SptjmSarpras[] = extractTableRows('SARANA').map(({ rowSps }) => ({
    no: Number.parseInt(joinCellSpans(rowSps.filter(s => s.x >= 55 && s.x < 95), true), 10) || 0,
    jenis: joinCellSpans(rowSps.filter(s => s.x >= 95 && s.x < 240)),
    bangunan: joinCellSpans(rowSps.filter(s => s.x >= 240 && s.x < 380)),
    ruang: joinCellSpans(rowSps.filter(s => s.x >= 380 && s.x < 515)),
    lantai: joinCellSpans(rowSps.filter(s => s.x >= 515 && s.x < 570), true),
    panjang: joinCellSpans(rowSps.filter(s => s.x >= 570 && s.x < 625), true),
    lebar: joinCellSpans(rowSps.filter(s => s.x >= 625 && s.x < 680), true),
  }))

  // Lampiran 3: GTK
  const gtkDetail: SptjmGtk[] = extractTableRows('TENAGA KEPENDIDIKAN').map(({ rowSps }) => {
    const jkRaw = joinCellSpans(rowSps.filter(s => s.x >= 172 && s.x < 210), true).toUpperCase()
    return {
      no: Number.parseInt(joinCellSpans(rowSps.filter(s => s.x >= 55 && s.x < 95), true), 10) || 0,
      nama: joinCellSpans(rowSps.filter(s => s.x >= 95 && s.x < 172)),
      jk: (jkRaw === 'P' ? 'P' : 'L') as 'L' | 'P',
      nik: joinCellSpans(rowSps.filter(s => s.x >= 210 && s.x < 282), true),
      nip: joinCellSpans(rowSps.filter(s => s.x >= 282 && s.x < 353), true) || '-',
      nuptk: joinCellSpans(rowSps.filter(s => s.x >= 353 && s.x < 424), true),
      jenis: joinCellSpans(rowSps.filter(s => s.x >= 424 && s.x < 495)),
      status: joinCellSpans(rowSps.filter(s => s.x >= 495 && s.x < 566)),
      tglLahir: joinCellSpans(rowSps.filter(s => s.x >= 566 && s.x < 638), true),
      sekolahInduk: joinCellSpans(rowSps.filter(s => s.x >= 638 && s.x < 708)),
    }
  })

  // Lampiran 4: Rombongan Belajar
  const rombelRaw = extractTableRows('ROMBONGAN BELAJAR').map(({ rowSps }) => ({
    no: Number.parseInt(joinCellSpans(rowSps.filter(s => s.x >= 55 && s.x < 95), true), 10) || 0,
    nama: joinCellSpans(rowSps.filter(s => s.x >= 95 && s.x < 240)),
    tingkat: joinCellSpans(rowSps.filter(s => s.x >= 240 && s.x < 315)),
    prasarana: joinCellSpans(rowSps.filter(s => s.x >= 315 && s.x < 455)),
    wali: joinCellSpans(rowSps.filter(s => s.x >= 455 && s.x < 595)),
    kurikulum: joinCellSpans(rowSps.filter(s => s.x >= 595 && s.x < 705)),
  }))

  // Lampiran 5: Peserta Didik
  const pesertaDidik: SptjmPesertaDidik[] = extractTableRows('PESERTA DIDIK').map(({ rowSps }) => {
    const jkRaw = joinCellSpans(rowSps.filter(s => s.x >= 235 && s.x < 275), true).toUpperCase()
    return {
      no: Number.parseInt(joinCellSpans(rowSps.filter(s => s.x >= 55 && s.x < 95), true), 10) || 0,
      nama: joinCellSpans(rowSps.filter(s => s.x >= 95 && s.x < 235)),
      jk: (jkRaw === 'P' ? 'P' : 'L') as 'L' | 'P',
      tglLahir: joinCellSpans(rowSps.filter(s => s.x >= 275 && s.x < 348), true),
      namaIbu: joinCellSpans(rowSps.filter(s => s.x >= 348 && s.x < 420)),
      nik: joinCellSpans(rowSps.filter(s => s.x >= 420 && s.x < 492), true),
      nisn: joinCellSpans(rowSps.filter(s => s.x >= 492 && s.x < 564), true),
      tingkat: joinCellSpans(rowSps.filter(s => s.x >= 564 && s.x < 636)),
      rombel: joinCellSpans(rowSps.filter(s => s.x >= 636 && s.x < 708)),
    }
  })

  const rombel: SptjmRombel[] = rombelRaw
    .map((r) => {
      const siswa = pesertaDidik.filter(pd => pd.rombel.toLowerCase() === r.nama.toLowerCase())
      const jumlahL = siswa.filter(pd => pd.jk === 'L').length
      const jumlahP = siswa.filter(pd => pd.jk === 'P').length
      return {
        ...r,
        jumlahL,
        jumlahP,
        jumlahTotal: siswa.length,
      }
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { numeric: true }))

  // Pasangkan wali kelas ke gtkDetail
  for (const g of gtkDetail) {
    const r = rombel.find(rm => rm.wali.toLowerCase() === g.nama.toLowerCase())
    if (r) g.waliKelas = r.nama
  }

  const gtkList: Gtk[] = gtkDetail.map(g => ({
    nama: g.nama === g.nama.toUpperCase() ? titleCase(g.nama) : g.nama,
    nip: g.nip || '-',
    nuptk: g.nuptk || '-',
    jk: g.jk,
    jabatan: g.jenis.toLowerCase().includes('kepala')
      ? 'Kepala Sekolah'
      : g.waliKelas
        ? `Guru ${g.waliKelas}`
        : g.jenis || 'Guru Kelas',
  }))

  const rawSekolah = lamp1Map['Nama Sekolah'] || sekolah
  const normSekolah = rawSekolah.replace(/^SD\s+NEGERI\b/i, 'SEKOLAH DASAR NEGERI')
  const rawKec = (lamp1Map['Kecamatan'] || '').replace(/^Kec\.\s*/i, '').trim()
  const rawKab = (lamp1Map['Kabupaten/Kota'] || '').replace(/^(Kab\.|Kota)\s*/i, '').trim()
  const rawDesa = lamp1Map['Desa/Kelurahan'] ? titleCase(lamp1Map['Desa/Kelurahan']) : ''
  const rawWeb = (lamp1Map['Website'] || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim()

  const dapodik: DataDapodikSptjm = {
    tanggalSptjm,
    importedAt: new Date().toISOString(),
    bentukPendidikan: lamp1Map['Bentuk Pendidikan'] || 'SD',
    statusSekolah: lamp1Map['Status Sekolah'] || '',
    statusKepemilikan: lamp1Map['Status Kepemilikan'] || '',
    skIzinOperasional: lamp1Map['SK Izin Operasional'] || '-',
    tanggalSkIzin: lamp1Map['Tanggal SK'] || '',
    rt: lamp1Map['RT'] || '',
    rw: lamp1Map['RW'] || '',
    dusun: lamp1Map['Nama Dusun'] || '',
    propinsi: (lamp1Map['Propinsi'] || '').replace(/^Prov\.\s*/i, '').trim(),
    lintang: lamp1Map['Lintang'] || '',
    bujur: lamp1Map['Bujur'] || '',
    layananKhusus: lamp1Map['Layanan Keb. Khusus'] || '',
    skPendirian: lamp1Map['SK Pendirian Sekolah'] || '',
    tanggalSkPendirian: lamp1Map['Tanggal SK'] || '',
    rekeningBos: lamp1Map['Rekening BOS'] || '',
    namaBank: lamp1Map['Nama Bank'] || '',
    namaKcp: lamp1Map['Nama KCP/Unit'] || '',
    atasNamaRekening: lamp1Map['Atas Nama'] || '',
    mbs: lamp1Map['MBS'] || '',
    telepon: lamp1Map['Nomor Telepon'] || '',
    sarpras,
    gtkDetail,
    rombel,
    pesertaDidik,
  }

  const profilPatch: Partial<Profil> = {
    ...(pemda ? { pemda } : {}),
    ...(dinas ? { dinas } : {}),
    ...(normSekolah ? { sekolah: normSekolah } : {}),
    ...(lamp1Map['NPSN'] || npsn ? { npsn: lamp1Map['NPSN'] || npsn } : {}),
    ...(lamp1Map['Alamat'] ? { alamat: lamp1Map['Alamat'] } : {}),
    ...(rawDesa ? { desa: rawDesa } : {}),
    ...(rawKec ? { kecamatan: rawKec } : {}),
    ...(rawKab ? { kabupaten: rawKab, kota: rawKab } : {}),
    ...(lamp1Map['Kode Pos'] ? { kodepos: lamp1Map['Kode Pos'] } : {}),
    ...(lamp1Map['Email'] ? { email: lamp1Map['Email'] } : {}),
    ...(rawWeb ? { website: rawWeb } : {}),
    ...(kepsek ? { kepsek } : {}),
    ...(nipKepsek ? { nipKepsek } : {}),
    ...(gtkList.length ? { gtk: gtkList } : {}),
    dapodik,
  }

  return { profilPatch, dapodik }
}
