export default defineEventHandler(async (event) => {
  const panjang = Number(getHeader(event, 'content-length') || 0)
  if (panjang > MAX_SYNC_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran database melebihi batas 10 MB.' })
  }

  const npsn = normalizeNpsnKey(getHeader(event, 'x-school-npsn'))
  verifySyncAuth(event, npsn)

  const raw = await readRawBody(event, 'utf8')
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_SYNC_BYTES) {
    throw createError({ statusCode: raw ? 413 : 400, statusMessage: raw ? 'Ukuran database melebihi batas 10 MB.' : 'Body kosong.' })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Payload JSON database tidak valid.' })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Payload JSON database tidak valid.' })
  }

  if (String(body.npsn || '') !== npsn) {
    throw createError({ statusCode: 400, statusMessage: 'NPSN di paket tidak sama dengan header X-School-NPSN.' })
  }
  if (!validasiIsiDatabase(body.data)) {
    throw createError({ statusCode: 422, statusMessage: 'Isi paket bukan database Ceklis SD yang valid (field data.profil wajib ada).' })
  }

  const storage = useStorage('data')
  const key = ceklisStorageKey(npsn)
  const stored = await storage.getItem<SyncEnvelopeRecord>(key)
  const baseUpdatedAt = String(body.baseUpdatedAt || '')
  if (stored && body.force !== true && baseUpdatedAt !== stored.updatedAt) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Data di server sudah diubah dari perangkat lain sejak sinkron terakhir. Ambil data server dulu, atau kirim ulang dengan menimpa.',
      data: { serverUpdatedAt: stored.updatedAt },
    })
  }

  const envelope: SyncEnvelopeRecord = {
    schemaVersion: Number(body.schemaVersion || 1),
    npsn,
    sekolah: String(body.sekolah || '').slice(0, 200),
    updatedAt: new Date().toISOString(),
    checksum: typeof body.checksum === 'string' ? body.checksum.slice(0, 128) : '',
    data: body.data,
  }
  await storage.setItem(key, envelope)

  return {
    ok: true,
    npsn,
    sekolah: envelope.sekolah,
    updatedAt: envelope.updatedAt,
  }
})
