<script setup lang="ts">
import AoiSchemaRenderer from "~/components/lowcode/AoiSchemaRenderer"
import { aoiComponentRegistry } from "~/lowcode/componentRegistry"
import { settingsAcknowledgementSchema } from "~/lowcode/schemas/settingsAcknowledgement"
import type { AoiPropControl, AoiSchemaNode } from "~/types/lowcode"

interface BuildingSchemaNodeView {
  childCount: number
  componentKey?: string
  depth: number
  id: string
  kind: AoiSchemaNode["kind"]
  label: string
  node: AoiSchemaNode
}

interface BuildingSchemaNodePathItem {
  componentKey?: string
  id: string
  kind: AoiSchemaNode["kind"]
  label: string
}

interface BuildingSchemaNodeNavItem {
  childCount: number
  componentKey?: string
  id: string
  kind: AoiSchemaNode["kind"]
  label: string
}

interface BuildingPropComparisonRow {
  control: AoiPropControl
  currentValue?: unknown
  defaultValue?: unknown
  effectiveValue?: unknown
  key: string
  source: "schema" | "default" | "unset"
}

interface BuildingUnmappedPropRow {
  key: string
  value: unknown
}

const schemaJson = computed(() => `${JSON.stringify(settingsAcknowledgementSchema, null, 2)}\n`)
const registeredMaterials = computed(() =>
  Object.entries(aoiComponentRegistry).map(([key, item]) => ({
    allowedProps: item.allowedProps,
    category: item.category,
    defaultProps: item.defaultProps,
    description: item.description,
    key,
    label: item.label,
    propControls: item.propControls || []
  }))
)
const selectedMaterialKey = ref(Object.keys(aoiComponentRegistry)[0] || "")
const selectedMaterial = computed(() =>
  registeredMaterials.value.find((item) => item.key === selectedMaterialKey.value) || registeredMaterials.value[0] || null
)
const selectedMaterialDefaultPropsJson = computed(() =>
  selectedMaterial.value?.defaultProps
    ? `${JSON.stringify(selectedMaterial.value.defaultProps, null, 2)}\n`
    : "{}\n"
)
const selectedMaterialUsageCount = computed(() =>
  selectedMaterial.value
    ? countComponentUsage(settingsAcknowledgementSchema.root, selectedMaterial.value.key)
    : 0
)
const collapsedSchemaNodeIds = ref<Set<string>>(new Set())
const schemaNodeViews = computed(() => flattenSchemaNodes(settingsAcknowledgementSchema.root))
const visibleSchemaNodeViews = computed(() => flattenVisibleSchemaNodes(settingsAcknowledgementSchema.root))
const selectedSchemaNodeId = ref(settingsAcknowledgementSchema.root.id)
const selectedSchemaNode = computed(() =>
  schemaNodeViews.value.find((item) => item.id === selectedSchemaNodeId.value) || schemaNodeViews.value[0] || null
)
const selectedSchemaNodePath = computed(() =>
  findSchemaNodePath(settingsAcknowledgementSchema.root, selectedSchemaNodeId.value) || []
)
const selectedSchemaParentNode = computed<BuildingSchemaNodeNavItem | null>(() => {
  const parentPathItem = selectedSchemaNodePath.value.at(-2)

  if (!parentPathItem) {
    return null
  }

  const parentNode = findSchemaNodeById(settingsAcknowledgementSchema.root, parentPathItem.id)

  return parentNode ? toSchemaNodeNavItem(parentNode) : null
})
const selectedSchemaChildNodes = computed<BuildingSchemaNodeNavItem[]>(() => {
  const node = selectedSchemaNode.value?.node

  if (!node) {
    return []
  }

  return getSchemaChildNodes(node).map(toSchemaNodeNavItem)
})
const selectedSchemaMaterial = computed(() =>
  selectedSchemaNode.value?.componentKey
    ? registeredMaterials.value.find((item) => item.key === selectedSchemaNode.value?.componentKey) || null
    : null
)
const selectedSchemaNodeProps = computed<Record<string, unknown>>(() => {
  const node = selectedSchemaNode.value?.node

  if (!node || node.kind === "text" || !node.props) {
    return {}
  }

  return node.props
})
const selectedSchemaNodePropsJson = computed(() => {
  if (!Object.keys(selectedSchemaNodeProps.value).length) {
    return "{}\n"
  }

  return `${JSON.stringify(selectedSchemaNodeProps.value, null, 2)}\n`
})
const selectedSchemaPropComparisonRows = computed<BuildingPropComparisonRow[]>(() => {
  const material = selectedSchemaMaterial.value

  if (!material?.propControls.length) {
    return []
  }

  return material.propControls.map((control) => {
    const hasSchemaValue = Object.prototype.hasOwnProperty.call(selectedSchemaNodeProps.value, control.key)
    const defaultProps = material.defaultProps || {}
    const hasControlDefault = Object.prototype.hasOwnProperty.call(control, "defaultValue")
    const hasMaterialDefault = Object.prototype.hasOwnProperty.call(defaultProps, control.key)
    const defaultValue = hasControlDefault
      ? control.defaultValue
      : hasMaterialDefault
        ? defaultProps[control.key]
        : undefined
    const hasDefaultValue = hasControlDefault || hasMaterialDefault
    const currentValue = selectedSchemaNodeProps.value[control.key]
    const source = hasSchemaValue ? "schema" : hasDefaultValue ? "default" : "unset"

    return {
      control,
      currentValue: hasSchemaValue ? currentValue : undefined,
      defaultValue,
      effectiveValue: hasSchemaValue ? currentValue : hasDefaultValue ? defaultValue : undefined,
      key: control.key,
      source
    }
  })
})
const selectedSchemaUnmappedProps = computed<BuildingUnmappedPropRow[]>(() => {
  const controlledKeys = new Set(selectedSchemaMaterial.value?.propControls.map((control) => control.key) || [])

  return Object.entries(selectedSchemaNodeProps.value)
    .filter(([key]) => !controlledKeys.has(key))
    .map(([key, value]) => ({ key, value }))
})

function formatDefaultValue(value: unknown) {
  if (value === undefined) {
    return "unset"
  }

  if (typeof value === "string") {
    return value || "empty"
  }

  return JSON.stringify(value)
}

function formatPropValue(value: unknown) {
  if (value === undefined) {
    return "unset"
  }

  if (value === null) {
    return "null"
  }

  if (typeof value === "string") {
    return value || "empty"
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return JSON.stringify(value)
}

function selectMaterial(key: string) {
  selectedMaterialKey.value = key
}

function selectSchemaNode(id: string) {
  selectedSchemaNodeId.value = id
}

function flattenSchemaNodes(node: AoiSchemaNode, depth = 0): BuildingSchemaNodeView[] {
  const children = getSchemaChildNodes(node)
  const current = toSchemaNodeView(node, depth)

  return [
    current,
    ...children.flatMap((child) => flattenSchemaNodes(child, depth + 1))
  ]
}

function flattenVisibleSchemaNodes(node: AoiSchemaNode, depth = 0): BuildingSchemaNodeView[] {
  const children = getSchemaChildNodes(node)
  const current = toSchemaNodeView(node, depth)

  if (isSchemaNodeCollapsed(node.id)) {
    return [current]
  }

  return [
    current,
    ...children.flatMap((child) => flattenVisibleSchemaNodes(child, depth + 1))
  ]
}

function toSchemaNodeView(node: AoiSchemaNode, depth: number): BuildingSchemaNodeView {
  return {
    childCount: getSchemaChildNodes(node).length,
    componentKey: node.kind === "component" ? node.componentKey : undefined,
    depth,
    id: node.id,
    kind: node.kind,
    label: getSchemaNodeLabel(node),
    node
  }
}

function isSchemaNodeCollapsed(id: string) {
  return collapsedSchemaNodeIds.value.has(id)
}

function isSchemaNodeCollapsible(nodeView: BuildingSchemaNodeView) {
  return nodeView.childCount > 0
}

function toggleSchemaNodeCollapse(nodeView: BuildingSchemaNodeView) {
  if (!isSchemaNodeCollapsible(nodeView)) {
    return
  }

  const nextCollapsedIds = new Set(collapsedSchemaNodeIds.value)

  if (nextCollapsedIds.has(nodeView.id)) {
    nextCollapsedIds.delete(nodeView.id)
  } else {
    nextCollapsedIds.add(nodeView.id)
  }

  collapsedSchemaNodeIds.value = nextCollapsedIds

  if (
    nextCollapsedIds.has(nodeView.id)
    && selectedSchemaNodeId.value !== nodeView.id
    && schemaNodeContainsId(nodeView.node, selectedSchemaNodeId.value)
  ) {
    selectSchemaNode(nodeView.id)
  }
}

function schemaNodeContainsId(node: AoiSchemaNode, targetId: string): boolean {
  if (node.id === targetId) {
    return true
  }

  return getSchemaChildNodes(node).some((child) => schemaNodeContainsId(child, targetId))
}

function findSchemaNodePath(
  node: AoiSchemaNode,
  targetId: string,
  trail: BuildingSchemaNodePathItem[] = []
): BuildingSchemaNodePathItem[] | null {
  const nextTrail = [
    ...trail,
    toSchemaNodePathItem(node)
  ]

  if (node.id === targetId) {
    return nextTrail
  }

  for (const child of getSchemaChildNodes(node)) {
    const childPath = findSchemaNodePath(child, targetId, nextTrail)

    if (childPath) {
      return childPath
    }
  }

  return null
}

function toSchemaNodePathItem(node: AoiSchemaNode): BuildingSchemaNodePathItem {
  return {
    componentKey: node.kind === "component" ? node.componentKey : undefined,
    id: node.id,
    kind: node.kind,
    label: getSchemaNodeLabel(node)
  }
}

function toSchemaNodeNavItem(node: AoiSchemaNode): BuildingSchemaNodeNavItem {
  return {
    childCount: getSchemaChildNodes(node).length,
    componentKey: node.kind === "component" ? node.componentKey : undefined,
    id: node.id,
    kind: node.kind,
    label: getSchemaNodeLabel(node)
  }
}

function findSchemaNodeById(node: AoiSchemaNode, targetId: string): AoiSchemaNode | null {
  if (node.id === targetId) {
    return node
  }

  for (const child of getSchemaChildNodes(node)) {
    const match = findSchemaNodeById(child, targetId)

    if (match) {
      return match
    }
  }

  return null
}

function getSchemaChildNodes(node: AoiSchemaNode) {
  if (node.kind === "text") {
    return []
  }

  return [
    ...(node.children || []),
    ...Object.values(node.slots || {}).flat()
  ]
}

function getSchemaNodeLabel(node: AoiSchemaNode) {
  if (node.kind === "text") {
    return node.text.length > 32 ? `${node.text.slice(0, 32)}...` : node.text || "Text"
  }

  return aoiComponentRegistry[node.componentKey]?.label || node.componentKey
}

function countComponentUsage(node: AoiSchemaNode, componentKey: string): number {
  if (node.kind === "text") {
    return 0
  }

  const childCount = (node.children || []).reduce((sum, child) =>
    sum + countComponentUsage(child, componentKey), 0)
  const slotCount = Object.values(node.slots || {}).reduce((sum, slotNodes) =>
    sum + slotNodes.reduce((slotSum, child) => slotSum + countComponentUsage(child, componentKey), 0), 0)

  return (node.componentKey === componentKey ? 1 : 0) + childCount + slotCount
}

</script>

<template>
  <div class="aoi-page building-page">
    <SettingsPageHeader
      title="/building"
      description="Read-only Schema preview for the first low-code rendering pass."
    />

    <SettingsPanel
      icon="blocks"
      title="Schema Preview"
      :description="settingsAcknowledgementSchema.title"
    >
      <div class="building-preview">
        <AoiSchemaRenderer
          :node="settingsAcknowledgementSchema.root"
          inspect-mode
          :selected-node-id="selectedSchemaNodeId"
          @select-node="selectSchemaNode"
        />
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="list-tree"
      title="Schema Tree"
      description="Read-only flattened view of the current page schema nodes."
    >
      <div class="building-schema-tree">
        <div
          v-for="schemaNode in visibleSchemaNodeViews"
          :key="schemaNode.id"
          class="building-schema-node-row"
          :style="{ paddingInlineStart: `${10 + schemaNode.depth * 16}px` }"
        >
          <button
            v-if="isSchemaNodeCollapsible(schemaNode)"
            class="building-schema-node-toggle"
            type="button"
            :aria-label="`${isSchemaNodeCollapsed(schemaNode.id) ? 'Expand' : 'Collapse'} schema node ${schemaNode.id}`"
            :aria-expanded="!isSchemaNodeCollapsed(schemaNode.id)"
            @click="toggleSchemaNodeCollapse(schemaNode)"
          >
            <AoiIcon
              :name="isSchemaNodeCollapsed(schemaNode.id) ? 'chevron-right' : 'chevron-down'"
              :size="15"
              decorative
            />
          </button>
          <span
            v-else
            class="building-schema-node-toggle building-schema-node-toggle--placeholder"
            aria-hidden="true"
          />

          <button
            class="building-schema-node"
            :class="{ 'building-schema-node--selected': selectedSchemaNode?.id === schemaNode.id }"
            type="button"
            :aria-label="`Inspect schema node ${schemaNode.id}`"
            :aria-pressed="selectedSchemaNode?.id === schemaNode.id"
            @click="selectSchemaNode(schemaNode.id)"
          >
            <AoiIcon
              :name="schemaNode.kind === 'text' ? 'type' : 'box'"
              :size="16"
              decorative
            />
            <span>{{ schemaNode.label }}</span>
            <code>{{ schemaNode.componentKey || schemaNode.kind }}</code>
            <small>{{ schemaNode.id }}</small>
            <em>{{ schemaNode.childCount }} children</em>
          </button>
        </div>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="scan-search"
      title="Schema Node Detail"
      description="Read-only props and material protocol for the selected schema node."
    >
      <div v-if="selectedSchemaNode" class="building-schema-detail">
        <div class="building-schema-detail__header">
          <div>
            <h3>{{ selectedSchemaNode.label }}</h3>
            <code>{{ selectedSchemaNode.id }}</code>
          </div>
          <span>{{ selectedSchemaNode.kind }}</span>
        </div>

        <nav
          class="building-schema-path"
          aria-label="Selected schema node path"
        >
          <span class="building-schema-path__label">Node Path</span>
          <div class="building-schema-path__items">
            <template
              v-for="(pathItem, index) in selectedSchemaNodePath"
              :key="pathItem.id"
            >
              <button
                class="building-schema-path__item"
                :class="{ 'building-schema-path__item--selected': index === selectedSchemaNodePath.length - 1 }"
                type="button"
                :aria-current="index === selectedSchemaNodePath.length - 1 ? 'page' : undefined"
                :aria-label="`Select schema path node ${pathItem.id}`"
                @click="selectSchemaNode(pathItem.id)"
              >
                <strong>{{ pathItem.label }}</strong>
                <code>{{ pathItem.componentKey || pathItem.kind }}</code>
              </button>
              <span
                v-if="index < selectedSchemaNodePath.length - 1"
                class="building-schema-path__separator"
                aria-hidden="true"
              >/</span>
            </template>
          </div>
        </nav>

        <section class="building-schema-relations">
          <div class="building-schema-relations__group">
            <h4>Parent</h4>
            <button
              v-if="selectedSchemaParentNode"
              class="building-schema-relation"
              type="button"
              :aria-label="`Select parent schema node ${selectedSchemaParentNode.id}`"
              @click="selectSchemaNode(selectedSchemaParentNode.id)"
            >
              <strong>{{ selectedSchemaParentNode.label }}</strong>
              <code>{{ selectedSchemaParentNode.componentKey || selectedSchemaParentNode.kind }}</code>
              <small>{{ selectedSchemaParentNode.id }}</small>
              <em>{{ selectedSchemaParentNode.childCount }} children</em>
            </button>
            <p v-else>No parent node</p>
          </div>

          <div class="building-schema-relations__group">
            <h4>Children</h4>
            <div v-if="selectedSchemaChildNodes.length" class="building-schema-relations__children">
              <button
                v-for="childNode in selectedSchemaChildNodes"
                :key="childNode.id"
                class="building-schema-relation"
                type="button"
                :aria-label="`Select child schema node ${childNode.id}`"
                @click="selectSchemaNode(childNode.id)"
              >
                <strong>{{ childNode.label }}</strong>
                <code>{{ childNode.componentKey || childNode.kind }}</code>
                <small>{{ childNode.id }}</small>
                <em>{{ childNode.childCount }} children</em>
              </button>
            </div>
            <p v-else>No child nodes</p>
          </div>
        </section>

        <dl class="building-schema-detail__stats">
          <div>
            <dt>componentKey</dt>
            <dd>{{ selectedSchemaNode.componentKey || "none" }}</dd>
          </div>
          <div>
            <dt>childCount</dt>
            <dd>{{ selectedSchemaNode.childCount }}</dd>
          </div>
          <div>
            <dt>material</dt>
            <dd>{{ selectedSchemaMaterial?.label || "none" }}</dd>
          </div>
        </dl>

        <section class="building-schema-detail__section">
          <h4>Current Props</h4>
          <AoiCodeBlock
            :code="selectedSchemaNodePropsJson"
            fallback="{}"
            label="Selected schema node props"
          />
        </section>

        <section class="building-schema-detail__section">
          <h4>Matched Prop Controls</h4>
          <ul v-if="selectedSchemaMaterial?.propControls.length" class="building-schema-detail__controls">
            <li
              v-for="control in selectedSchemaMaterial.propControls"
              :key="`${selectedSchemaNode.id}:schema-detail:${control.key}`"
            >
              <strong>{{ control.label }}</strong>
              <code>{{ control.key }}</code>
              <span>{{ control.control }}</span>
              <small>default: {{ formatDefaultValue(control.defaultValue) }}</small>
            </li>
          </ul>
          <p v-else>No matched material controls</p>
        </section>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="sliders-horizontal"
      title="Prop Control Comparison"
      description="Read-only alignment between selected schema props and material controls."
    >
      <div class="building-prop-comparison">
        <template v-if="selectedSchemaMaterial">
          <div class="building-prop-comparison__summary">
            <div>
              <span>selected node</span>
              <strong>{{ selectedSchemaNode?.id || "none" }}</strong>
            </div>
            <div>
              <span>material</span>
              <strong>{{ selectedSchemaMaterial.label }}</strong>
            </div>
          </div>

          <ul v-if="selectedSchemaPropComparisonRows.length" class="building-prop-comparison__rows">
            <li
              v-for="row in selectedSchemaPropComparisonRows"
              :key="`${selectedSchemaNode?.id}:prop-comparison:${row.key}`"
              class="building-prop-comparison__row"
              :class="`building-prop-comparison__row--${row.source}`"
            >
              <div class="building-prop-comparison__row-header">
                <strong>{{ row.control.label }}</strong>
                <span>{{ row.source }}</span>
              </div>
              <code>{{ row.key }}</code>
              <small>{{ row.control.control }}</small>
              <dl>
                <div>
                  <dt>Current</dt>
                  <dd>{{ formatPropValue(row.currentValue) }}</dd>
                </div>
                <div>
                  <dt>Default</dt>
                  <dd>{{ formatPropValue(row.defaultValue) }}</dd>
                </div>
                <div>
                  <dt>Effective</dt>
                  <dd>{{ formatPropValue(row.effectiveValue) }}</dd>
                </div>
              </dl>
            </li>
          </ul>
          <p v-else>No configurable props</p>

          <section v-if="selectedSchemaUnmappedProps.length" class="building-prop-comparison__unmapped">
            <h4>Unmapped Props</h4>
            <ul>
              <li
                v-for="prop in selectedSchemaUnmappedProps"
                :key="`${selectedSchemaNode?.id}:unmapped:${prop.key}`"
              >
                <code>{{ prop.key }}</code>
                <span>{{ formatPropValue(prop.value) }}</span>
              </li>
            </ul>
          </section>
        </template>
        <p v-else>No matched material protocol</p>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="package"
      title="Registered Materials"
      description="Read-only material registry entries available to the current schema renderer."
    >
      <div class="building-material-list">
        <article
          v-for="material in registeredMaterials"
          :key="material.key"
          class="building-material"
          :class="{ 'building-material--selected': selectedMaterial?.key === material.key }"
        >
          <div class="building-material__header">
            <strong>{{ material.label }}</strong>
            <span>{{ material.category }}</span>
          </div>
          <code>{{ material.key }}</code>
          <p v-if="material.description">{{ material.description }}</p>
          <div class="building-material__props">
            <span>allowedProps</span>
            <code>{{ material.allowedProps.length ? material.allowedProps.join(", ") : "none" }}</code>
          </div>
          <div class="building-material__controls">
            <span>propControls</span>
            <ul v-if="material.propControls.length">
              <li
                v-for="control in material.propControls"
                :key="`${material.key}:${control.key}`"
              >
                <strong>{{ control.label }}</strong>
                <code>{{ control.key }}</code>
                <span>{{ control.control }}</span>
                <small>default: {{ formatDefaultValue(control.defaultValue) }}</small>
              </li>
            </ul>
            <p v-else>No configurable props</p>
          </div>
          <button
            class="building-material__inspect"
            type="button"
            :aria-label="`Inspect ${material.label}`"
            :aria-pressed="selectedMaterial?.key === material.key"
            @click="selectMaterial(material.key)"
          >
            <AoiIcon name="panel-right" :size="16" decorative />
            <span>Inspect</span>
          </button>
        </article>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="panel-right"
      title="Material Detail"
      description="Read-only detail for the selected material and its usage in the current schema."
    >
      <div v-if="selectedMaterial" class="building-material-detail">
        <div class="building-material-detail__header">
          <div>
            <h3>{{ selectedMaterial.label }}</h3>
            <code>{{ selectedMaterial.key }}</code>
          </div>
          <span>{{ selectedMaterial.category }}</span>
        </div>

        <p v-if="selectedMaterial.description">{{ selectedMaterial.description }}</p>

        <dl class="building-material-detail__stats">
          <div>
            <dt>Schema usage</dt>
            <dd>{{ selectedMaterialUsageCount }}</dd>
          </div>
          <div>
            <dt>Allowed props</dt>
            <dd>{{ selectedMaterial.allowedProps.length ? selectedMaterial.allowedProps.join(", ") : "none" }}</dd>
          </div>
        </dl>

        <section class="building-material-detail__section">
          <h4>Default Props</h4>
          <AoiCodeBlock
            :code="selectedMaterialDefaultPropsJson"
            fallback="{}"
            label="Selected material default props"
          />
        </section>

        <section class="building-material-detail__section">
          <h4>Prop Controls</h4>
          <ul v-if="selectedMaterial.propControls.length" class="building-material-detail__controls">
            <li
              v-for="control in selectedMaterial.propControls"
              :key="`${selectedMaterial.key}:detail:${control.key}`"
            >
              <strong>{{ control.label }}</strong>
              <code>{{ control.key }}</code>
              <span>{{ control.control }}</span>
              <small>default: {{ formatDefaultValue(control.defaultValue) }}</small>
            </li>
          </ul>
          <p v-else>No configurable props</p>
        </section>
      </div>
    </SettingsPanel>

    <SettingsPanel
      icon="braces"
      title="Schema JSON"
      description="aoi.page.v1"
    >
      <SettingsJsonPreview
        :code="schemaJson"
        fallback="Schema unavailable"
      />
    </SettingsPanel>
  </div>
</template>

<style scoped>
.building-page {
  display: grid;
  gap: var(--aoi-grid-gap);
}

.building-preview {
  overflow: hidden;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-container);
  background: var(--aoi-bg);
  padding: var(--aoi-panel-padding);
}

.building-preview :deep(.settings-link-list) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.building-preview :deep(.settings-link-card) {
  display: grid;
  min-height: 104px;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px 10px;
  align-content: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out),
    transform var(--aoi-motion-fast) var(--aoi-ease-press);
}

.building-preview :deep(.settings-link-card:hover) {
  background: var(--aoi-state-hover);
  color: var(--aoi-accent-60);
}

.building-preview :deep(.settings-link-card:active) {
  transform: scale(.98);
}

.building-preview :deep(.settings-link-card strong) {
  font-weight: 840;
}

.building-preview :deep(.settings-link-card span) {
  grid-column: 1 / -1;
  color: var(--aoi-text-muted);
  line-height: 1.55;
}

.building-preview :deep(.aoi-schema-renderer-node) {
  position: relative;
  cursor: pointer;
}

.building-preview :deep(.aoi-schema-renderer-node:hover) {
  outline: 1px dashed var(--aoi-state-border-active);
  outline-offset: 3px;
}

.building-preview :deep(.aoi-schema-renderer-node--selected) {
  outline: 2px solid var(--aoi-accent-60);
  outline-offset: 4px;
  box-shadow: 0 0 0 6px var(--aoi-accent-10);
}

.building-schema-tree {
  display: grid;
  gap: 8px;
}

.building-schema-node-row {
  display: grid;
  min-width: 0;
  grid-template-columns: var(--aoi-control-height-sm) minmax(0, 1fr);
  gap: 6px;
  align-items: stretch;
}

.building-schema-node-toggle {
  display: inline-grid;
  width: var(--aoi-control-height-sm);
  min-width: var(--aoi-control-height-sm);
  min-height: var(--aoi-control-height-sm);
  place-items: center;
  align-self: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  color: var(--aoi-text-muted);
  cursor: pointer;
  padding: 0;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.building-schema-node-toggle:hover {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.building-schema-node-toggle:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-schema-node-toggle--placeholder {
  border-color: transparent;
  background: transparent;
  cursor: default;
}

.building-schema-node {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 4px 10px;
  align-items: center;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  padding: 9px 10px;
  text-align: start;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.building-schema-node:hover,
.building-schema-node--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-schema-node:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-schema-node > span {
  min-width: 0;
  overflow: hidden;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-schema-node > code,
.building-schema-node > small,
.building-schema-node > em {
  overflow-wrap: anywhere;
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-style: normal;
}

.building-schema-node > code {
  color: var(--aoi-accent-60);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.building-schema-node > small {
  grid-column: 2 / -1;
}

.building-schema-node > em {
  justify-self: end;
}

.building-schema-detail {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}

.building-schema-detail__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-schema-detail__header > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.building-schema-detail__header h3,
.building-schema-detail__section h4,
.building-schema-detail p,
.building-schema-detail__stats {
  margin: 0;
}

.building-schema-detail__header h3 {
  color: var(--aoi-text);
  font-size: 18px;
}

.building-schema-detail__header > span {
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
}

.building-schema-detail code {
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font: 12px ui-monospace, SFMono-Regular, Consolas, monospace;
}

.building-schema-path {
  display: grid;
  gap: 8px;
}

.building-schema-path__label {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-schema-path__items {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.building-schema-path__item {
  display: inline-grid;
  max-width: 100%;
  min-height: var(--aoi-control-height-sm);
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  padding: 7px 10px;
  text-align: start;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.building-schema-path__item:hover,
.building-schema-path__item--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-schema-path__item:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-schema-path__item strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 13px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-schema-path__separator {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.building-schema-relations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.building-schema-relations__group {
  display: grid;
  min-width: 0;
  gap: 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 10px;
}

.building-schema-relations__group h4,
.building-schema-relations__group p {
  margin: 0;
}

.building-schema-relations__group h4 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-schema-relations__group p {
  color: var(--aoi-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.building-schema-relations__children {
  display: grid;
  gap: 8px;
}

.building-schema-relation {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3px 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-surface-muted);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  padding: 9px;
  text-align: start;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.building-schema-relation:hover {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-schema-relation:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-schema-relation strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 13px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-schema-relation code {
  justify-self: end;
}

.building-schema-relation small,
.building-schema-relation em {
  overflow-wrap: anywhere;
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-style: normal;
}

.building-schema-relation small {
  grid-column: 1 / -1;
}

.building-schema-detail p {
  color: var(--aoi-text-muted);
  line-height: 1.55;
}

.building-schema-detail__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.building-schema-detail__stats > div {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 10px;
}

.building-schema-detail__stats dt {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-schema-detail__stats dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--aoi-text);
  font-weight: 820;
}

.building-schema-detail__section {
  display: grid;
  gap: 8px;
}

.building-schema-detail__section h4 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-schema-detail__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
}

.building-schema-detail__controls li {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  list-style: none;
  padding: 10px;
}

.building-schema-detail__controls li > strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-schema-detail__controls li > span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-schema-detail__controls li > code,
.building-schema-detail__controls li > small {
  grid-column: 1 / -1;
}

.building-schema-detail__controls li > small {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-prop-comparison {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}

.building-prop-comparison p,
.building-prop-comparison__unmapped h4 {
  margin: 0;
}

.building-prop-comparison p {
  color: var(--aoi-text-muted);
  line-height: 1.55;
}

.building-prop-comparison__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.building-prop-comparison__summary > div {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 10px;
}

.building-prop-comparison__summary span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-prop-comparison__summary strong {
  overflow-wrap: anywhere;
  color: var(--aoi-text);
  font-size: 13px;
}

.building-prop-comparison__rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
}

.building-prop-comparison__row {
  display: grid;
  min-width: 0;
  gap: 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  list-style: none;
  padding: 12px;
}

.building-prop-comparison__row--schema {
  border-color: var(--aoi-state-border-active);
}

.building-prop-comparison__row--default {
  background: var(--aoi-surface-muted);
}

.building-prop-comparison__row-header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.building-prop-comparison__row-header strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-prop-comparison__row-header span {
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
}

.building-prop-comparison__row > code,
.building-prop-comparison__unmapped code {
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font: 12px ui-monospace, SFMono-Regular, Consolas, monospace;
}

.building-prop-comparison__row > small {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-prop-comparison__row dl {
  display: grid;
  gap: 6px;
  margin: 0;
}

.building-prop-comparison__row dl > div {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(74px, auto) minmax(0, 1fr);
  gap: 8px;
}

.building-prop-comparison__row dt {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-prop-comparison__row dd {
  overflow-wrap: anywhere;
  margin: 0;
  color: var(--aoi-text);
  font-size: 13px;
  font-weight: 760;
}

.building-prop-comparison__unmapped {
  display: grid;
  gap: 8px;
}

.building-prop-comparison__unmapped h4 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-prop-comparison__unmapped ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.building-prop-comparison__unmapped li {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  list-style: none;
  padding: 10px;
}

.building-prop-comparison__unmapped span {
  overflow-wrap: anywhere;
  color: var(--aoi-text);
  font-size: 13px;
  font-weight: 760;
}

.building-material-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.building-material {
  display: grid;
  min-width: 0;
  gap: 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-material--selected {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
}

.building-material__header {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.building-material__header strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-material__header span,
.building-material__props span,
.building-material__controls > span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-material > code,
.building-material__props code,
.building-material__controls code {
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font: 12px ui-monospace, SFMono-Regular, Consolas, monospace;
}

.building-material p {
  margin: 0;
  color: var(--aoi-text-muted);
  line-height: 1.55;
}

.building-material__props,
.building-material__controls {
  display: grid;
  gap: 4px;
}

.building-material__controls ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
}

.building-material__controls li {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 8px;
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-surface-muted);
  list-style: none;
  padding: 8px;
}

.building-material__controls li > strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-material__controls li > span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-material__controls li > code,
.building-material__controls li > small {
  grid-column: 1 / -1;
}

.building-material__controls li > small {
  color: var(--aoi-text-muted);
  font-size: 12px;
}

.building-material__inspect {
  display: inline-grid;
  width: fit-content;
  max-width: 100%;
  min-height: var(--aoi-control-height-sm);
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  justify-self: start;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-card-bg);
  color: var(--aoi-text);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 760;
  padding: 0 11px;
  transition:
    background var(--aoi-motion-fast) var(--aoi-ease-out),
    border-color var(--aoi-motion-fast) var(--aoi-ease-out),
    color var(--aoi-motion-fast) var(--aoi-ease-out);
}

.building-material__inspect:focus-visible {
  outline: var(--aoi-focus-ring-width) solid var(--aoi-focus);
  outline-offset: var(--aoi-focus-ring-offset);
}

.building-material__inspect:hover,
.building-material__inspect[aria-pressed="true"] {
  border-color: var(--aoi-state-border-active);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
}

.building-material-detail {
  display: grid;
  gap: var(--aoi-grid-gap-compact);
}

.building-material-detail__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-material-detail__header > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.building-material-detail__header h3,
.building-material-detail__section h4,
.building-material-detail p,
.building-material-detail__stats {
  margin: 0;
}

.building-material-detail__header h3 {
  color: var(--aoi-text);
  font-size: 18px;
}

.building-material-detail__header > span {
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
}

.building-material-detail code {
  overflow-wrap: anywhere;
  color: var(--aoi-accent-60);
  font: 12px ui-monospace, SFMono-Regular, Consolas, monospace;
}

.building-material-detail p {
  color: var(--aoi-text-muted);
  line-height: 1.55;
}

.building-material-detail__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.building-material-detail__stats > div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 10px;
}

.building-material-detail__stats dt {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-material-detail__stats dd {
  margin: 0;
  color: var(--aoi-text);
  font-weight: 820;
}

.building-material-detail__section {
  display: grid;
  gap: 8px;
}

.building-material-detail__section h4 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-material-detail__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
}

.building-material-detail__controls li {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 8px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  list-style: none;
  padding: 10px;
}

.building-material-detail__controls li > strong {
  min-width: 0;
  overflow: hidden;
  color: var(--aoi-text);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.building-material-detail__controls li > span {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 760;
}

.building-material-detail__controls li > code,
.building-material-detail__controls li > small {
  grid-column: 1 / -1;
}

.building-material-detail__controls li > small {
  color: var(--aoi-text-muted);
  font-size: 12px;
}
</style>
