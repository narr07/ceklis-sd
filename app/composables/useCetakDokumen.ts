import type { Block } from '~/utils/blocks'

/**
 * Cetak dan simpan PDF dokumen.
 * - Desktop: PDF dibuat langsung oleh WebView2 (`simpan_pdf`), sama persis dengan pratinjau,
 *   termasuk halaman lanskap; pengguna memilih lokasi simpan.
 * - Browser: membuka dialog cetak; pilih "Simpan sebagai PDF".
 */
export function useCetakDokumen() {
  const isi = useState<{ blocks: Block[] } | null>('cetak-dokumen', () => null)
  const { isDesktop, simpanPdf: simpanPdfBackend } = useDesktopBackend()

  async function siapkan(blocks?: Block[]) {
    if (blocks) isi.value = { blocks }
    document.documentElement.classList.add('mode-cetak')
    await nextTick()
    // Tunggu font & tata letak selesai agar PDF tidak memakai font cadangan.
    await document.fonts?.ready
    await new Promise(r => setTimeout(r, 200))
  }

  function selesai() {
    document.documentElement.classList.remove('mode-cetak')
    isi.value = null
  }

  /** Buka dialog cetak untuk dokumen (blok) tertentu. */
  async function cetak(blocks: Block[]) {
    await siapkan(blocks)
    // Dialog cetak WebView2/peramban bisa tidak memblokir; bersihkan setelah selesai mencetak.
    window.addEventListener('afterprint', selesai, { once: true })
    window.print()
  }

  /**
   * Simpan dokumen sebagai PDF. Tanpa `blocks`, halaman yang sedang tampil yang dicetak
   * (mis. lembar Daftar 1 yang punya aturan cetak sendiri).
   * @returns path file PDF, atau null bila dibatalkan / memakai dialog cetak peramban.
   */
  async function simpanPdf(namaBerkas: string, blocks?: Block[]): Promise<string | null> {
    if (!isDesktop.value) {
      if (blocks) await cetak(blocks)
      else window.print()
      return null
    }
    if (blocks) await siapkan(blocks)
    try {
      return await simpanPdfBackend(namaBerkas)
    }
    finally {
      if (blocks) selesai()
    }
  }

  return { isi, isDesktop, siapkan, selesai, cetak, simpanPdf }
}
