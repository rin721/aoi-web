<script setup lang="ts">
defineProps<{
  description?: string
  title: string
}>()
</script>

<template>
  <section class="builder-shell" aria-label="Builder workspace">
    <header class="builder-shell__header">
      <div class="builder-shell__title">
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>

      <div class="builder-shell__toolbar" aria-label="Builder toolbar">
        <slot name="toolbar" />
      </div>
    </header>

    <div class="builder-shell__body">
      <aside class="builder-shell__resources" aria-label="Builder resources">
        <slot name="resources" />
      </aside>

      <main class="builder-shell__canvas" aria-label="Builder canvas">
        <slot name="canvas" />
      </main>

      <aside class="builder-shell__inspector" aria-label="Builder inspector">
        <slot name="inspector" />
      </aside>
    </div>

    <footer class="builder-shell__footer" aria-label="Builder output">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.builder-shell {
  display: grid;
  min-width: 0;
  gap: var(--aoi-grid-gap);
}

.builder-shell__header {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
}

.builder-shell__title {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.builder-shell__title h1,
.builder-shell__title p {
  margin: 0;
}

.builder-shell__title h1 {
  color: var(--aoi-text);
  font-size: 34px;
  line-height: 1.08;
}

.builder-shell__title p {
  max-width: 720px;
  color: var(--aoi-text-muted);
  line-height: 1.6;
}

.builder-shell__toolbar {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: end;
  gap: 8px;
}

.builder-shell__body {
  display: grid;
  min-width: 0;
  grid-template-columns:
    minmax(240px, 300px)
    minmax(0, 1fr)
    minmax(280px, 360px);
  gap: var(--aoi-grid-gap);
  align-items: start;
}

.builder-shell__resources,
.builder-shell__canvas,
.builder-shell__inspector,
.builder-shell__footer {
  display: grid;
  min-width: 0;
  gap: var(--aoi-grid-gap);
}

.builder-shell__resources,
.builder-shell__inspector {
  position: sticky;
  top: calc(var(--aoi-page-padding) + 12px);
  align-self: start;
  max-height: calc(100vh - var(--aoi-page-padding) * 2 - 24px);
  overflow: auto;
  scrollbar-width: thin;
}

@media (max-width: 1180px) {
  .builder-shell__body {
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  }

  .builder-shell__inspector {
    position: static;
    max-height: none;
    grid-column: 1 / -1;
    overflow: visible;
  }
}

@media (max-width: 760px) {
  .builder-shell__header {
    grid-template-columns: minmax(0, 1fr);
  }

  .builder-shell__title h1 {
    font-size: 28px;
  }

  .builder-shell__toolbar {
    justify-content: start;
  }

  .builder-shell__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .builder-shell__resources {
    position: static;
    max-height: none;
    overflow: visible;
  }
}
</style>
