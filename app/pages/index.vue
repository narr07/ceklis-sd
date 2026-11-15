<script setup lang="ts">
import { checklists, kelompokUntuk, peranInfo, type Peran } from '~/data/checklists'
import { bacaProgresTerhidrasi } from '~/composables/useStore'

const { profil } = useProfil()
const { periode } = usePeriode()
const { didukung, aktif, togglePengingat, cekHarian } = useDeadlineReminder()

onMounted(() => cekHarian())

const peranList = Object.keys(peranInfo) as Peran[]

const ringkas = computed(() => peranList.map((peran) => {
  const items = kelompokUntuk(peran, periode.value.semester).flatMap(k => k.items)
  const st = bacaProgresTerhidrasi(peran, periode.value.ta, periode.value.semester)
  const done = items.filter(i => st.done[i.id]).length
  return { peran, total: items.length, done, pct: items.length ? Math.round(done / items.length * 100) : 0 }
}))

const totalDone = computed(() => ringkas.value.reduce((acc, r) => acc + r.done, 0))
const totalItems = computed(() => ringkas.value.reduce((acc, r) => acc + r.total, 0))
const totalPct = computed(() => totalItems.value ? Math.round(totalDone.value / totalItems.value * 100) : 0)

const tenggat = computed(() => {
  const out: { peran: Peran, judul: string, tenggat: string }[] = []
  for (const peran of peranList)
    for (const k of checklists[peran])
      for (const i of k.items)
        if (i.tenggat && !out.some(o => o.judul === i.judul)) out.push({ peran, judul: i.judul, tenggat: i.tenggat })
  return out
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Beranda" :ui="{ right: 'gap-2' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="primary" variant="subtle" class="hidden sm:inline-flex max-w-60 truncate">
            {{ profil.sekolah }}
          </UBadge>
        </template>

        <template #right>
          <UButton
            v-if="didukung"
            size="sm"
            :color="aktif ? 'primary' : 'neutral'"
            :variant="aktif ? 'soft' : 'outline'"
            :icon="aktif ? 'i-lucide-bell-ring' : 'i-lucide-bell'"
            :label="aktif ? 'Pengingat aktif' : 'Aktifkan pengingat'"
            class="hidden sm:inline-flex"
            @click="togglePengingat"
          />
          <UButton
            to="/template/paket-rkas"
            size="sm"
            icon="i-lucide-file-down"
            label="Buat Paket RKAS"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <PeriodePicker compact />
        </template>
        <template #right>
          <span class="text-xs text-muted">
            Progres gabungan: <strong class="font-semibold text-highlighted">{{ totalDone }}/{{ totalItems }}</strong> ({{ totalPct }}%)
          </span>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <section class="space-y-2">
          <h2 class="text-2xl font-bold tracking-tight text-highlighted md:text-3xl">
            Checklist & template administrasi SD
          </h2>
          <p class="max-w-3xl text-sm text-muted md:text-base">
            Pekerjaan wajib tiap awal semester, awal tahun ajaran, dan awal tahun anggaran untuk operator, kepala sekolah, dan bendahara. Mengacu pada Juknis BOSP 2026, aturan belanja sekolah 2026, Dapodik 2027, dan Coretax.
          </p>
        </section>

        <section class="grid gap-4 md:grid-cols-3">
          <NuxtLink
            v-for="r in ringkas"
            :key="r.peran"
            :to="`/checklist/${r.peran}`"
            class="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <UCard class="h-full transition group-hover:ring-primary">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="rounded-lg bg-primary/10 p-2">
                    <UIcon :name="peranInfo[r.peran].icon" class="size-6 text-primary" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-highlighted">{{ peranInfo[r.peran].nama }}</p>
                    <p class="text-xs text-muted">{{ peranInfo[r.peran].deskripsi }}</p>
                  </div>
                </div>
                <UProgress :model-value="r.pct" />
                <p class="text-sm text-muted">
                  {{ r.done }} dari {{ r.total }} item selesai · <span class="font-semibold text-highlighted">{{ r.pct }}%</span>
                </p>
              </div>
            </UCard>
          </NuxtLink>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 font-semibold">
                  <UIcon name="i-lucide-alarm-clock" class="text-warning" />
                  <span>Tenggat penting</span>
                </div>
                <UButton
                  v-if="didukung"
                  size="xs"
                  :color="aktif ? 'primary' : 'neutral'"
                  :variant="aktif ? 'soft' : 'outline'"
                  :icon="aktif ? 'i-lucide-bell-ring' : 'i-lucide-bell'"
                  :label="aktif ? 'Aktif' : 'Ingatkan'"
                  class="sm:hidden"
                  @click="togglePengingat"
                />
              </div>
            </template>
            <ul class="divide-y divide-default text-sm">
              <li v-for="t in tenggat" :key="t.judul">
                <NuxtLink
                  :to="`/checklist/${t.peran}`"
                  class="flex items-start justify-between gap-3 py-2.5 transition hover:bg-elevated/50 rounded-md px-1 -mx-1"
                >
                  <div class="min-w-0">
                    <p class="text-default">{{ t.judul }}</p>
                    <p class="text-xs text-muted">{{ peranInfo[t.peran].nama }}</p>
                  </div>
                  <UBadge color="warning" variant="subtle" class="shrink-0">{{ t.tenggat }}</UBadge>
                </NuxtLink>
              </li>
            </ul>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-lucide-package" class="text-primary" />
                <span>Paket Dokumen Rapat RKAS & Ringkasan Sekolah</span>
              </div>
            </template>
            <div class="space-y-4">
              <p class="text-sm text-muted">
                Satu file Word berisi undangan untuk GTK dan komite, daftar hadir bertanda tangan, notulen dengan pertimbangan komite, berita acara, lembar pengesahan, dan halaman dokumentasi.
              </p>

              <div class="grid gap-2 rounded-lg border border-default bg-elevated/40 p-3 text-xs sm:grid-cols-2">
                <div>
                  <p class="text-muted">Sekolah aktif</p>
                  <p class="font-semibold text-highlighted">{{ profil.sekolah }}</p>
                  <p class="font-mono text-muted">NPSN {{ profil.npsn || '-' }}</p>
                </div>
                <div>
                  <p class="text-muted">Kepala sekolah & bendahara</p>
                  <p class="font-medium text-default">{{ profil.kepsek || '-' }}</p>
                  <p class="text-muted">Bendahara: {{ profil.bendahara || 'Belum diisi' }}</p>
                </div>
                <div v-if="profil.dapodik" class="sm:col-span-2 border-t border-default pt-2">
                  <p class="text-muted">
                    SPTJM Dapodik termuat: <strong class="text-highlighted">{{ profil.dapodik.gtkDetail.length }} GTK</strong>,
                    <strong class="text-highlighted">{{ profil.dapodik.rombel.length }} rombel</strong>,
                    <strong class="text-highlighted">{{ profil.dapodik.sarpras.length }} sarpras</strong>,
                    <strong class="text-highlighted">{{ profil.dapodik.pesertaDidik.length }} siswa</strong>.
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton to="/template/paket-rkas" icon="i-lucide-file-down" label="Buat paket RKAS" />
                <UButton to="/template" color="neutral" variant="outline" label="Semua template" />
                <UButton to="/profil" color="neutral" variant="ghost" icon="i-lucide-school" label="Lengkapi profil & SPTJM" />
              </div>
            </div>
          </UCard>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
