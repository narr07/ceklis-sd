<script setup lang="ts">
import type { Block, Sign } from '~/utils/blocks'
import { alignKolom, lebarKolom, parseBold, signColumns } from '~/utils/blocks'
import { kopLines, type Profil } from '~/utils/profil'

const props = defineProps<{ blocks: Block[], profil: Profil }>()
const kop = computed(() => kopLines(props.profil))

/** pecah menjadi halaman per {t:'break'} */
const pages = computed(() => {
  const out: Block[][] = [[]]
  for (const b of props.blocks) {
    if (b.t === 'break') out.push([])
    else out[out.length - 1]!.push(b)
  }
  return out
})
const lines = (s: string) => s.split('\n')
const mark = (style: string | undefined, i: number) => style === 'alpha' ? `${String.fromCharCode(97 + i)}.` : style === 'bullet' ? '•' : `${i + 1}.`
const signCols = (b: Extract<Block, { t: 'sign' }>): (Sign | undefined)[] => signColumns(b)
</script>

<template>
  <div class="space-y-6">
    <div v-for="(page, pi) in pages" :key="pi" class="paper mx-auto w-full max-w-[210mm] rounded-sm px-[9%] py-[7%] shadow-lg ring-1 ring-black/5">
      <template v-for="(b, bi) in page" :key="bi">
        <!-- KOP -->
        <div v-if="b.t === 'kop'" class="mb-4 border-b-[3px] border-double border-black pb-2">
          <div class="flex items-center gap-3">
            <div v-if="profil.logoKiri" class="w-[14%] shrink-0">
              <img :src="profil.logoKiri" alt="Logo dinas / pemda" class="mx-auto h-16 w-16 object-contain">
            </div>
            <div class="flex-1 text-center leading-tight">
              <p v-if="kop.pemda" class="text-[14pt] font-bold">{{ kop.pemda }}</p>
              <p v-if="kop.dinas" class="text-[14pt] font-bold">{{ kop.dinas }}</p>
              <p v-if="kop.sekolah" class="text-[16pt] font-bold">{{ kop.sekolah }}</p>
              <p v-if="kop.alamat" class="text-[10pt] italic">{{ kop.alamat }}</p>
              <p v-if="kop.kontak" class="text-[10pt] italic">{{ kop.kontak }}</p>
            </div>
            <div v-if="profil.logoKanan" class="w-[14%] shrink-0">
              <img :src="profil.logoKanan" alt="Logo sekolah" class="mx-auto h-16 w-16 object-contain">
            </div>
          </div>
        </div>

        <div v-else-if="b.t === 'title'" class="mb-3 text-center font-bold">
          <p class="text-[13pt]" :class="!b.sub ? 'underline' : ''">{{ b.text }}</p>
          <p v-for="(l, li) in lines(b.sub || '')" :key="li">{{ l }}</p>
        </div>

        <div v-else-if="b.t === 'p'" class="mb-2" :class="{ 'font-bold': b.bold, 'italic': b.italic }" :style="{ textAlign: b.align || 'left' }">
          <p v-for="(l, li) in lines(b.text)" :key="li" :class="b.indent ? 'indent-10' : ''">
            <template v-for="(s, si) in parseBold(l)" :key="si"><b v-if="s.bold">{{ s.text }}</b><template v-else>{{ s.text }}</template></template>
          </p>
        </div>

        <div v-else-if="b.t === 'space'" :style="{ height: `${(b.n || 1) * 1.2}em` }" />

        <ol v-else-if="b.t === 'list'" class="mb-3 space-y-1 pl-6 text-justify">
          <li v-for="(it, i) in b.items" :key="i" class="flex gap-2">
            <span class="w-5 shrink-0">{{ mark(b.style, i) }}</span>
            <span><template v-for="(s, si) in parseBold(it)" :key="si"><b v-if="s.bold">{{ s.text }}</b><template v-else>{{ s.text }}</template></template></span>
          </li>
        </ol>

        <table v-else-if="b.t === 'meta'" class="mb-3 w-full table-fixed">
          <tbody>
            <tr v-for="([k, v], ri) in b.rows" :key="ri" class="align-top" :class="b.bold?.includes(ri) ? 'font-bold' : ''">
              <td class="w-[24%] py-0.5">{{ k }}</td>
              <td class="w-[3%] text-center">:</td>
              <td class="text-justify">
                <p v-for="(l, li) in lines(v)" :key="li">
                  <template v-for="(s, si) in parseBold(l)" :key="si"><b v-if="s.bold">{{ s.text }}</b><template v-else>{{ s.text }}</template></template>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Kelas `doc-table`, bukan `grid`: kelas `grid` milik Tailwind mengubah tabel menjadi display:grid. -->
        <table v-else-if="b.t === 'table'" class="doc-table mb-4 text-[11pt]">
          <colgroup>
            <col v-for="(w, wi) in lebarKolom(b)" :key="wi" :style="{ width: `${w}%` }">
          </colgroup>
          <thead>
            <tr><th v-for="(h, hi) in b.head" :key="hi">{{ h }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, ri) in b.rows" :key="ri" :class="b.tall ? 'tall' : ''">
              <td v-for="(c, ci) in r" :key="ci" :style="{ textAlign: alignKolom(b)[ci] }">
                <p v-for="(l, li) in lines(c)" :key="li">
                  <template v-for="(s, si) in parseBold(l)" :key="si"><b v-if="s.bold">{{ s.text }}</b><template v-else>{{ s.text }}</template></template>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else-if="b.t === 'sign'" class="mt-4 mb-2 flex break-inside-avoid">
          <div v-for="(s, si) in signCols(b)" :key="si" class="flex-1 text-center">
            <template v-if="s">
              <p v-for="(l, li) in lines(s.atas || '')" :key="'a' + li">{{ l || '\u00A0' }}</p>
              <p v-for="(l, li) in lines(s.jabatan)" :key="'j' + li">{{ l }}</p>
              <div class="flex h-20 items-center justify-center">
                <span v-if="s.meterai" class="rounded border border-dashed border-gray-400 px-2 py-1 text-[8pt] italic text-gray-500">Meterai Rp10.000</span>
              </div>
              <p class="font-bold underline">{{ s.nama }}</p>
              <p v-if="s.nip">NIP. {{ s.nip }}</p>
            </template>
          </div>
        </div>

        <div v-else-if="b.t === 'photos'" class="mb-4 grid grid-cols-2 gap-3">
          <div v-for="n in b.n" :key="n" class="text-center text-[10pt]">
            <div class="flex aspect-[4/3] items-center justify-center border border-gray-500 italic text-gray-500">[ Tempel foto di sini ]</div>
            <p>{{ b.captions?.[n - 1] ?? `Foto ${n}` }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
