<script setup lang="ts">
import { kopLines } from '~/utils/profil'

const props = withDefaults(defineProps<{ preview?: boolean, compact?: boolean }>(), { preview: false, compact: false })
const { profil } = useProfil()
const toast = useToast()

const kop = computed(() => kopLines(profil.value))
const defaultPlaceholder = computed(() => kopLines({ ...profil.value, kopAlamat: '', kopKontak: '' }))

function unggahLogo(e: Event, key: 'logoKiri' | 'logoKanan') {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (f.size > 400_000) return toast.add({ title: 'Logo terlalu besar', description: 'Maksimal 400 KB (PNG/JPG).', color: 'error' })
  const r = new FileReader()
  r.onload = () => { profil.value[key] = String(r.result) }
  r.readAsDataURL(f)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="props.preview" class="paper rounded-md border border-default px-4 py-3">
      <div class="border-b-[3px] border-double border-black pb-2">
        <div class="flex items-center gap-3">
          <div v-if="profil.logoKiri" class="w-[14%] shrink-0">
            <img :src="profil.logoKiri" alt="Logo dinas / pemda" class="mx-auto h-14 w-14 object-contain">
          </div>
          <div class="flex-1 text-center leading-tight">
            <p v-if="kop.pemda" class="text-[12pt] font-bold">{{ kop.pemda }}</p>
            <p v-if="kop.dinas" class="text-[12pt] font-bold">{{ kop.dinas }}</p>
            <p v-if="kop.sekolah" class="text-[14pt] font-bold">{{ kop.sekolah }}</p>
            <p v-if="kop.alamat" class="text-[9pt] italic">{{ kop.alamat }}</p>
            <p v-if="kop.kontak" class="text-[9pt] italic">{{ kop.kontak }}</p>
          </div>
          <div v-if="profil.logoKanan" class="w-[14%] shrink-0">
            <img :src="profil.logoKanan" alt="Logo sekolah" class="mx-auto h-14 w-14 object-contain">
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-3" :class="props.compact ? 'grid-cols-1' : 'sm:grid-cols-2'">
      <UFormField label="Pemerintah daerah (baris 1)">
        <UInput v-model="profil.pemda" class="w-full" />
      </UFormField>
      <UFormField label="Dinas (baris 2)">
        <UInput v-model="profil.dinas" class="w-full" />
      </UFormField>
      <UFormField label="Nama sekolah (baris 3)" :class="props.compact ? '' : 'sm:col-span-2'">
        <UInput v-model="profil.sekolah" class="w-full" />
      </UFormField>
      <UFormField label="Baris alamat kop (opsional, isi manual)" :class="props.compact ? '' : 'sm:col-span-2'" help="Kosongkan untuk memakai alamat otomatis dari profil sekolah.">
        <UInput v-model="profil.kopAlamat" :placeholder="defaultPlaceholder.alamat" class="w-full" />
      </UFormField>
      <UFormField label="Baris kontak / NPSN kop (opsional, isi manual)" :class="props.compact ? '' : 'sm:col-span-2'" help="Kosongkan untuk memakai NPSN, e-mail, dan website dari profil sekolah.">
        <UInput v-model="profil.kopKontak" :placeholder="defaultPlaceholder.kontak" class="w-full" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div v-for="[k, label, hint] in ([['logoKiri', 'Logo Dinas / Pemda', 'Tampil di kiri kop'], ['logoKanan', 'Logo Sekolah', 'Opsional; jika kosong hanya logo dinas']] as const)" :key="k" class="space-y-1.5 text-center">
        <div class="flex h-20 items-center justify-center rounded-lg border border-dashed border-default bg-elevated/30">
          <img v-if="profil[k]" :src="profil[k]" class="h-16 object-contain" :alt="label">
          <UIcon v-else name="i-lucide-image" class="size-7 text-dimmed" />
        </div>
        <label class="block">
          <input type="file" accept="image/png,image/jpeg" class="hidden" @change="unggahLogo($event, k)">
          <UButton as="span" size="xs" variant="soft" :label="label" icon="i-lucide-image-up" />
        </label>
        <p class="text-[11px] text-muted">{{ hint }}</p>
        <UButton v-if="profil[k]" size="xs" color="error" variant="link" label="Hapus" @click="profil[k] = undefined" />
      </div>
    </div>
  </div>
</template>
