import { beforeAll, describe, expect, it } from 'vitest'

// Util server memakai auto-import Nitro; untuk test unit cukup tiruan createError.
beforeAll(() => {
  (globalThis as Record<string, unknown>).createError = (o: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(o.statusMessage), o)
})

const { normalizeNpsnKey, parseSyncTokens, validasiIsiDatabase } = await import('~~/server/utils/ceklisSync')

describe('token sinkronisasi per sekolah', () => {
  it('membaca format NPSN:token dan mengabaikan entri lemah/rusak', () => {
    const map = parseSyncTokens('10000001:token-sekolah-satu-panjang, 10000002:pendek,\n10000003:token-sekolah-tiga-panjang;rusak, ../x:token-path-traversal-panjang')
    expect([...map.keys()]).toEqual(['10000001', '10000003'])
    expect(map.get('10000001')).toBe('token-sekolah-satu-panjang')
  })

  it('kosong berarti sinkronisasi mati', () => {
    expect(parseSyncTokens('').size).toBe(0)
    expect(parseSyncTokens(undefined).size).toBe(0)
  })
})

describe('validasi input server', () => {
  it('NPSN hanya karakter aman', () => {
    expect(normalizeNpsnKey(' 10000001 ')).toBe('10000001')
    expect(() => normalizeNpsnKey('../../etc')).toThrow()
    expect(() => normalizeNpsnKey('')).toThrow()
    expect(() => normalizeNpsnKey('1'.repeat(33))).toThrow()
  })

  it('isi database wajib punya profil dan bagian lain bertipe objek', () => {
    expect(validasiIsiDatabase({ profil: { sekolah: 'SD' }, progress: {} })).toBe(true)
    expect(validasiIsiDatabase({ progress: {} })).toBe(false)
    expect(validasiIsiDatabase({ profil: {}, progress: [] })).toBe(false)
    expect(validasiIsiDatabase([])).toBe(false)
    expect(validasiIsiDatabase(null)).toBe(false)
  })
})
