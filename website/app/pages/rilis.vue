<script setup lang="ts">
const { data: daftar, status } = useSemuaRilis()

useSeoMeta({
  title: 'Catatan Rilis',
  description: 'Perubahan di setiap versi Ceklis SD, langsung dari GitHub Releases.'
})

const installerDari = (r: RilisGithub) => r.assets.filter(a => /\.(exe|msi)$/i.test(a.name))
const denganChecksum = (r: RilisGithub) => installerDari(r).filter(a => sha256Aset(a))
</script>

<template>
  <UContainer>
    <UPageHeader
      title="Catatan Rilis"
      description="Perubahan di setiap versi Ceklis SD, diambil langsung dari GitHub Releases."
      class="py-12"
    >
      <template #links>
        <UButton
          :to="URL_RILIS"
          target="_blank"
          color="neutral"
          variant="outline"
          icon="i-simple-icons-github"
          label="Lihat di GitHub"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <div
        v-if="status === 'pending' || status === 'idle'"
        class="space-y-4"
      >
        <USkeleton
          v-for="n in 3"
          :key="n"
          class="h-32"
        />
      </div>

      <UEmpty
        v-else-if="!daftar?.length"
        icon="i-lucide-package-open"
        title="Belum ada rilis"
        description="Versi pertama sedang disiapkan. Catatan perubahan akan muncul di sini otomatis."
        :actions="[{ label: 'Buka halaman rilis GitHub', to: URL_RILIS, target: '_blank', variant: 'outline' }]"
      />

      <UChangelogVersions v-else>
        <UChangelogVersion
          v-for="r in daftar"
          :key="r.tag_name"
          :title="r.name || r.tag_name"
          :date="r.published_at"
          :badge="r.prerelease ? 'Pra-rilis' : r.tag_name"
          :to="r.html_url"
          target="_blank"
        >
          <template #body>
            <MDC
              v-if="r.body"
              :value="r.body"
            />
            <div class="mt-4 flex flex-wrap gap-2">
              <UButton
                v-for="a in installerDari(r)"
                :key="a.name"
                :to="a.browser_download_url"
                size="sm"
                color="neutral"
                variant="outline"
                icon="i-lucide-download"
                :label="`${a.name} (${ukuranMb(a.size)})`"
              />
            </div>
            <UCollapsible
              v-if="denganChecksum(r).length"
              class="mt-3"
            >
              <UButton
                size="xs"
                color="neutral"
                variant="link"
                icon="i-lucide-fingerprint"
                trailing-icon="i-lucide-chevron-down"
                label="Checksum SHA-256"
                class="px-0"
              />
              <template #content>
                <dl class="mt-2 space-y-2 text-xs">
                  <div
                    v-for="a in denganChecksum(r)"
                    :key="a.name"
                  >
                    <dt class="text-muted">
                      {{ a.name }}
                    </dt>
                    <dd class="break-all font-mono select-all">
                      {{ sha256Aset(a) }}
                    </dd>
                  </div>
                </dl>
                <p class="mt-2 text-xs text-muted">
                  Cocokkan dengan hasil <code>Get-FileHash</code>. <ULink
                    to="/panduan/instalasi#memastikan-file-asli"
                    class="underline"
                  >Caranya</ULink>
                </p>
              </template>
            </UCollapsible>
          </template>
        </UChangelogVersion>
      </UChangelogVersions>
    </UPageBody>
  </UContainer>
</template>
