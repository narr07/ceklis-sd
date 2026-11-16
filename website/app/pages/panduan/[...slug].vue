<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'

definePageMeta({ layout: 'docs' })

const route = useRoute()
const routePath = computed(() => withoutTrailingSlash(route.path))

const { data: page } = await useAsyncData(routePath.value, () => queryCollection('docs').path(routePath.value).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Halaman panduan tidak ditemukan', fatal: true })
}

const { data: surround } = await useAsyncData(`${routePath.value}-surround`, () =>
  queryCollectionItemSurroundings('docs', routePath.value, { fields: ['description'] })
)

useSeoMeta({
  title: page.value.title,
  ogTitle: `${page.value.title} · Panduan Ceklis SD`,
  description: page.value.description,
  ogDescription: page.value.description
})
</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      :title="page.title"
      :description="page.description"
      headline="Panduan"
    />

    <UPageBody>
      <ContentRenderer
        v-if="page.body"
        :value="page"
      />
      <USeparator v-if="surround?.length" />
      <UContentSurround :surround="surround" />
    </UPageBody>

    <template
      v-if="page?.body?.toc?.links?.length"
      #right
    >
      <UContentToc
        :links="page.body.toc.links"
        title="Di halaman ini"
      />
    </template>
  </UPage>
</template>
