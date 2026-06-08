<script setup lang="ts">
interface ListItem {
  [key: string]: unknown
}

const props = withDefaults(defineProps<{
  emptyText?: string
  items?: unknown[]
  subtitleField?: string
  titleField?: string
}>(), {
  emptyText: "No items",
  items: () => [],
  subtitleField: "email",
  titleField: "name"
})

function isRecord(value: unknown): value is ListItem {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function getFieldValue(item: unknown, key: string) {
  if (!isRecord(item)) {
    return ""
  }

  const value = item[key]

  if (value === undefined || value === null) {
    return ""
  }

  return String(value)
}
</script>

<template>
  <section class="low-code-list-block">
    <p
      v-if="!items.length"
      class="low-code-list-block__empty"
    >
      {{ emptyText }}
    </p>

    <ul v-else>
      <li
        v-for="(item, index) in items"
        :key="isRecord(item) && typeof item.id === 'string' ? item.id : index"
      >
        <strong>{{ getFieldValue(item, titleField) || `Item ${index + 1}` }}</strong>
        <span v-if="getFieldValue(item, subtitleField)">
          {{ getFieldValue(item, subtitleField) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.low-code-list-block {
  display: grid;
  min-width: 0;
  gap: var(--low-code-space-sm, 8px);
  color: var(--low-code-text, var(--aoi-text));
  font-family: var(--low-code-font-family, inherit);
}

.low-code-list-block ul {
  display: grid;
  min-width: 0;
  gap: var(--low-code-space-sm, 8px);
  list-style: none;
  margin: 0;
  padding: 0;
}

.low-code-list-block li {
  display: grid;
  min-width: 0;
  gap: var(--low-code-space-xs, 3px);
  border: 1px solid var(--low-code-border, var(--aoi-border));
  border-radius: var(--low-code-radius-md, var(--aoi-radius-control));
  background: var(--low-code-surface, var(--aoi-card-bg));
  padding: var(--low-code-space-sm, 10px);
}

.low-code-list-block strong,
.low-code-list-block span,
.low-code-list-block__empty {
  min-width: 0;
  overflow-wrap: anywhere;
}

.low-code-list-block strong {
  color: var(--low-code-text, var(--aoi-text));
  font-size: var(--low-code-font-size, 14px);
}

.low-code-list-block span,
.low-code-list-block__empty {
  color: var(--low-code-muted-text, var(--aoi-text-muted));
  font-size: 12px;
  line-height: var(--low-code-line-height, 1.5);
}

.low-code-list-block__empty {
  margin: 0;
}
</style>
