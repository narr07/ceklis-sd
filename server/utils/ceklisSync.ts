import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export interface SyncEnvelopeRecord {
  schemaVersion: number
  npsn: string
  sekolah: string
  /** Waktu server saat data diterima; dipakai sebagai versi untuk deteksi konflik. */
  updatedAt: string
  /** BLAKE3 dari klien desktop (kosong untuk klien web). Hanya pendeteksi kerusakan, bukan autentikasi. */
  checksum: string
  data: Record<string, unknown>
}

/** Batas ukuran body sinkronisasi (logo kop surat berupa data URL bisa cukup besar). */
export const MAX_SYNC_BYTES = 10 * 1024 * 1024

/**
 * Baca daftar token per sekolah dari `NUXT_SYNC_TOKENS`, format `NPSN:token` dipisah koma/baris baru.
 * Contoh: `NUXT_SYNC_TOKENS="10000001:rahasia-panjang-a,10000002:rahasia-panjang-b"`.
 */
export function parseSyncTokens(raw: unknown): Map<string, string> {
  const map = new Map<string, string>()
  for (const part of String(raw || '').split(/[\n,;]+/)) {
    const idx = part.indexOf(':')
    if (idx <= 0) continue
    const npsn = part.slice(0, idx).trim()
    const token = part.slice(idx + 1).trim()
    if (/^[A-Za-z0-9_-]+$/.test(npsn) && token.length >= 16) map.set(npsn, token)
  }
  return map
}

function samaAman(a: string, b: string) {
  // Bandingkan digest berukuran tetap supaya waktu pembandingan tidak membocorkan isi/panjang token.
  const da = createHash('sha256').update(a).digest()
  const db = createHash('sha256').update(b).digest()
  return timingSafeEqual(da, db)
}

/**
 * Wajib dipanggil setiap endpoint sinkronisasi. Tanpa token yang dikonfigurasi, sinkronisasi MATI,
 * dan setiap token hanya berlaku untuk satu NPSN sehingga sekolah A tidak bisa membaca data sekolah B.
 */
export function verifySyncAuth(event: H3Event, npsn: string) {
  const { syncTokens } = useRuntimeConfig(event)
  const tokens = parseSyncTokens(syncTokens)
  if (!tokens.size) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Sinkronisasi server belum diaktifkan. Pengelola server perlu mengisi NUXT_SYNC_TOKENS (format NPSN:token, minimal 16 karakter).',
    })
  }

  const auth = getHeader(event, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const expected = tokens.get(npsn)
  if (!token || !expected || !samaAman(token, expected)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token sinkronisasi tidak valid untuk NPSN ini.',
    })
  }
}

/**
 * Normalisasi kode NPSN menjadi key storage yang aman tanpa karakter path traversal.
 */
export function normalizeNpsnKey(raw: unknown): string {
  const cleaned = String(raw || '').trim()
  if (!cleaned || !/^[A-Za-z0-9_-]{1,32}$/.test(cleaned)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter NPSN wajib diisi dan hanya boleh berisi huruf, angka, "-" atau "_" (maks. 32 karakter).',
    })
  }
  return cleaned
}

export function ceklisStorageKey(npsn: string): string {
  return `ceklis:${npsn}.json`
}

/** Validasi bentuk isi database supaya server tidak menyimpan JSON sembarang. */
export function validasiIsiDatabase(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const d = data as Record<string, unknown>
  if (!d.profil || typeof d.profil !== 'object' || Array.isArray(d.profil)) return false
  for (const k of ['progress', 'isian', 'periode', 'daftar1']) {
    if (k in d && (typeof d[k] !== 'object' || d[k] === null || Array.isArray(d[k]))) return false
  }
  return true
}
