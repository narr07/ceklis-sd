export default defineEventHandler((event) => {
  const { syncTokens } = useRuntimeConfig(event)
  return {
    ok: true,
    runtime: 'nitro-server',
    app: 'ceklis-sd',
    syncEnabled: parseSyncTokens(syncTokens).size > 0,
    updatedAt: new Date().toISOString(),
  }
})
