<script setup lang="ts">
import { cariDokumen, nilaiAwal, type Values } from '~/data/templates'
import { buildDocx } from '~/utils/docx'

const route = useRoute()
const id = route.params.id as string
const found = cariDokumen(id)
if (!found) throw createError({ statusCode: 404, statusMessage: 'Template tidak ditemukan' })
const dok = found

const { profil } = useProfil()
const storeKey = `ceklis:isian:${id}`
const awal = () => nilaiAwal(dok.fields, profil.value)
const nilai = ref<Values>(awal())
let siapSimpan = false

onMounted(() => {
  try {
    const raw = localStorage.getItem(storeKey)
    if (raw) nilai.value = { ...nilai.value, ...JSON.parse(raw) }
  }
  catch { /* abaikan */ }
  nextTick(() => {
    siapSimpan = true
  })
})

watch(nilai, (v) => {
  if (!siapSimpan || !import.meta.client) return
  simpanLokal(storeKey, v)
  tandaiPerubahanDb()
}, { deep: true })

const blocks = computed(() => dok.build(profil.value, nilai.value))
const toast = useToast()
const loading = ref(false)
const editKop = ref(false)
const mobileView = ref<'form' | 'preview'>('form')
const resetModalOpen = ref(false)

const mobileTabs = [
  { label: 'Isian Dokumen', value: 'form', icon: 'i-lucide-file-pen' },
  { label: 'Pratinjau Kertas', value: 'preview', icon: 'i-lucide-eye' },
]

async function unduh() {
  loading.value = true
  try {
    const blob = await buildDocx(blocks.value, profil.value)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${dok.judul.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.docx`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast.add({ title: 'Dokumen diunduh', description: 'Buka di Word/LibreOffice untuk disunting.', color: 'success', icon: 'i-lucide-check' })
  }
  catch (e) {
    toast.add({ title: 'Gagal membuat dokumen', description: String(e), color: 'error' })
  }
  finally { loading.value = false }
}

function jalankanKembalikan() {
  nilai.value = awal()
  resetModalOpen.value = false
  toast.add({ title: 'Isian dikembalikan ke nilai bawaan', color: 'neutral' })
}
</script>

<template>
  <UDashboardPanel
    id="template-form"
    :default-size="25"
    :min-size="20"
    :max-size="32"
    resizable
    :class="mobileView === 'preview' ? 'hidden lg:flex' : 'flex'"
  >
    <template #header>
      <UDashboardNavbar :title="dok.judul" :ui="{ right: 'gap-1.5' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton to="/template" color="neutral" variant="ghost" size="sm" icon="i-lucide-arrow-left" aria-label="Kembali ke daftar template" />
        </template>

        <template #right>
          <UButton
            size="xs"
            :color="editKop ? 'primary' : 'neutral'"
            :variant="editKop ? 'soft' : 'outline'"
            icon="i-lucide-stamp"
            :label="editKop ? 'Tutup kop' : 'Kop surat'"
            @click="editKop = !editKop"
          />
          <UTooltip text="Kembalikan nilai bawaan">
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-rotate-ccw"
              aria-label="Nilai bawaan"
              @click="resetModalOpen = true"
            />
          </UTooltip>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="lg:hidden">
        <UTabs v-model="mobileView" :items="mobileTabs" :content="false" size="xs" class="w-full" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">{{ dok.deskripsi }}</p>

        <UAlert
          v-if="!profil.bendahara || !profil.komite"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="Profil belum lengkap"
          :description="`Nama ${!profil.bendahara ? 'bendahara' : ''}${!profil.bendahara && !profil.komite ? ' dan ' : ''}${!profil.komite ? 'ketua komite' : ''} masih kosong, sehingga akan tercetak titik-titik.`"
          :actions="[{ label: 'Lengkapi profil', to: '/profil', color: 'warning', variant: 'outline' }]"
        />

        <div v-if="editKop" class="rounded-lg border border-default bg-elevated/40 p-3">
          <KopSuratEditor compact />
        </div>

        <UFormField v-for="f in dok.fields" :key="f.key" :label="f.label" :help="f.hint">
          <UTextarea v-if="f.type === 'textarea'" v-model="nilai[f.key]" :rows="4" autoresize class="w-full" />
          <UInput v-else v-model="nilai[f.key]" :type="f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'" class="w-full" />
        </UFormField>

        <p class="text-xs text-muted">
          Kolom bertanda "|" dipisah per baris, misalnya <code>Nama|Jumlah</code>.
        </p>

        <UModal v-model:open="resetModalOpen" title="Kembalikan nilai bawaan?">
          <template #body>
            <p class="text-sm text-default">
              Semua kolom isian untuk <span class="font-semibold">{{ dok.judul }}</span> akan dikembalikan ke nilai bawaan dari profil sekolah.
            </p>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="outline" label="Batal" @click="resetModalOpen = false" />
              <UButton color="error" label="Kembalikan" @click="jalankanKembalikan" />
            </div>
          </template>
        </UModal>
      </div>
    </template>

    <template #footer>
      <div class="border-t border-default p-3">
        <UButton block icon="i-lucide-file-down" :loading="loading" label="Unduh Dokumen (.docx)" @click="unduh" />
      </div>
    </template>
  </UDashboardPanel>

  <UDashboardPanel
    id="template-preview"
    class="flex-1"
    :class="mobileView === 'form' ? 'hidden lg:flex' : 'flex'"
  >
    <template #header>
      <UDashboardNavbar title="Pratinjau Naskah Dinas (A4)" :toggle="false" :ui="{ right: 'gap-2' }">
        <template #trailing>
          <UBadge color="neutral" variant="subtle" class="hidden sm:inline-flex">
            Times New Roman 12pt
          </UBadge>
        </template>

        <template #right>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-file-pen"
            label="Isian"
            class="lg:hidden"
            @click="mobileView = 'form'"
          />
          <UButton size="sm" icon="i-lucide-file-down" :loading="loading" label="Unduh .docx" @click="unduh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="min-w-0 overflow-x-auto rounded-lg bg-elevated p-3 md:p-6">
        <DocPreview :blocks="blocks" :profil="profil" />
      </div>
    </template>
  </UDashboardPanel>
</template>
