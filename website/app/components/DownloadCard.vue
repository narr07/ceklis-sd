<script setup lang="ts">
const { data: rilis, status, error } = useRilisTerbaru()
const installer = computed(() => installerWindows(rilis.value))
const memuat = computed(() => status.value === 'pending' || status.value === 'idle')
const belumAda = computed(() => status.value === 'error' || (status.value === 'success' && !installer.value.exe && !installer.value.msi))
const pesanBelumAda = computed(() => (error.value?.statusCode === 403
  ? 'Batas akses GitHub tercapai sementara. Coba muat ulang beberapa menit lagi, atau buka halaman rilis langsung.'
  : 'Pantau halaman rilis GitHub; tombol unduh di sini otomatis muncul begitu installer tersedia.'))
</script>

<template>
  <UPageCard
    variant="subtle"
    class="mx-auto w-full max-w-3xl"
    :ui="{ container: 'gap-y-5' }"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <AppLogo
          mark
          class="size-12"
        />
        <div>
          <p class="text-lg font-semibold text-highlighted">
            Ceklis SD untuk Windows
          </p>
          <p class="text-sm text-muted">
            Windows 10/11 · 64-bit · bekerja tanpa internet
          </p>
        </div>
      </div>
      <USkeleton
        v-if="memuat"
        class="h-6 w-32"
      />
      <UBadge
        v-else-if="rilis && !belumAda"
        color="primary"
        variant="subtle"
        size="lg"
        :label="`${rilis.tag_name} · ${tanggalRilis(rilis.published_at)}`"
      />
    </div>

    <div
      v-if="memuat"
      class="grid gap-3 sm:grid-cols-2"
    >
      <USkeleton class="h-12" />
      <USkeleton class="h-12" />
    </div>

    <UAlert
      v-else-if="belumAda"
      color="info"
      variant="subtle"
      icon="i-lucide-package-open"
      title="Installer rilis pertama sedang disiapkan"
      :description="pesanBelumAda"
      :actions="[{ label: 'Buka halaman rilis', to: URL_RILIS, target: '_blank', color: 'info', variant: 'outline', trailingIcon: 'i-lucide-external-link' }]"
    />

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2"
    >
      <UButton
        v-if="installer.exe"
        :to="installer.exe.browser_download_url"
        size="xl"
        block
        icon="i-lucide-download"
        :label="`Installer .exe (${ukuranMb(installer.exe.size)})`"
      />
      <UButton
        v-if="installer.msi"
        :to="installer.msi.browser_download_url"
        size="xl"
        block
        color="neutral"
        variant="outline"
        icon="i-lucide-package"
        :label="`Paket .msi (${ukuranMb(installer.msi.size)})`"
      />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
      <p>
        Windows mungkin menampilkan peringatan SmartScreen karena installer belum ditandatangani.
        <ULink
          to="/panduan/instalasi"
          class="font-medium text-primary"
        >Lihat cara memasang</ULink>.
      </p>
      <ULink
        :to="URL_RILIS"
        target="_blank"
        class="inline-flex items-center gap-1"
      >
        Semua versi <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4"
        />
      </ULink>
    </div>
  </UPageCard>
</template>
