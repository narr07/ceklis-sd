<script setup lang="ts">
const columns = [{
  label: 'Aplikasi',
  children: [
    { label: 'Fitur', to: '/#fitur' },
    { label: 'Unduh', to: '/#unduh' },
    { label: 'Catatan rilis', to: '/rilis' }
  ]
}, {
  label: 'Panduan',
  children: [
    { label: 'Mulai', to: '/panduan/mulai' },
    { label: 'Impor SPTJM Dapodik', to: '/panduan/impor-sptjm' },
    { label: 'SK Beban Mengajar & Jadwal', to: '/panduan/skbm-jadwal' }
  ]
}, {
  label: 'Proyek',
  children: [
    { label: 'Kode sumber', to: URL_REPO, target: '_blank' },
    { label: 'Laporkan masalah', to: URL_ISSUE, target: '_blank' },
    { label: 'Kebijakan privasi', to: '/privasi' },
    { label: 'Ketentuan layanan', to: '/ketentuan' },
    { label: 'Lisensi MIT', to: `${URL_REPO}/blob/main/LICENSE`, target: '_blank' }
  ]
}]
</script>

<template>
  <USeparator class="h-px" />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #left>
            <div class="max-w-xs space-y-3">
              <AppLogo class="h-7" />
              <p class="text-sm text-muted">
                Checklist & template administrasi SD untuk operator, kepala sekolah, dan bendahara. Gratis dan sumber terbuka.
              </p>
            </div>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">
        © {{ new Date().getFullYear() }} Dinar Permadi Yusup · Lisensi MIT
      </p>
    </template>

    <template #right>
      <UButton
        :to="URL_REPO"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="Ceklis SD di GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
