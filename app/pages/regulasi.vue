<script setup lang="ts">
import { DIPERIKSA, regulasi } from '~/data/regulasi'

const cari = ref('')
const hasil = computed(() => {
  const q = cari.value.trim().toLowerCase()
  if (!q) return regulasi
  return regulasi.filter(r =>
    r.judul.toLowerCase().includes(q)
    || r.nomor.toLowerCase().includes(q)
    || r.poin.some(p => p.toLowerCase().includes(q)),
  )
})
</script>

<template>
  <UDashboardPanel id="regulasi">
    <template #header>
      <UDashboardNavbar title="Dasar Aturan">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="info" variant="subtle">
            Diperiksa {{ DIPERIKSA }}
          </UBadge>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="cari" icon="i-lucide-search" placeholder="Cari nomor aturan atau topik..." size="sm" class="w-64" />
        </template>
        <template #right>
          <span class="text-xs text-muted">{{ hasil.length }} regulasi ditampilkan</span>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-scale"
          title="Alat bantu, bukan rujukan hukum"
          :description="`Ringkasan di bawah ini dibuat untuk memudahkan, terakhir diperiksa ${DIPERIKSA}, dan bisa tertinggal dari perubahan aturan. Sebelum mengambil keputusan anggaran, pajak, atau pertanggungjawaban, cocokkan dengan teks resmi di JDIH/BPK dan arahan dinas pendidikan setempat.`"
        />

        <div v-if="hasil.length" class="space-y-4">
          <UCard v-for="r in hasil" :key="r.id">
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="font-semibold text-highlighted">{{ r.judul }}</p>
                  <p class="text-sm text-primary">
                    {{ r.nomor }}<span v-if="r.ditetapkan" class="text-muted"> · ditetapkan {{ r.ditetapkan }}</span>
                  </p>
                  <p class="text-xs text-muted">Ringkasan diperiksa {{ r.diperiksa }}</p>
                </div>
                <UButton v-if="r.url" :to="r.url" target="_blank" size="xs" variant="outline" color="neutral" icon="i-lucide-external-link" label="Sumber" />
                <UBadge v-else color="warning" variant="subtle" icon="i-lucide-link-2-off" label="Sumber resmi belum ditautkan" />
              </div>
            </template>
            <ul class="list-disc space-y-1.5 pl-5 text-sm">
              <li v-for="(p, i) in r.poin" :key="i">{{ p }}</li>
            </ul>
          </UCard>
        </div>

        <UEmpty
          v-else
          icon="i-lucide-scale"
          title="Tidak ada aturan yang cocok"
          description="Ubah atau hapus kata kunci pencarian untuk melihat seluruh daftar regulasi."
          :actions="[{ label: 'Tampilkan Semua', color: 'primary', variant: 'outline', onClick: () => { cari = '' } }]"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
