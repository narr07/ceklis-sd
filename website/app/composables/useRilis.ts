export interface AsetRilis {
  name: string
  size: number
  browser_download_url: string
  download_count: number
  /** Sidik jari dari GitHub, mis. "sha256:2a39…". Tidak ada pada aset lama. */
  digest?: string | null
}

export interface RilisGithub {
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string
  prerelease: boolean
  draft: boolean
  assets: AsetRilis[]
}

/** Pilih installer Windows dari aset rilis: setup .exe (NSIS) dan .msi. */
export function installerWindows(r?: RilisGithub | null) {
  const aset = r?.assets ?? []
  return {
    exe: aset.find(a => /setup\.exe$/i.test(a.name)) ?? aset.find(a => /\.exe$/i.test(a.name)),
    msi: aset.find(a => /\.msi$/i.test(a.name))
  }
}

/** Nilai SHA-256 aset (huruf besar, seperti keluaran Get-FileHash), atau '' bila tidak tersedia. */
export const sha256Aset = (a: AsetRilis) =>
  a.digest?.startsWith('sha256:') ? a.digest.slice(7).toUpperCase() : ''

export const ukuranMb = (b: number) => `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`

export const tanggalRilis = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Rilis terbaru diambil langsung dari GitHub di peramban pengunjung (bukan saat build),
 * sehingga tombol unduh selalu mengarah ke versi terbaru tanpa perlu membangun ulang situs.
 */
export function useRilisTerbaru() {
  return useFetch<RilisGithub>(`https://api.github.com/repos/${REPO}/releases/latest`, {
    key: 'rilis-terbaru',
    server: false,
    lazy: true,
    headers: { Accept: 'application/vnd.github+json' }
  })
}

export function useSemuaRilis() {
  return useFetch<RilisGithub[]>(`https://api.github.com/repos/${REPO}/releases`, {
    key: 'semua-rilis',
    server: false,
    lazy: true,
    query: { per_page: 20 },
    headers: { Accept: 'application/vnd.github+json' },
    transform: list => list.filter(r => !r.draft)
  })
}
