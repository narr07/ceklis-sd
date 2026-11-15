<script setup lang="ts">
import { faseInfo, kelompokUntuk, peranInfo, type Peran } from '~/data/checklists'
import { regulasi } from '~/data/regulasi'
import { templates } from '~/data/templates'

const route = useRoute()
const peran = computed(() => route.params.peran as Peran)
if (!peranInfo[peran.value]) throw createError({ statusCode: 404, statusMessage: 'Peran tidak ditemukan' })

const { periode } = usePeriode()
const { profil } = useProfil()
const { status, toggle, setNote, reset } = useProgress(peran)

const filter = ref<'semua' | 'belum' | 'selesai'>('semua')
const filterItems = [{ label: 'Semua', value: 'semua' }, { label: 'Belum', value: 'belum' }, { label: 'Selesai', value: 'selesai' }]
const terbuka = ref<Record<string, boolean>>({})
const resetModalOpen = ref(false)

const kelompok = computed(() => kelompokUntuk(peran.value, periode.value.semester))
const semua = computed(() => kelompok.value.flatMap(k => k.items))
const selesai = computed(() => semua.value.filter(i => status.value.done[i.id]).length)
const pct = computed(() => semua.value.length ? Math.round(selesai.value / semua.value.length * 100) : 0)

const tampil = (id: string) => filter.value === 'semua' || (filter.value === 'selesai') === !!status.value.done[id]
const kelompokTampil = computed(() =>
  kelompok.value
    .map(k => ({ ...k, visibleItems: k.items.filter(i => tampil(i.id)) }))
    .filter(k => k.visibleItems.length > 0),
)

const reg = (id?: string) => regulasi.find(r => r.id === id)
const tpl = (id?: string) => templates.find(t => t.id === id)

const cetak = () => window.print()
const toast = useToast()
function jalankanReset() {
  reset()
  resetModalOpen.value = false
  toast.add({ title: 'Progres periode ini direset', color: 'neutral' })
}
</script>

<template>
  <UDashboardPanel :id="`checklist-${peran}`" :key="peran">
    <template #header>
      <UDashboardNavbar :title="peranInfo[peran].nama" class="no-print" :ui="{ right: 'gap-2' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge color="primary" variant="subtle">
            {{ selesai }}/{{ semua.length }} ({{ pct }}%)
          </UBadge>
        </template>

        <template #right>
          <UButton icon="i-lucide-printer" color="neutral" variant="outline" size="sm" label="Ekspor PDF / Cetak" @click="cetak" />
          <UButton icon="i-lucide-rotate-ccw" color="error" variant="ghost" size="sm" label="Reset" @click="resetModalOpen = true" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="no-print overflow-x-auto">
        <template #left>
          <PeriodePicker compact />
        </template>
        <template #right>
          <UTabs v-model="filter" :items="filterItems" :content="false" size="xs" class="w-max" :ui="{ list: 'w-max', trigger: 'shrink-0' }" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <div class="hidden border-b border-black pb-3 text-sm print:block">
          <p class="font-bold">{{ profil.sekolah }} (NPSN {{ profil.npsn }})</p>
          <p>Checklist {{ peranInfo[peran].nama }} · Semester {{ periode.semester === 'ganjil' ? 'Ganjil' : 'Genap' }} {{ periode.ta }} · Progres: {{ selesai }}/{{ semua.length }} ({{ pct }}%)</p>
        </div>

        <UCard class="no-print">
          <div class="flex items-center gap-4">
            <UProgress :model-value="pct" class="flex-1" />
            <span class="w-28 text-right text-sm font-medium">{{ selesai }}/{{ semua.length }} · {{ pct }}%</span>
          </div>
        </UCard>

        <UEmpty
          v-if="!kelompokTampil.length"
          icon="i-lucide-list-filter"
          :title="filter === 'belum' ? 'Semua tugas pada periode ini sudah selesai' : 'Belum ada tugas yang selesai pada periode ini'"
          description="Ubah filter ke Semua untuk melihat seluruh daftar pekerjaan checklist."
          :actions="[{ label: 'Tampilkan Semua', color: 'primary', variant: 'outline', onClick: () => { filter = 'semua' } }]"
        />

        <section v-for="k in kelompokTampil" :key="k.id" class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-lg font-semibold">{{ k.judul }}</h2>
            <UBadge :color="faseInfo[k.fase].color as any" variant="subtle">{{ faseInfo[k.fase].label }}</UBadge>
            <span class="text-xs text-muted">{{ k.items.filter(i => status.done[i.id]).length }}/{{ k.items.length }}</span>
          </div>

          <div class="divide-y divide-default rounded-lg border border-default bg-default">
            <div
              v-for="i in k.visibleItems"
              :key="i.id"
              class="p-3 md:p-4"
              :class="status.done[i.id] ? 'bg-elevated/50' : ''"
            >
              <div class="flex items-start gap-3">
                <UCheckbox :model-value="!!status.done[i.id]" class="mt-0.5 print:hidden" :aria-label="i.judul" @update:model-value="v => toggle(i.id, !!v)" />
                <span class="hidden w-5 shrink-0 font-mono text-sm print:inline">{{ status.done[i.id] ? '[✓]' : '[ ]' }}</span>
                <div class="min-w-0 flex-1 space-y-1.5">
                  <p class="font-medium" :class="status.done[i.id] ? 'text-muted line-through' : ''">{{ i.judul }}</p>
                  <p v-if="i.detail" class="text-sm text-muted">{{ i.detail }}</p>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <UBadge v-if="i.aplikasi" color="neutral" variant="outline" size="sm" icon="i-lucide-app-window">{{ i.aplikasi }}</UBadge>
                    <UBadge v-if="i.tenggat" color="warning" variant="subtle" size="sm" icon="i-lucide-calendar-clock">{{ i.tenggat }}</UBadge>
                    <UTooltip v-if="reg(i.dasar)" :text="reg(i.dasar)!.nomor">
                      <UBadge color="info" variant="subtle" size="sm" icon="i-lucide-scale">{{ reg(i.dasar)!.nomor.split(';')[0] }}</UBadge>
                    </UTooltip>
                    <UButton v-if="tpl(i.template)" :to="`/template/${i.template}`" size="xs" variant="soft" icon="i-lucide-file-text" class="no-print">
                      {{ tpl(i.template)!.judul }}
                    </UButton>
                    <UButton size="xs" color="neutral" variant="ghost" class="no-print" :icon="status.notes[i.id] ? 'i-lucide-sticky-note' : 'i-lucide-message-square-plus'" @click="terbuka[i.id] = !terbuka[i.id]">
                      {{ status.notes[i.id] ? 'Catatan' : 'Tambah catatan' }}
                    </UButton>
                  </div>
                  <UTextarea v-if="terbuka[i.id]" :model-value="status.notes[i.id] || ''" :rows="2" autoresize placeholder="Catatan, nomor surat, kendala..." class="w-full" @update:model-value="v => setNote(i.id, String(v))" />
                  <p v-else-if="status.notes[i.id]" class="text-sm italic text-muted">
                    <UIcon name="i-lucide-sticky-note" class="mr-1 inline size-3.5 text-muted" />{{ status.notes[i.id] }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <UModal v-model:open="resetModalOpen" title="Reset progres periode ini?">
          <template #body>
            <p class="text-sm text-default">
              Semua centang dan catatan pada checklist <span class="font-semibold">{{ peranInfo[peran].nama }}</span> untuk Semester {{ periode.semester === 'ganjil' ? 'Ganjil' : 'Genap' }} {{ periode.ta }} akan dihapus.
            </p>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="outline" label="Batal" @click="resetModalOpen = false" />
              <UButton color="error" label="Reset Progres" @click="jalankanReset" />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
