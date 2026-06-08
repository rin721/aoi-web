<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  icon?: string
  selected?: boolean
  removable?: boolean
  removeLabel?: string
  disabled?: boolean
}>(), {
  disabled: false,
  icon: undefined,
  removable: false,
  removeLabel: undefined,
  selected: false
})

const emit = defineEmits<{
  remove: []
}>()

function remove() {
  if (!props.disabled) {
    emit("remove")
  }
}
</script>

<template>
  <span
    class="aoi-chip"
    :class="{ 'aoi-chip--selected': selected, 'aoi-chip--disabled': disabled }"
  >
    <AoiIcon v-if="icon" :name="icon" :size="14" decorative />
    <span class="aoi-chip__label">{{ label }}</span>
    <button
      v-if="removable"
      class="aoi-chip__remove"
      type="button"
      :aria-label="removeLabel || label"
      :disabled="disabled || undefined"
      @click="remove"
    >
      <AoiIcon name="x" :size="14" decorative />
    </button>
  </span>
</template>

<style scoped>
.aoi-chip {
  display: inline-flex;
  min-height: 30px;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-sm);
  background: var(--aoi-surface-solid);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 7px 4px 9px;
}

.aoi-chip--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.aoi-chip--disabled {
  opacity: .58;
}

.aoi-chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aoi-chip__remove {
  display: inline-grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border: 0;
  border-radius: var(--aoi-radius-xs);
  background: transparent;
  color: currentColor;
  cursor: pointer;
  padding: 0;
}

.aoi-chip__remove:hover {
  background: var(--aoi-accent-10);
}

.aoi-chip__remove:disabled {
  cursor: not-allowed;
}
</style>
