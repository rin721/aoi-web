<script setup lang="ts">
import AoiSchemaRenderer from "~/components/lowcode/AoiSchemaRenderer"
import { settingsAcknowledgementSchema } from "~/lowcode/schemas/settingsAcknowledgement"
</script>

<template>
  <AoiSchemaRenderer :node="settingsAcknowledgementSchema.root" />
</template>

<style scoped>
:deep(.settings-link-list) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

:deep(.settings-link-card) {
  display: grid;
  min-height: 104px;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-content: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-md);
  background: var(--aoi-card-bg);
  padding: 14px;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

:deep(.settings-link-card:hover) {
  background: var(--aoi-state-hover);
  color: var(--aoi-accent-60);
}

:deep(.settings-link-card:active) {
  transform: scale(.98);
}

:deep(.settings-link-card strong) {
  font-weight: 840;
}

:deep(.settings-link-card span) {
  grid-column: 1 / -1;
  color: var(--aoi-text-muted);
  line-height: 1.55;
}
</style>
