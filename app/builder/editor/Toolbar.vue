<script setup lang="ts">
import AoiButton from "~/components/aoi/AoiButton.vue"

defineProps<{
  componentsTo: string
  previewTo: string
  runtimeTo: string
  schemaVisible: boolean
  status?: string
}>()

const emit = defineEmits<{
  save: []
  "toggle-schema": []
}>()

const { t } = useI18n()
</script>

<template>
  <nav class="building-editor-toolbar" :aria-label="t('building.editor.toolbar.aria')">
    <AoiButton
      icon="save"
      size="sm"
      variant="tonal"
      @click="emit('save')"
    >
      {{ t("building.common.save") }}
    </AoiButton>

    <AoiButton
      icon="blocks"
      size="sm"
      :to="componentsTo"
      variant="outlined"
    >
      {{ t("building.common.components") }}
    </AoiButton>

    <AoiButton
      icon="eye"
      size="sm"
      :to="previewTo"
      variant="outlined"
    >
      {{ t("building.common.preview") }}
    </AoiButton>

    <AoiButton
      icon="play"
      size="sm"
      :to="runtimeTo"
      variant="outlined"
    >
      {{ t("building.common.runtime") }}
    </AoiButton>

    <AoiButton
      icon="braces"
      size="sm"
      :aria-pressed="schemaVisible"
      :variant="schemaVisible ? 'tonal' : 'outlined'"
      @click="emit('toggle-schema')"
    >
      {{ t("building.editor.toolbar.toggleSchema") }}
    </AoiButton>

    <span
      v-if="status"
      class="building-editor-toolbar__status"
      role="status"
    >
      {{ status }}
    </span>
  </nav>
</template>

<style scoped>
.building-editor-toolbar {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: end;
  gap: 8px;
}

.building-editor-toolbar__status {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .building-editor-toolbar {
    justify-content: start;
  }
}
</style>
