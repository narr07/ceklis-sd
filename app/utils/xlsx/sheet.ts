// Helper XML worksheet: escape, alamat sel, gaya, dan penyusun baris.

export function escXml(val: string | number | null | undefined): string {
  const s = String(val ?? '')
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function unescXml(val: string): string {
  return val
    .replace(/&apos;/g, '\'')
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

export function colLetter(col1Based: number): string {
  let n = col1Based
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

export function colIndexFromRef(ref: string): number {
  const match = ref.match(/^([A-Z]+)/i)
  if (!match?.[1]) return 0
  const letters = match[1].toUpperCase()
  let idx = 0
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64)
  }
  return idx
}

export interface SheetCell {
  col: number
  value: string | number | null
  style?: number
  formula?: string
}

export interface SheetRow {
  row: number
  cells: SheetCell[]
  height?: number
}

export interface SheetSpec {
  name: string
  rows: SheetRow[]
  merges: string[]
  colWidths: number[]
  landscape?: boolean
}

export function buildWorksheetXml(spec: SheetSpec): string {
  const colsXml = spec.colWidths.length
    ? `<cols>${spec.colWidths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : ''

  const sortedRows = [...spec.rows].sort((a, b) => a.row - b.row)
  const rowsXml = sortedRows.map((r) => {
    const sortedCells = [...r.cells].sort((a, b) => a.col - b.col)
    const cellsXml = sortedCells.map((c) => {
      const ref = `${colLetter(c.col)}${r.row}`
      const sAttr = c.style !== undefined ? ` s="${c.style}"` : ' s="1"'
      if (c.formula) {
        const cached = typeof c.value === 'number' && Number.isFinite(c.value)
          ? `<v>${c.value}</v>`
          : c.value !== null && c.value !== undefined && String(c.value) !== ''
            ? `<v>${escXml(c.value)}</v>`
            : ''
        return `<c r="${ref}"${sAttr}><f>${escXml(c.formula)}</f>${cached}</c>`
      }
      if (typeof c.value === 'number' && Number.isFinite(c.value)) {
        return `<c r="${ref}"${sAttr}><v>${c.value}</v></c>`
      }
      if (c.value === null || c.value === undefined || c.value === '') {
        return `<c r="${ref}"${sAttr}/>`
      }
      return `<c r="${ref}" t="inlineStr"${sAttr}><is><t xml:space="preserve">${escXml(c.value)}</t></is></c>`
    }).join('')
    const ht = r.height ? ` ht="${r.height}" customHeight="1"` : ''
    return `<row r="${r.row}"${ht}>${cellsXml}</row>`
  }).join('')

  const mergesXml = spec.merges.length
    ? `<mergeCells count="${spec.merges.length}">${spec.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : ''

  const orientation = spec.landscape ? 'landscape' : 'portrait'
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
${colsXml}
<sheetData>${rowsXml}</sheetData>
${mergesXml}
<pageSetup orientation="${orientation}" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`
}

export function stylesXml(): string {
  // Styles:
  // 0: default (no border, left)
  // 1: plain text (left, wrap, v-center)
  // 2: title bold 13 center
  // 3: table header (bold, thin border, fill #E2E8F0, center, wrap)
  // 4: table body left (thin border, left, wrap)
  // 5: table body center (thin border, center, wrap)
  // 6: table body right (thin border, right)
  // 7: table total bold center (thin border, fill #F1F5F9, bold, center)
  // 8: table total bold left (thin border, fill #F1F5F9, bold, left)
  // 9: section subheading bold left
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
  <font><sz val="10"/><name val="Calibri"/></font>
  <font><b/><sz val="10"/><name val="Calibri"/></font>
  <font><b/><sz val="13"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
</fills>
<borders count="2">
  <border><left/><right/><top/><bottom/><diagonal/></border>
  <border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
}

export function rowBuilder() {
  const map = new Map<number, SheetRow>()
  function set(row: number, col: number, value: string | number | null, style = 4, formula?: string) {
    let entry = map.get(row)
    if (!entry) {
      entry = { row, cells: [] }
      map.set(row, entry)
    }
    const existingIdx = entry.cells.findIndex(c => c.col === col)
    const cell: SheetCell = { col, value, style, formula }
    if (existingIdx >= 0) entry.cells[existingIdx] = cell
    else entry.cells.push(cell)
  }
  function setHeight(row: number, height: number) {
    let entry = map.get(row)
    if (!entry) {
      entry = { row, cells: [] }
      map.set(row, entry)
    }
    entry.height = height
  }
  function styleRange(r1: number, c1: number, r2: number, c2: number, style: number) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const entry = map.get(r)
        const existing = entry?.cells.find(cell => cell.col === c)
        if (!existing) set(r, c, null, style)
      }
    }
  }
  return {
    set,
    setHeight,
    styleRange,
    rows: () => Array.from(map.values()),
  }
}
