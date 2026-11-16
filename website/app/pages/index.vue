<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('index').first())

useSeoMeta({
  title: '',
  ogTitle: 'Ceklis SD: Checklist & template administrasi SD',
  description: page.value?.description,
  ogDescription: page.value?.description
})
</script>

<template>
  <div v-if="page">
    <UPageHero
      :headline="page.hero.headline"
      :description="page.description"
      :links="page.hero.links"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        <MDC
          :value="page.title"
          unwrap="p"
        />
      </template>

      <!-- Tangkapan layar aplikasi (aset gambar statis). -->
      <img
        v-if="page.hero.image"
        :src="page.hero.image.src"
        :alt="page.hero.image.alt"
        class="w-full rounded-lg shadow-2xl ring ring-default"
        loading="eager"
      >
    </UPageHero>

    <UPageSection
      v-for="section in page.sections"
      :id="section.id"
      :key="section.id"
      :headline="section.headline"
      :title="section.title"
      :description="section.description"
      :orientation="section.orientation"
      :reverse="section.reverse"
      :features="section.features"
    >
      <img
        v-if="section.image"
        :src="section.image.src"
        :alt="section.image.alt"
        class="w-full rounded-lg shadow-xl ring ring-default"
        loading="lazy"
      >
    </UPageSection>

    <UPageSection
      :title="page.features.title"
      :description="page.features.description"
    >
      <UPageGrid>
        <UPageCard
          v-for="(item, i) in page.features.items"
          :key="i"
          v-bind="item"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      :title="page.langkah.title"
      :description="page.langkah.description"
    >
      <UPageGrid class="lg:grid-cols-3">
        <UPageCard
          v-for="(item, i) in page.langkah.items"
          :key="i"
          :icon="item.icon"
          :title="`${i + 1}. ${item.title}`"
          :description="item.description"
          variant="subtle"
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="unduh"
      :title="page.unduh.title"
      :description="page.unduh.description"
    >
      <DownloadCard />
    </UPageSection>

    <UPageSection
      :title="page.faq.title"
      :description="page.faq.description"
    >
      <UAccordion
        :items="page.faq.items"
        type="multiple"
        class="mx-auto w-full max-w-3xl"
        :ui="{ trigger: 'text-base', body: 'text-muted' }"
      />
    </UPageSection>

    <USeparator />

    <UPageCTA
      v-bind="page.cta"
      variant="naked"
    />
  </div>
</template>
