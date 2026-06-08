<script setup lang="ts">
import { computed } from "vue"
import AoiCheckbox from "~/components/aoi/AoiCheckbox.vue"
import AoiSelect from "~/components/aoi/AoiSelect.vue"
import AoiTextField from "~/components/aoi/AoiTextField.vue"
import type { AoiSelectOption } from "~/components/aoi/AoiSelect.vue"
import type { ComponentMeta, ComponentNode, PropSchema } from "~/types/lowcode"

const props = defineProps<{
  componentMeta?: ComponentMeta | null
  selectedNode?: ComponentNode | null
}>()

const emit = defineEmits<{
  "update-prop": [payload: { key: string, nodeId: string, value: unknown }]
}>()

const controls = computed(() => props.componentMeta?.propSchema || [])
const hasSelectedNode = computed(() => Boolean(props.selectedNode))
const hasEditableControls = computed(() =>
  controls.value.some((control) => ["string", "number", "boolean", "select"].includes(control.type))
)

function getControlValue(control: PropSchema) {
  const nodeProps = props.selectedNode?.props || {}
  const defaultProps = props.componentMeta?.defaultProps || {}

  if (Object.prototype.hasOwnProperty.call(nodeProps, control.key)) {
    return nodeProps[control.key]
  }

  if (Object.prototype.hasOwnProperty.call(defaultProps, control.key)) {
    return defaultProps[control.key]
  }

  if (Object.prototype.hasOwnProperty.call(control, "defaultValue")) {
    return control.defaultValue
  }

  return control.type === "boolean" ? false : ""
}

function getTextValue(control: PropSchema) {
  const value = getControlValue(control)

  if (value === undefined || value === null) {
    return ""
  }

  return String(value)
}

function getBooleanValue(control: PropSchema) {
  return Boolean(getControlValue(control))
}

function getSelectOptions(control: PropSchema): AoiSelectOption[] {
  return (control.options || []).map((option) => ({
    label: option,
    value: option
  }))
}

function updateProp(key: string, value: unknown) {
  if (!props.selectedNode) {
    return
  }

  emit("update-prop", {
    key,
    nodeId: props.selectedNode.id,
    value
  })
}

function updateNumberProp(key: string, value: string) {
  updateProp(key, value === "" ? "" : Number(value))
}
</script>

<template>
  <section class="building-editor-property-panel" aria-label="Property panel">
    <header>
      <h2>PropertyPanel</h2>
      <p>属性面板</p>
    </header>

    <div
      v-if="!hasSelectedNode"
      class="building-editor-property-panel__empty"
    >
      <strong>未选择组件</strong>
      <p>点击画布中的组件后，可以在这里编辑它的 props。</p>
    </div>

    <template v-else>
      <div class="building-editor-property-panel__summary">
        <span>{{ componentMeta?.category || "unknown" }}</span>
        <strong>{{ componentMeta?.name || selectedNode?.type }}</strong>
        <code>{{ selectedNode?.id }}</code>
      </div>

      <div
        v-if="!componentMeta"
        class="building-editor-property-panel__empty"
      >
        <strong>未知组件协议</strong>
        <p>当前节点没有匹配的 componentRegistry 配置。</p>
      </div>

      <div
        v-else-if="!controls.length || !hasEditableControls"
        class="building-editor-property-panel__empty"
      >
        <strong>无可配置属性</strong>
        <p>当前组件暂时没有可编辑的 propSchema。</p>
      </div>

      <form
        v-else
        class="building-editor-property-form"
        @submit.prevent
      >
        <template
          v-for="control in controls"
          :key="control.key"
        >
          <AoiTextField
            v-if="control.type === 'string'"
            :key="`${selectedNode?.id}:${control.key}:string`"
            :data-prop-key="control.key"
            :model-value="getTextValue(control)"
            :label="control.label"
            :supporting-text="control.description"
            variant="outlined"
            @update:model-value="updateProp(control.key, $event)"
          />

          <AoiTextField
            v-else-if="control.type === 'number'"
            :key="`${selectedNode?.id}:${control.key}:number`"
            :data-prop-key="control.key"
            :model-value="getTextValue(control)"
            :label="control.label"
            :supporting-text="control.description"
            type="number"
            variant="outlined"
            @update:model-value="updateNumberProp(control.key, $event)"
          />

          <AoiCheckbox
            v-else-if="control.type === 'boolean'"
            :key="`${selectedNode?.id}:${control.key}:boolean`"
            :data-prop-key="control.key"
            :model-value="getBooleanValue(control)"
            :label="control.label"
            @update:model-value="updateProp(control.key, $event)"
          />

          <AoiSelect
            v-else-if="control.type === 'select'"
            :key="`${selectedNode?.id}:${control.key}:select`"
            :data-prop-key="control.key"
            :model-value="getTextValue(control)"
            :label="control.label"
            :options="getSelectOptions(control)"
            variant="outlined"
            @update:model-value="updateProp(control.key, $event)"
          />

          <div
            v-else
            class="building-editor-property-panel__empty"
          >
            <strong>{{ control.label }}</strong>
            <p>{{ control.type }} 类型暂未开放编辑。</p>
          </div>
        </template>
      </form>
    </template>
  </section>
</template>

<style scoped>
.building-editor-property-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-property-panel h2,
.building-editor-property-panel p {
  margin: 0;
}

.building-editor-property-panel h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-property-panel header p,
.building-editor-property-panel__empty p,
.building-editor-property-panel__summary span,
.building-editor-property-panel__summary code {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.building-editor-property-panel__empty,
.building-editor-property-panel__summary {
  display: grid;
  min-width: 0;
  gap: 6px;
  border: 1px dashed var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  padding: 12px;
}

.building-editor-property-panel__empty strong,
.building-editor-property-panel__summary strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-property-panel__summary code {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-property-form {
  display: grid;
  min-width: 0;
  gap: 12px;
}
</style>
