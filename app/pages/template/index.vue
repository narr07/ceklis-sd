<script setup lang="ts">
import { paket, templates } from '~/data/templates'
import { peranInfo, type Peran } from '~/data/checklists'

const peran = ref<'semua' | Peran>('semua')
const kategori = ref('Semua')
const cari = ref('')
const peranItems = [{ label: 'Semua peran', value: 'semua' }, ...(Object.keys(peranInfo) as Peran[]).map(k => ({ label: peranInfo[k].nama, value: k }))]
const kategoriItems = ['Semua', 'RKAS', 'SK', 'Dapodik', 'Keuangan', 'Pengadaan']
const icon: Record<string, string> = { RKAS: 'i-lucide-clipboard-list', SK: 'i-lucide-stamp', Dapodik: 'i-lucide-database', Keuangan: 'i-lucide-banknote', Pengadaan: 'i-lucide-shopping-cart' }

const hasil = computed(() => templates.filter(t =>
  (peran.value === 'semua' || t.peran.includes(peran.value))
  && (kategori.value === 'Semua' || t.kategori === kategori.value)
  && (`${t.judul} ${t.deskripsi}`.toLowerCase().includes(cari.value.toLowerCase())),
))

function resetFilter() {
  cari.value = ''
  peran.value = 'semua'
  kategori.value = 'Semua'
}
</script>

<template>
  <UDashboardPanel id="templates">
    <template #header>
      <UDashboardNavbar title="Pustaka Template">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="neutral" variant="subtle">
            {{ hasil.length }} template
          </UBadge>
        </template>

        <template #right>
          <UButton to="/profil" color="neutral" variant="outline" size="sm" icon="i-lucide-school" label="Profil & Kop Surat" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="overflow-x-auto">
        <template #left>
          <div class="flex flex-wrap items-center gap-2">
            <UInput v-model="cari" icon="i-lucide-search" placeholder="Cari template..." size="sm" class="w-56" />
            <USelect v-model="peran" :items="peranItems" size="sm" class="w-44" />
          </div>
        </template>
        <template #right>
          <UTabs v-model="kategori" :items="kategoriItems.map(k => ({ label: k, value: k }))" :content="false" size="xs" class="w-max" :ui="{ list: 'w-max', trigger: 'shrink-0' }" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <p class="text-sm text-muted">
          Kop surat dan pejabat terisi otomatis dari <NuxtLink to="/profil" class="text-primary underline">profil sekolah</NuxtLink>. Pratinjau naskah dinas di layar, lalu unduh sebagai Word (.docx).
        </p>

        <UCard v-for="k in paket" :key="k.id" class="ring-primary/40">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-package" class="mt-1 size-7 text-primary" />
              <div>
                <p class="font-semibold text-highlighted">{{ k.judul }}</p>
                <p class="text-sm text-muted">{{ k.deskripsi }}</p>
              </div>
            </div>
            <UButton :to="`/template/${k.id}`" icon="i-lucide-arrow-right" trailing label="Buka paket" />
          </div>
        </UCard>

        <div v-if="hasil.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="t in hasil"
            :key="t.id"
            :to="`/template/${t.id}`"
            class="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UCard class="h-full transition hover:ring-primary">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <UIcon :name="icon[t.kategori]" class="size-5 text-primary" />
                  <UBadge color="neutral" variant="subtle" size="sm">{{ t.kategori }}</UBadge>
                </div>
                <p class="font-semibold text-highlighted">{{ t.judul }}</p>
                <p class="text-sm text-muted">{{ t.deskripsi }}</p>
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="p in t.peran" :key="p" variant="outline" size="sm">{{ peranInfo[p].nama }}</UBadge>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <UEmpty
          v-else
          icon="i-lucide-file-search"
          title="Tidak ada template yang cocok"
          description="Coba ubah kata kunci pencarian, peran, atau kategori yang dipilih."
          :actions="[{ label: 'Reset Filter', color: 'primary', variant: 'outline', onClick: resetFilter }]"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
