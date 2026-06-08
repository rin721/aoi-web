<script setup lang="ts">
import { computed, ref, watch } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import AoiCheckbox from "~/components/aoi/AoiCheckbox.vue"
import AoiSelect from "~/components/aoi/AoiSelect.vue"
import AoiTextField from "~/components/aoi/AoiTextField.vue"
import type { AoiSelectOption } from "~/components/aoi/AoiSelect.vue"
import {
  getDataSourceFieldOptions
} from "~/lowcode/dataSources/dataSourceRegistry"
import type { ActionConfig, ComponentMeta, ComponentNode, DataBinding, DataSource, EventConfig, PropSchema } from "~/types/lowcode"

const props = defineProps<{
  componentMeta?: ComponentMeta | null
  dataSources?: DataSource[]
  selectedNode?: ComponentNode | null
}>()

const emit = defineEmits<{
  "update-binding": [payload: { binding: DataBinding, nodeId: string }]
  "update-events": [payload: { events: EventConfig[], nodeId: string }]
  "update-prop": [payload: { key: string, nodeId: string, value: unknown }]
}>()

const selectedBindingSourceId = ref("")
const selectedBindingPath = ref("")
const selectedBindingTargetKey = ref("")
const controls = computed(() => props.componentMeta?.propSchema || [])
const hasSelectedNode = computed(() => Boolean(props.selectedNode))
const hasEditableControls = computed(() =>
  controls.value.some((control) => ["string", "number", "boolean", "select"].includes(control.type))
)
const dataSourceOptions = computed<AoiSelectOption[]>(() =>
  (props.dataSources || [])
    .filter((source) => source.type === "mock" || source.type === "api")
    .map((source) => ({
      label: `${source.name} · ${source.type}`,
      value: source.id
    }))
)
const bindingFieldOptions = computed(() =>
  selectedBindingSourceId.value
    ? getDataSourceFieldOptions(selectedBindingSourceId.value, props.dataSources)
    : []
)
const bindingTargetOptions = computed<AoiSelectOption[]>(() =>
  controls.value.map((control) => ({
    label: `${control.label} · ${control.key}`,
    value: control.key
  }))
)
const canApplyBinding = computed(() =>
  Boolean(props.selectedNode && selectedBindingSourceId.value && selectedBindingPath.value && selectedBindingTargetKey.value)
)
const isButtonNode = computed(() => props.selectedNode?.type === "button")
const onClickActions = computed(() =>
  props.selectedNode?.events?.find((eventConfig) => eventConfig.event === "onClick")?.actions || []
)
const firstApiDataSourceId = computed(() =>
  (props.dataSources || []).find((source) => source.type === "api")?.id || ""
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

function resetBindingForm() {
  const firstBinding = props.selectedNode?.bindings?.find((binding) => binding.target === "props" && binding.targetKey)

  selectedBindingSourceId.value = firstBinding?.sourceId || dataSourceOptions.value[0]?.value || ""
  selectedBindingPath.value = firstBinding?.path || ""
  selectedBindingTargetKey.value = firstBinding?.targetKey || bindingTargetOptions.value[0]?.value || ""
}

function applyBinding() {
  if (!props.selectedNode || !canApplyBinding.value) {
    return
  }

  emit("update-binding", {
    binding: {
      id: `binding-${props.selectedNode.id}-${selectedBindingTargetKey.value}`,
      path: selectedBindingPath.value,
      sourceId: selectedBindingSourceId.value,
      target: "props",
      targetKey: selectedBindingTargetKey.value
    },
    nodeId: props.selectedNode.id
  })
}

function createActionId(type: ActionConfig["type"]) {
  return `action-${props.selectedNode?.id || "node"}-${type}-${Date.now()}`
}

function updateNodeEvents(events: EventConfig[]) {
  if (!props.selectedNode) {
    return
  }

  emit("update-events", {
    events,
    nodeId: props.selectedNode.id
  })
}

function updateOnClickActions(actions: ActionConfig[]) {
  const otherEvents = props.selectedNode?.events?.filter((eventConfig) => eventConfig.event !== "onClick") || []

  updateNodeEvents(actions.length
    ? [
        ...otherEvents,
        {
          actions,
          event: "onClick"
        }
      ]
    : otherEvents
  )
}

function appendOnClickAction(action: ActionConfig) {
  updateOnClickActions([
    ...onClickActions.value,
    action
  ])
}

function addShowToastAction() {
  appendOnClickAction({
    id: createActionId("showToast"),
    message: "Hello from Event Action",
    tone: "success",
    type: "showToast"
  })
}

function addNavigateAction() {
  appendOnClickAction({
    id: createActionId("navigate"),
    to: "/building",
    type: "navigate"
  })
}

function addCallApiAction() {
  if (!firstApiDataSourceId.value) {
    return
  }

  appendOnClickAction({
    dataSourceId: firstApiDataSourceId.value,
    id: createActionId("callApi"),
    type: "callApi"
  })
}

function clearOnClickActions() {
  updateOnClickActions([])
}

watch([
  () => props.selectedNode?.id,
  dataSourceOptions,
  bindingTargetOptions
], resetBindingForm, { immediate: true })

watch(selectedBindingSourceId, () => {
  const fields = bindingFieldOptions.value

  if (!fields.some((field) => field.value === selectedBindingPath.value)) {
    selectedBindingPath.value = fields[0]?.value || ""
  }
})
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

      <section class="building-editor-binding-panel" aria-label="Data binding panel">
        <header>
          <h3>Data Binding</h3>
          <p>Bind a first-level mock or api field to the selected component props.</p>
        </header>

        <div
          v-if="!dataSourceOptions.length"
          class="building-editor-property-panel__empty"
        >
          <strong>No available data sources</strong>
          <p>The current page schema has no data sources to bind.</p>
        </div>

        <div
          v-else
          class="building-editor-binding-form"
        >
          <AoiSelect
            v-model="selectedBindingSourceId"
            label="Data source"
            :options="dataSourceOptions"
            variant="outlined"
          />

          <AoiSelect
            v-model="selectedBindingPath"
            :disabled="!bindingFieldOptions.length"
            label="Field"
            :options="bindingFieldOptions"
            variant="outlined"
          />

          <AoiSelect
            v-model="selectedBindingTargetKey"
            :disabled="!bindingTargetOptions.length"
            label="Target prop"
            :options="bindingTargetOptions"
            variant="outlined"
          />

          <AoiButton
            :disabled="!canApplyBinding"
            icon="database"
            size="sm"
            variant="tonal"
            @click="applyBinding"
          >
            应用绑定
          </AoiButton>
        </div>
      </section>

      <section
        v-if="isButtonNode"
        class="building-editor-action-panel"
        aria-label="Event action panel"
      >
        <header>
          <h3>Event Actions</h3>
          <p>Configure onClick actions stored in ComponentNode.events.</p>
        </header>

        <div class="building-editor-action-panel__controls">
          <AoiButton
            icon="message-square"
            size="sm"
            variant="tonal"
            @click="addShowToastAction"
          >
            Add showToast
          </AoiButton>

          <AoiButton
            icon="navigation"
            size="sm"
            variant="outlined"
            @click="addNavigateAction"
          >
            Add navigate
          </AoiButton>

          <AoiButton
            :disabled="!firstApiDataSourceId"
            icon="cloud"
            size="sm"
            variant="outlined"
            @click="addCallApiAction"
          >
            Add callApi
          </AoiButton>

          <AoiButton
            :disabled="!onClickActions.length"
            icon="trash-2"
            size="sm"
            variant="text"
            @click="clearOnClickActions"
          >
            Clear onClick actions
          </AoiButton>
        </div>

        <ul
          v-if="onClickActions.length"
          class="building-editor-action-list"
        >
          <li
            v-for="action in onClickActions"
            :key="action.id"
          >
            <span>{{ action.type }}</span>
            <code>{{ action.id }}</code>
          </li>
        </ul>

        <p
          v-else
          class="building-editor-action-panel__empty"
        >
          No onClick actions configured.
        </p>
      </section>
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

.building-editor-binding-panel h3,
.building-editor-binding-panel p,
.building-editor-action-panel h3,
.building-editor-action-panel p {
  margin: 0;
}

.building-editor-binding-panel h3,
.building-editor-action-panel h3 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-property-panel header p,
.building-editor-binding-panel header p,
.building-editor-action-panel header p,
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

.building-editor-binding-panel,
.building-editor-binding-form,
.building-editor-action-panel,
.building-editor-action-panel__controls,
.building-editor-action-list {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.building-editor-binding-panel,
.building-editor-action-panel {
  border-top: 1px solid var(--aoi-border);
  padding-top: 12px;
}

.building-editor-action-panel__controls {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.building-editor-action-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.building-editor-action-list li {
  display: grid;
  min-width: 0;
  gap: 4px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  padding: 8px;
}

.building-editor-action-list span,
.building-editor-action-list code,
.building-editor-action-panel__empty {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .building-editor-action-panel__controls {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
