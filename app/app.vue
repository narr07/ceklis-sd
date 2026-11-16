<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { kelompokUntuk, type Peran } from '~/data/checklists'
import { DIPERIKSA, regulasi } from '~/data/regulasi'
import { paket, templates } from '~/data/templates'
import { bacaProgresTerhidrasi } from '~/composables/useStore'

const { isDesktop, isWebNitro } = useDesktopBackend()
const { initStorage } = useDatabaseSync()
const { profil } = useProfil()
const { periode } = usePeriode()

onMounted(() => initStorage())

// Jangan biarkan gagal simpan terjadi diam-diam: tampilkan peringatan yang tidak hilang sendiri.
const toastGalat = useToast()
watch(galatPenyimpanan, (pesan) => {
  if (!pesan) return
  toastGalat.add({
    id: 'galat-penyimpanan',
    title: 'Data tidak tersimpan',
    description: pesan,
    color: 'error',
    icon: 'i-lucide-triangle-alert',
    duration: Number.POSITIVE_INFINITY,
    progress: false,
    'onUpdate:open': (open: boolean) => {
      if (!open) galatPenyimpanan.value = null
    },
  })
})

const open = ref(false)

function hitungPeran(peran: Peran) {
  const items = kelompokUntuk(peran, periode.value.semester).flatMap(k => k.items)
  const st = bacaProgresTerhidrasi(peran, periode.value.ta, periode.value.semester)
  const done = items.filter(i => st.done[i.id]).length
  return { done, total: items.length }
}

const progresPeran = computed(() => ({
  kepsek: hitungPeran('kepsek'),
  operator: hitungPeran('operator'),
  bendahara: hitungPeran('bendahara'),
}))

const tutupSidebar = () => {
  open.value = false
}

const links = computed<NavigationMenuItem[][]>(() => {
  const p = progresPeran.value
  return [
    [
      { label: 'Beranda', to: '/', icon: 'i-lucide-house', onSelect: tutupSidebar },
      { label: 'Kepala Sekolah', to: '/checklist/kepsek', icon: 'i-lucide-user-round-check', badge: `${p.kepsek.done}/${p.kepsek.total}`, onSelect: tutupSidebar },
      { label: 'SK Beban Mengajar & Jadwal', to: '/skbm', icon: 'i-lucide-calendar-range', onSelect: tutupSidebar },
      {
        label: 'Operator Sekolah',
        icon: 'i-lucide-monitor-cog',
        defaultOpen: true,
        children: [
          { label: 'Checklist Operator', to: '/checklist/operator', icon: 'i-lucide-list-checks', badge: `${p.operator.done}/${p.operator.total}`, onSelect: tutupSidebar },
          { label: 'Daftar 1 (Bulanan)', to: '/daftar-1', icon: 'i-lucide-table-properties', onSelect: tutupSidebar },
        ],
      },
      { label: 'Bendahara BOSP', to: '/checklist/bendahara', icon: 'i-lucide-wallet', badge: `${p.bendahara.done}/${p.bendahara.total}`, onSelect: tutupSidebar },
      { label: 'Pustaka Template', to: '/template', icon: 'i-lucide-file-text', badge: String(templates.length + paket.length), onSelect: tutupSidebar },
      { label: 'Dasar Aturan', to: '/regulasi', icon: 'i-lucide-scale', badge: String(regulasi.length), onSelect: tutupSidebar },
      { label: 'Profil & Database', to: '/profil', icon: 'i-lucide-school', onSelect: tutupSidebar },
    ],
    [
      {
        label: isDesktop.value
          ? 'Software Desktop Offline'
          : isWebNitro.value
            ? 'Website + Server Sinkron'
            : 'Situs Statis (Data di Browser)',
        icon: isDesktop.value
          ? 'i-lucide-hard-drive'
          : isWebNitro.value
            ? 'i-lucide-server'
            : 'i-lucide-database',
        to: '/profil',
        onSelect: tutupSidebar,
      },
      {
        label: `Aturan per ${DIPERIKSA}`,
        icon: 'i-lucide-shield-check',
        to: '/regulasi',
        onSelect: tutupSidebar,
      },
    ],
  ]
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right' }">
    <UDashboardGroup unit="rem" storage="local" storage-key="ceklis-dashboard">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        collapsible
        resizable
        class="no-print bg-elevated/25"
        :ui="{ footer: 'lg:border-t lg:border-default' }"
      >
        <template #header="{ collapsed }">
          <NuxtLink to="/" class="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md" @click="open = false">
            <AppLogo :mark="collapsed" />
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[0]"
            orientation="vertical"
            tooltip
            popover
          />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[1]"
            orientation="vertical"
            tooltip
            class="mt-auto"
          />
        </template>

        <template #footer="{ collapsed }">
          <div class="flex w-full items-center justify-between gap-2">
            <NuxtLink
              v-if="!collapsed"
              to="/profil"
              class="min-w-0 flex-1 rounded-md px-1.5 py-1 transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @click="open = false"
            >
              <p class="truncate text-xs font-semibold text-highlighted">{{ profil.sekolah }}</p>
              <p class="truncate font-mono text-[11px] text-muted">NPSN {{ profil.npsn || '-' }}</p>
            </NuxtLink>
            <UColorModeButton :class="collapsed ? 'mx-auto' : 'shrink-0'" />
          </div>
        </template>
      </UDashboardSidebar>

      <NuxtPage />
    </UDashboardGroup>

    <SambutanAwal />
    <SptjmPembaruanModal />
    <AreaCetak />
  </UApp>
</template>
