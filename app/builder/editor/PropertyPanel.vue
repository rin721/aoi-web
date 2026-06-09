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
import {
  translateComponentCategory,
  translateComponentName,
  translatePropSchema
} from "~/lowcode/componentI18n"
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

const { t } = useI18n()
const selectedBindingSourceId = ref("")
const selectedBindingPath = ref("")
const selectedBindingTargetKey = ref("")
const actionDraftJson = ref("[]")
const actionDraftError = ref("")
const controls = computed(() => (props.componentMeta?.propSchema || []).map((control) => translatePropSchema(control, t)))
const hasSelectedNode = computed(() => Boolean(props.selectedNode))
const hasEditableControls = computed(() =>
  controls.value.some((control) => ["string", "number", "boolean", "select"].includes(control.type))
)
const componentName = computed(() =>
  props.componentMeta ? translateComponentName(props.componentMeta, t) : props.selectedNode?.type
)
const componentCategory = computed(() =>
  props.componentMeta ? translateComponentCategory(props.componentMeta, t) : t("building.common.unknown")
)
const dataSourceOptions = computed<AoiSelectOption[]>(() =>
  (props.dataSources || [])
    .filter((source) => source.type === "mock" || source.type === "api" || source.type === "sqlite")
    .map((source) => ({
      label: t("building.panels.property.dataSourceOption", { name: source.name, type: source.type }),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function isActionConfig(value: unknown): value is ActionConfig {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.type === "string"
    && ["showToast", "navigate", "setVariable", "callApi"].includes(value.type)
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
    message: t("building.actions.defaultToastMessage"),
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

function removeOnClickAction(actionId: string) {
  updateOnClickActions(onClickActions.value.filter((action) => action.id !== actionId))
}

function clearOnClickActions() {
  updateOnClickActions([])
}

function syncActionDraft() {
  actionDraftJson.value = JSON.stringify(onClickActions.value, null, 2)
  actionDraftError.value = ""
}

function applyActionDraft() {
  try {
    const parsed = JSON.parse(actionDraftJson.value)

    if (!Array.isArray(parsed) || !parsed.every(isActionConfig)) {
      actionDraftError.value = t("building.validation.actionsInvalidArray")
      return
    }

    updateOnClickActions(parsed)
    actionDraftError.value = ""
  } catch {
    actionDraftError.value = t("building.validation.actionsJsonInvalid")
  }
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

watch(onClickActions, syncActionDraft, { immediate: true })
</script>

<template>
  <section class="building-editor-property-panel" :aria-label="t('building.panels.property.aria')">
    <header>
      <h2>{{ t("building.panels.property.title") }}</h2>
      <p>{{ t("building.panels.property.description") }}</p>
    </header>

    <div
      v-if="!hasSelectedNode"
      class="building-editor-property-panel__empty"
    >
      <strong>{{ t("building.panels.property.noSelectionTitle") }}</strong>
      <p>{{ t("building.panels.property.noSelectionDescription") }}</p>
    </div>

    <template v-else>
      <div class="building-editor-property-panel__summary">
        <span>{{ componentCategory }}</span>
        <strong>{{ componentName }}</strong>
        <code>{{ selectedNode?.id }}</code>
      </div>

      <div
        v-if="!componentMeta"
        class="building-editor-property-panel__empty"
      >
        <strong>{{ t("building.panels.property.unknownComponentTitle") }}</strong>
        <p>{{ t("building.panels.property.unknownComponentDescription") }}</p>
      </div>

      <div
        v-else-if="!controls.length || !hasEditableControls"
        class="building-editor-property-panel__empty"
      >
        <strong>{{ t("building.panels.property.noPropsTitle") }}</strong>
        <p>{{ t("building.panels.property.noPropsDescription") }}</p>
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
            <p>{{ t("building.panels.property.unsupportedPropType", { type: control.type }) }}</p>
          </div>
        </template>
      </form>

      <section class="building-editor-binding-panel" :aria-label="t('building.panels.property.bindingAria')">
        <header>
          <h3>{{ t("building.panels.property.bindingTitle") }}</h3>
          <p>{{ t("building.panels.property.bindingDescription") }}</p>
        </header>

        <div
          v-if="!dataSourceOptions.length"
          class="building-editor-property-panel__empty"
        >
          <strong>{{ t("building.panels.property.noDataSourcesTitle") }}</strong>
          <p>{{ t("building.panels.property.noDataSourcesDescription") }}</p>
        </div>

        <div
          v-else
          class="building-editor-binding-form"
        >
          <AoiSelect
            v-model="selectedBindingSourceId"
            :label="t('building.panels.property.dataSourceLabel')"
            :options="dataSourceOptions"
            variant="outlined"
          />

          <AoiSelect
            v-model="selectedBindingPath"
            :disabled="!bindingFieldOptions.length"
            :label="t('building.panels.property.fieldLabel')"
            :options="bindingFieldOptions"
            variant="outlined"
          />

          <AoiSelect
            v-model="selectedBindingTargetKey"
            :disabled="!bindingTargetOptions.length"
            :label="t('building.panels.property.targetPropLabel')"
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
            {{ t("building.panels.property.applyBinding") }}
          </AoiButton>
        </div>
      </section>

      <section
        v-if="isButtonNode"
        class="building-editor-action-panel"
        :aria-label="t('building.panels.property.actionAria')"
      >
        <header>
          <h3>{{ t("building.panels.property.actionTitle") }}</h3>
          <p>{{ t("building.panels.property.actionDescription") }}</p>
        </header>

        <div class="building-editor-action-panel__controls">
          <AoiButton
            icon="message-square"
            size="sm"
            variant="tonal"
            @click="addShowToastAction"
          >
            {{ t("building.actions.addShowToast") }}
          </AoiButton>

          <AoiButton
            icon="navigation"
            size="sm"
            variant="outlined"
            @click="addNavigateAction"
          >
            {{ t("building.actions.addNavigate") }}
          </AoiButton>

          <AoiButton
            :disabled="!firstApiDataSourceId"
            icon="cloud"
            size="sm"
            variant="outlined"
            @click="addCallApiAction"
          >
            {{ t("building.actions.addCallApi") }}
          </AoiButton>

          <AoiButton
            :disabled="!onClickActions.length"
            icon="trash-2"
            size="sm"
            variant="text"
            @click="clearOnClickActions"
          >
            {{ t("building.actions.clearOnClick") }}
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
            <AoiButton
              icon="trash-2"
              size="sm"
              variant="text"
              @click="removeOnClickAction(action.id)"
            >
              {{ t("building.common.remove") }}
            </AoiButton>
          </li>
        </ul>

        <p
          v-else
          class="building-editor-action-panel__empty"
        >
          {{ t("building.actions.noOnClick") }}
        </p>

        <div class="building-editor-action-json">
          <AoiTextField
            v-model="actionDraftJson"
            :error-text="actionDraftError"
            :label="t('building.actions.jsonLabel')"
            multiline
            :rows="8"
            variant="outlined"
          />

          <AoiButton
            icon="braces"
            size="sm"
            variant="outlined"
            @click="applyActionDraft"
          >
            {{ t("building.actions.applyJson") }}
          </AoiButton>
        </div>
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
.building-editor-action-json,
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
