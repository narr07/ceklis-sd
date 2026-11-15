<script setup lang="ts">
import { URL_SP_DATADIK, profilMasihContoh } from '~/utils/profil'

/*
 * Panduan saat aplikasi pertama kali dipakai: data sekolah diambil dari PDF SPTJM yang diunduh
 * operator dari SP Datadik, bukan diketik ulang. Muncul selama profil masih contoh dan belum ditutup.
 */
const KUNCI = 'ceklis:sambutan'

const { profil } = useProfil()
const { bukaSpDatadik } = useDesktopBackend()
const { memproses, imporFileSptjm } = useSptjmImport()
const siap = useState<boolean>('storage-siap', () => false)
const toast = useToast()

const ditutup = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  try { ditutup.value = localStorage.getItem(KUNCI) === 'selesai' }
  catch { ditutup.value = false }
})

const terbuka = computed({
  get: () => siap.value && !ditutup.value && profilMasihContoh(profil.value),
  set: (v: boolean) => { if (!v) tutup() },
})

function tutup() {
  ditutup.value = true
  try { localStorage.setItem(KUNCI, 'selesai') }
  catch { /* abaikan */ }
}

async function bukaSitus() {
  try {
    await bukaSpDatadik()
  }
  catch (e) {
    toast.add({ title: 'Gagal membuka SP Datadik', description: `${String(e)}. Buka manual: ${URL_SP_DATADIK}`, color: 'warning' })
  }
}

async function onPilihPdf(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (await imporFileSptjm(file)) {
    tutup()
    await navigateTo('/profil')
  }
}

const langkah = [
  { icon: 'i-lucide-refresh-cw', judul: 'Sinkronkan Dapodik', isi: 'Pastikan aplikasi Dapodik sekolah sudah sinkron dengan data terbaru.' },
  { icon: 'i-lucide-log-in', judul: 'Masuk ke SP Datadik', isi: 'Login dengan akun operator sekolah.' },
  { icon: 'i-lucide-file-down', judul: 'Unduh SPTJM (PDF)', isi: 'Unduh file PDF SPTJM sekolah Anda dan simpan di laptop.' },
  { icon: 'i-lucide-file-up', judul: 'Impor di Ceklis SD', isi: 'Pilih file PDF tersebut. Profil, kop, GTK, rombel, sarpras, dan siswa terisi otomatis.' },
]
</script>

<template>
  <UModal
    v-model:open="terbuka"
    title="Selamat datang di Ceklis SD"
    description="Isi data sekolah Anda dari SPTJM Dapodik, tanpa mengetik ulang."
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <ol class="space-y-3">
          <li v-for="(l, i) in langkah" :key="i" class="flex gap-3">
            <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UIcon :name="l.icon" class="size-4" />
            </div>
            <div>
              <p class="text-sm font-semibold text-highlighted">{{ i + 1 }}. {{ l.judul }}</p>
              <p class="text-sm text-muted">{{ l.isi }}</p>
            </div>
          </li>
        </ol>

        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-shield-check"
          description="File SPTJM dibaca langsung di perangkat ini dan tidak dikirim ke mana pun. Selama data sekolah belum diisi, aplikasi memakai profil contoh berisi nama placeholder."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <UButton color="neutral" variant="ghost" label="Isi manual nanti" @click="tutup" />
        <div class="flex flex-wrap gap-2">
          <UButton color="neutral" variant="outline" icon="i-lucide-external-link" label="Buka SP Datadik" @click="bukaSitus" />
          <!-- Input file native tersembunyi dipicu UButton: Nuxt UI tidak punya pemilih file yang memberi akses byte PDF. -->
          <input ref="fileInput" type="file" accept="application/pdf,.pdf" class="hidden" @change="onPilihPdf">
          <UButton icon="i-lucide-file-up" label="Pilih File SPTJM (PDF)" :loading="memproses" @click="fileInput?.click()" />
        </div>
      </div>
    </template>
  </UModal>
</template>
