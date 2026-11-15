export default defineEventHandler(async (event) => {
  const npsn = normalizeNpsnKey(getQuery(event).npsn || getHeader(event, 'x-school-npsn'))
  verifySyncAuth(event, npsn)

  const stored = await useStorage('data').getItem<SyncEnvelopeRecord>(ceklisStorageKey(npsn))
  if (!stored) {
    throw createError({
      statusCode: 404,
      statusMessage: `Belum ada database sekolah tersimpan di server untuk NPSN ${npsn}.`,
    })
  }

  return {
    ok: true,
    npsn,
    updatedAt: stored.updatedAt,
    envelope: stored,
  }
})
