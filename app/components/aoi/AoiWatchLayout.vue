<template>
  <div class="aoi-watch-layout">
    <div class="aoi-watch-layout__primary">
      <slot name="primary" />
    </div>
    <aside class="aoi-watch-layout__side">
      <slot name="side" />
    </aside>
    <div v-if="$slots.below" class="aoi-watch-layout__below">
      <slot name="below" />
    </div>
  </div>
</template>

<style scoped>
.aoi-watch-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 382px);
  gap: 16px;
  align-items: start;
}

.aoi-watch-layout:has(.aoi-video-player--theater) {
  grid-template-columns: minmax(0, 1fr) minmax(292px, 328px);
}

.aoi-watch-layout__primary,
.aoi-watch-layout__side,
.aoi-watch-layout__below {
  min-width: 0;
}

.aoi-watch-layout__side {
  display: grid;
  gap: 10px;
  min-height: 0;
}

.aoi-watch-layout__below {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .aoi-watch-layout {
    grid-template-columns: 1fr;
  }

  .aoi-watch-layout:has(.aoi-video-player--theater) {
    grid-template-columns: 1fr;
  }
}
</style>
