<script setup lang="ts">
import { computed } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import type { ComponentNode, LowCodePage } from "~/types/lowcode"

interface NodeTreeItem {
  childCount: number
  depth: number
  id: string
  isRoot: boolean
  label: string
  node: ComponentNode
  type: string
}

const props = defineProps<{
  pageSchema?: LowCodePage | null
  selectedNodeId?: string | null
}>()

const { t } = useI18n()

const emit = defineEmits<{
  "delete-node": [id: string]
  "duplicate-node": [id: string]
  "move-node-down": [id: string]
  "move-node-up": [id: string]
  "select-node": [id: string]
}>()

const nodes = computed(() =>
  props.pageSchema ? flattenNodes(props.pageSchema.layout) : []
)

function flattenNodes(node: ComponentNode, depth = 0, isRoot = true): NodeTreeItem[] {
  const children = getChildNodes(node)

  return [
    {
      childCount: children.length,
      depth,
      id: node.id,
      isRoot,
      label: getNodeLabel(node),
      node,
      type: node.type
    },
    ...children.flatMap((child) => flattenNodes(child, depth + 1, false))
  ]
}

function getChildNodes(node: ComponentNode) {
  return [
    ...(node.children || []),
    ...Object.values(node.slots || {}).flat()
  ]
}

function getNodeLabel(node: ComponentNode) {
  const props = node.props || {}

  if (typeof props.label === "string" && props.label.trim()) {
    return props.label
  }

  if (typeof props.title === "string" && props.title.trim()) {
    return props.title
  }

  if (typeof props.text === "string" && props.text.trim()) {
    return props.text.length > 28 ? `${props.text.slice(0, 28)}...` : props.text
  }

  return node.type
}
</script>

<template>
  <section class="building-editor-node-tree-panel" :aria-label="t('building.panels.nodeTree.aria')">
    <header class="building-editor-node-tree-panel__header">
      <div>
        <h2>{{ t("building.panels.nodeTree.title") }}</h2>
        <p>{{ t("building.panels.nodeTree.description") }}</p>
      </div>
      <strong>{{ nodes.length }}</strong>
    </header>

    <div
      v-if="!nodes.length"
      class="building-editor-node-tree-panel__empty"
    >
      <strong>{{ t("building.panels.nodeTree.emptyTitle") }}</strong>
      <p>{{ t("building.panels.nodeTree.emptyDescription") }}</p>
    </div>

    <div
      v-else
      class="building-editor-node-tree"
    >
      <article
        v-for="item in nodes"
        :key="item.id"
        class="building-editor-node-tree__item"
        :class="{ 'building-editor-node-tree__item--selected': item.id === selectedNodeId }"
        :style="{ '--node-depth': item.depth }"
      >
        <button
          class="building-editor-node-tree__select"
          type="button"
          :aria-pressed="item.id === selectedNodeId"
          @click="emit('select-node', item.id)"
        >
          <span>{{ item.type }}</span>
          <strong>{{ item.label }}</strong>
          <code>{{ item.id }}</code>
        </button>

        <div class="building-editor-node-tree__actions">
          <AoiButton
            icon="arrow-up"
            size="sm"
            variant="text"
            :disabled="item.isRoot"
            @click="emit('move-node-up', item.id)"
          >
            {{ t("building.common.up") }}
          </AoiButton>
          <AoiButton
            icon="arrow-down"
            size="sm"
            variant="text"
            :disabled="item.isRoot"
            @click="emit('move-node-down', item.id)"
          >
            {{ t("building.common.down") }}
          </AoiButton>
          <AoiButton
            icon="copy"
            size="sm"
            variant="text"
            :disabled="item.isRoot"
            @click="emit('duplicate-node', item.id)"
          >
            {{ t("building.common.copy") }}
          </AoiButton>
          <AoiButton
            icon="trash-2"
            size="sm"
            variant="text"
            :disabled="item.isRoot"
            @click="emit('delete-node', item.id)"
          >
            {{ t("building.common.delete") }}
          </AoiButton>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.building-editor-node-tree-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-node-tree-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-node-tree-panel h2,
.building-editor-node-tree-panel p {
  margin: 0;
}

.building-editor-node-tree-panel h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-node-tree-panel p,
.building-editor-node-tree__select span,
.building-editor-node-tree__select code,
.building-editor-node-tree-panel__empty p {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-node-tree-panel__header strong {
  display: inline-grid;
  min-width: 32px;
  min-height: 28px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-node-tree,
.building-editor-node-tree-panel__empty {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-node-tree-panel__empty {
  border: 1px dashed var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  padding: 12px;
}

.building-editor-node-tree-panel__empty strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-node-tree__item {
  display: grid;
  min-width: 0;
  gap: 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 8px;
  padding-inline-start: calc(8px + var(--node-depth) * 14px);
}

.building-editor-node-tree__item--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-editor-node-tree__select {
  display: grid;
  min-width: 0;
  gap: 3px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;
}

.building-editor-node-tree__select:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-editor-node-tree__select strong,
.building-editor-node-tree__select code {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-node-tree__select strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-node-tree__actions {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
