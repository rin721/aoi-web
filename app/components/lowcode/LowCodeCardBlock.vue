<script setup lang="ts">
defineProps<{
  description?: string
  title?: string
}>()
</script>

<template>
  <article class="low-code-card-block">
    <header
      v-if="title || description"
      class="low-code-card-block__header"
    >
      <h3 v-if="title">
        {{ title }}
      </h3>
      <p v-if="description">
        {{ description }}
      </p>
    </header>

    <div class="low-code-card-block__body">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.low-code-card-block {
  display: grid;
  min-width: 0;
  gap: var(--low-code-space-md, 12px);
  border: 1px solid var(--low-code-border, var(--aoi-border));
  border-radius: var(--low-code-radius-lg, var(--aoi-radius-card));
  background: var(--low-code-surface, var(--aoi-card-bg));
  box-shadow: var(--low-code-shadow-card, none);
  color: var(--low-code-text, var(--aoi-text));
  font-family: var(--low-code-font-family, inherit);
  padding: var(--low-code-space-md, 16px);
}

.low-code-card-block__header,
.low-code-card-block__body {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.low-code-card-block__header h3,
.low-code-card-block__header p {
  margin: 0;
}

.low-code-card-block__header h3 {
  color: var(--low-code-text, var(--aoi-text));
  font-size: var(--low-code-heading-size, 16px);
  line-height: var(--low-code-line-height, 1.3);
}

.low-code-card-block__header p {
  color: var(--low-code-muted-text, var(--aoi-text-muted));
  font-size: 13px;
  line-height: var(--low-code-line-height, 1.55);
}
</style>
