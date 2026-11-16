<script setup lang="ts">
// Wadah dokumen untuk Cetak / Simpan PDF. Tersembunyi di layar; saat mode cetak aktif,
// hanya wadah ini yang dicetak (lihat aturan #area-cetak di main.css).
const { isi } = useCetakDokumen()
const { profil } = useProfil()
</script>

<template>
  <Teleport to="body">
    <div id="area-cetak" aria-hidden="true">
      <DocPreview v-if="isi" :blocks="isi.blocks" :profil="profil" />
    </div>
  </Teleport>
</template>
