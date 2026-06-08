<script setup lang="ts">
import {
  AoiSchemaRenderer,
  getAoiPageResources,
  runAoiActionFlow
} from "@aoi/runtime-core"
import {
  aoiBuiltinMaterialManifests,
  aoiMaterialManifestByType
} from "@aoi/materials"
import {
  adminCrudSystemSchema
} from "@aoi/template-admin-crud"
import type {
  AoiDataOperation,
  AoiDataResourceSchema,
  AoiFieldType,
  AoiModelSchema,
  AoiModelFieldSchema,
  AoiNodeSchema,
  AoiRuntimeActionEvent,
  AoiSchemaMigrationOperation,
  AoiSchemaMigrationPlan,
  AoiSchemaMigrationResult,
  AoiSchemaIssue,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  cloneAoiSchema,
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"

interface ProjectPayload {
  migrationResult?: AoiSchemaMigrationResult | null
  ok: boolean
  schema: AoiSystemSchema
  stats: {
    modelCount: number
    projectId: string
    resourceCount: number
    sqlitePath: string
  }
  validationIssues?: AoiSchemaIssue[]
}

const { data: projectPayload, refresh: refreshProject } = await useFetch<ProjectPayload>("/api/projects/current")

const fieldTypes: AoiFieldType[] = ["string", "text", "integer", "number", "boolean", "datetime", "enum"]
const dataOperations: AoiDataOperation[] = ["query", "create", "update", "delete", "seed", "reset"]
const schema = ref<AoiSystemSchema>(cloneAoiSchema(projectPayload.value?.schema || adminCrudSystemSchema))
const activePageId = ref(schema.value.pages[0]?.id || "")
const activeResourceId = ref("")
const activeWorkbenchModelId = ref(schema.value.dataSources[0]?.models[0]?.id || "")
const selectedNodeId = ref("")
const propsDraft = ref("")
const propsError = ref("")
const statusMessage = ref("")
const dataContext = ref<Record<string, Array<Record<string, unknown>>>>({})
const resourceBusy = ref(false)
const projectBusy = ref(false)

const pages = computed(() => schema.value.pages)
const routes = computed(() => schema.value.routes)
const primaryDataSource = computed(() => schema.value.dataSources[0] || null)
const resources = computed(() => schema.value.dataSources.flatMap((source) => source.resources))
const models = computed(() => schema.value.dataSources.flatMap((source) => source.models))
const activePage = computed(() => pages.value.find((page) => page.id === activePageId.value) || pages.value[0] || null)
const activeResource = computed(() => resources.value.find((resource) => resource.id === activeResourceId.value) || resources.value[0] || null)
const activeModel = computed(() => activeResource.value ? modelForResource(activeResource.value) : null)
const activeWorkbenchModel = computed(() => models.value.find((model) => model.id === activeWorkbenchModelId.value) || models.value[0] || null)
const activeWorkbenchResources = computed(() => activeWorkbenchModel.value ? resources.value.filter((resource) => resource.modelId === activeWorkbenchModel.value?.id) : [])
const activeRows = computed(() => activeResource.value ? dataContext.value[activeResource.value.id] || [] : [])
const selectedNode = computed(() => activePage.value ? findNode(activePage.value.root, selectedNodeId.value) : null)
const selectedManifest = computed(() => selectedNode.value ? aoiMaterialManifestByType.get(selectedNode.value.material) || null : null)
const sqlitePath = computed(() => projectPayload.value?.stats.sqlitePath || "")
const pageResources = computed(() => activePage.value ? getAoiPageResources(schema.value, activePage.value) : [])
const schemaValidation = computed(() => validateAoiSystemSchema(schema.value))
const schemaIssues = computed(() => schemaValidation.value.issues.length ? schemaValidation.value.issues : projectPayload.value?.validationIssues || [])

watch(projectPayload, (payload) => {
  if (!payload?.schema) {
    return
  }

  const previousPageId = activePageId.value
  const previousModelId = activeWorkbenchModelId.value
  const previousResourceId = activeResourceId.value

  schema.value = cloneAoiSchema(payload.schema)
  activePageId.value = schema.value.pages.some((page) => page.id === previousPageId) ? previousPageId : schema.value.pages[0]?.id || ""
  activeWorkbenchModelId.value = models.value.some((model) => model.id === previousModelId) ? previousModelId : models.value[0]?.id || ""
  activeResourceId.value = resources.value.some((resource) => resource.id === previousResourceId) ? previousResourceId : resources.value[0]?.id || ""
}, { immediate: true })

watch(resources, (nextResources) => {
  if (!nextResources.some((resource) => resource.id === activeResourceId.value)) {
    activeResourceId.value = nextResources[0]?.id || ""
  }
}, { immediate: true })

watch(models, (nextModels) => {
  if (!nextModels.some((model) => model.id === activeWorkbenchModelId.value)) {
    activeWorkbenchModelId.value = nextModels[0]?.id || ""
  }
}, { immediate: true })

watch(activePage, async () => {
  selectedNodeId.value = activePage.value?.root.id || ""
  await loadPageResources()
}, { immediate: true })

watch(selectedNode, (node) => {
  propsDraft.value = node ? JSON.stringify(node.props, null, 2) : ""
  propsError.value = ""
}, { immediate: true })

watch(activeResourceId, async () => {
  if (activeResourceId.value) {
    await loadResource(activeResourceId.value)
  }
})

function modelForResource(resource: AoiDataResourceSchema) {
  return models.value.find((model) => model.id === resource.modelId) || null
}

function findNode(node: AoiNodeSchema, nodeId: string): AoiNodeSchema | null {
  if (!nodeId) {
    return null
  }

  if (node.id === nodeId) {
    return node
  }

  for (const child of node.children || []) {
    const found = findNode(child, nodeId)

    if (found) {
      return found
    }
  }

  for (const slotNode of Object.values(node.slots || {}).flat()) {
    const found = findNode(slotNode, nodeId)

    if (found) {
      return found
    }
  }

  return null
}

async function loadPageResources() {
  await Promise.all(pageResources.value.map((resourceId) => loadResource(resourceId)))
}

async function loadResource(resourceId: string) {
  resourceBusy.value = true

  try {
    const result = await $fetch<{ items: Array<Record<string, unknown>>, totalCount: number }>(`/api/data/${resourceId}`, {
      query: { limit: 100 }
    })

    dataContext.value = {
      ...dataContext.value,
      [resourceId]: result.items
    }
  } catch (error) {
    statusMessage.value = errorText(error, "Data query failed.")
  } finally {
    resourceBusy.value = false
  }
}

async function saveSchema() {
  projectBusy.value = true

  try {
    const validation = validateAoiSystemSchema(normalizeAoiSystemSchema(schema.value))

    if (!validation.ok) {
      statusMessage.value = `Schema validation failed: ${validation.issues.map((issue) => issue.message).join("; ")}`
      return
    }

    schema.value = validation.normalizedSchema

    const response = await $fetch<ProjectPayload>("/api/projects/current", {
      body: {
        action: "saveSchema",
        schema: validation.normalizedSchema
      },
      method: "POST"
    })

    projectPayload.value = response
    statusMessage.value = "Schema saved to local SQLite."
  } catch (error) {
    statusMessage.value = errorText(error, "Schema save failed.")
  } finally {
    projectBusy.value = false
  }
}

async function applySchemaMigration(nextSchema: AoiSystemSchema, operations: AoiSchemaMigrationOperation[], summary: string, confirmDestructive = false) {
  projectBusy.value = true

  try {
    const normalized = normalizeAoiSystemSchema(nextSchema)
    const validation = validateAoiSystemSchema(normalized)

    if (!validation.ok) {
      statusMessage.value = `Migration Schema validation failed: ${validation.issues.map((issue) => issue.message).join("; ")}`
      return
    }

    const plan: AoiSchemaMigrationPlan = {
      confirmDestructive,
      nextSchema: validation.normalizedSchema,
      operations,
      summary
    }
    const response = await $fetch<ProjectPayload>("/api/projects/current", {
      body: {
        action: "applySchemaMigration",
        migrationPlan: plan
      },
      method: "POST"
    })

    projectPayload.value = response
    schema.value = cloneAoiSchema(response.schema)
    statusMessage.value = response.migrationResult?.summary || summary
    await loadPageResources()
    if (activeResource.value) {
      await loadResource(activeResource.value.id)
    }
  } catch (error) {
    statusMessage.value = errorText(error, "Schema migration failed.")
  } finally {
    projectBusy.value = false
  }
}

function cloneWorkingSchema() {
  return cloneAoiSchema(schema.value)
}

function activeDataSourceId() {
  const sourceId = primaryDataSource.value?.id || ""

  if (!sourceId) {
    statusMessage.value = "No data source is configured."
  }

  return sourceId
}

function promptIdentifier(label: string, fallback: string, usedIds: string[]) {
  const value = window.prompt(label, fallback)

  if (!value) {
    return ""
  }

  return uniqueIdentifier(value, usedIds)
}

function uniqueIdentifier(value: string, usedIds: string[]) {
  const base = toIdentifier(value)
  let next = base
  let index = 2

  while (usedIds.includes(next)) {
    next = `${base}${index}`
    index += 1
  }

  return next
}

function toIdentifier(value: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]/, "m_$&")

  return normalized || `item_${Date.now()}`
}

function findDataSource(nextSchema: AoiSystemSchema, sourceId: string) {
  return nextSchema.dataSources.find((source) => source.id === sourceId) || null
}

function updateNodeProps(nextSchema: AoiSystemSchema, updater: (node: AoiNodeSchema) => void) {
  nextSchema.pages.forEach((page) => visitNode(page.root, updater))
}

function visitNode(node: AoiNodeSchema, updater: (node: AoiNodeSchema) => void) {
  updater(node)
  ;(node.children || []).forEach((child) => visitNode(child, updater))
  Object.values(node.slots || {}).flat().forEach((child) => visitNode(child, updater))
}

async function addModel() {
  const sourceId = activeDataSourceId()

  if (!sourceId) {
    return
  }

  const label = window.prompt("Model label", "Tickets")

  if (!label) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  const modelId = promptIdentifier("Model id", toIdentifier(label), source.models.map((model) => model.id))

  if (!modelId) {
    return
  }

  const resourceId = uniqueIdentifier(`${modelId}Resource`, source.resources.map((resource) => resource.id))
  const model: AoiModelSchema = {
    displayField: "name",
    fields: [
      { id: "id", label: "ID", type: "string" },
      { id: "name", label: "Name", required: true, type: "string" },
      { id: "createdAt", label: "Created At", type: "datetime" }
    ],
    id: modelId,
    label,
    pluralLabel: label
  }
  const resource: AoiDataResourceSchema = {
    driver: source.driver,
    id: resourceId,
    label: `${label} Resource`,
    modelId,
    operations: [...dataOperations]
  }

  source.models.push(model)
  source.resources.push(resource)
  nextSchema.modules[0]?.modelIds.push(modelId)
  activeWorkbenchModelId.value = modelId
  activeResourceId.value = resourceId

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, kind: "model.create", model },
    { dataSourceId: sourceId, kind: "resource.create", resource }
  ], `Create model ${modelId}`)
}

async function renameActiveModel() {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  const toId = promptIdentifier("New model id", model.id, source.models.filter((item) => item.id !== model.id).map((item) => item.id))

  if (!toId || toId === model.id) {
    return
  }

  const nextModel = source.models.find((item) => item.id === model.id)

  if (!nextModel) {
    return
  }

  nextModel.id = toId
  nextSchema.modules.forEach((module) => {
    module.modelIds = module.modelIds.map((modelId) => modelId === model.id ? toId : modelId)
  })
  source.resources.forEach((resource) => {
    if (resource.modelId === model.id) {
      resource.modelId = toId
    }
  })
  updateNodeProps(nextSchema, (node) => {
    if (node.props.modelId === model.id) {
      node.props.modelId = toId
    }
  })
  activeWorkbenchModelId.value = toId

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, fromId: model.id, kind: "model.rename", toId },
    ...source.resources
      .filter((resource) => resource.modelId === toId)
      .map((resource) => ({ dataSourceId: sourceId, kind: "resource.update", resource } satisfies AoiSchemaMigrationOperation))
  ], `Rename model ${model.id} to ${toId}`)
}

async function deleteActiveModel() {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  if (!window.confirm(`Delete model ${model.id} and its SQLite table? This cannot be undone without reseeding.`)) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  const removedResources = source.resources.filter((resource) => resource.modelId === model.id)
  const removedResourceIds = new Set(removedResources.map((resource) => resource.id))

  source.models = source.models.filter((item) => item.id !== model.id)
  source.resources = source.resources.filter((resource) => resource.modelId !== model.id)
  nextSchema.modules.forEach((module) => {
    module.modelIds = module.modelIds.filter((modelId) => modelId !== model.id)
  })
  updateNodeProps(nextSchema, (node) => {
    if (node.props.modelId === model.id) {
      delete node.props.modelId
    }

    if (typeof node.props.resourceId === "string" && removedResourceIds.has(node.props.resourceId)) {
      delete node.props.resourceId
    }
  })

  activeWorkbenchModelId.value = source.models[0]?.id || ""
  activeResourceId.value = resources.value.find((resource) => resource.modelId !== model.id)?.id || ""

  await applySchemaMigration(nextSchema, [
    ...removedResources.map((resource) => ({ dataSourceId: sourceId, kind: "resource.delete", resourceId: resource.id } satisfies AoiSchemaMigrationOperation)),
    { dataSourceId: sourceId, kind: "model.delete", modelId: model.id }
  ], `Delete model ${model.id}`, true)
}

async function saveModelMeta() {
  const model = activeWorkbenchModel.value

  if (!model) {
    return
  }

  if (!model.fields.some((field) => field.id === model.displayField)) {
    model.displayField = firstDisplayField(model)
  }

  await saveSchema()
}

async function addField() {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  const label = window.prompt("Field label", "Priority")

  if (!label) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)
  const nextModel = source?.models.find((item) => item.id === model.id)

  if (!source || !nextModel) {
    return
  }

  const fieldId = promptIdentifier("Field id", toIdentifier(label), nextModel.fields.map((field) => field.id))

  if (!fieldId) {
    return
  }

  const field: AoiModelFieldSchema = {
    id: fieldId,
    label,
    required: false,
    type: "string"
  }

  nextModel.fields.push(field)

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, field, kind: "field.create", modelId: model.id }
  ], `Create field ${model.id}.${field.id}`)
}

async function renameField(field: AoiModelFieldSchema) {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId || field.id === "id") {
    statusMessage.value = "The id field cannot be renamed."
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)
  const nextModel = source?.models.find((item) => item.id === model.id)

  if (!source || !nextModel) {
    return
  }

  const toId = promptIdentifier("New field id", field.id, nextModel.fields.filter((item) => item.id !== field.id).map((item) => item.id))

  if (!toId || toId === field.id) {
    return
  }

  const nextField = nextModel.fields.find((item) => item.id === field.id)

  if (!nextField) {
    return
  }

  nextField.id = toId

  if (nextModel.displayField === field.id) {
    nextModel.displayField = toId
  }

  updateNodeProps(nextSchema, (node) => {
    if (node.props.displayField === field.id && node.props.modelId === model.id) {
      node.props.displayField = toId
    }
  })

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, fromId: field.id, kind: "field.rename", modelId: model.id, toId }
  ], `Rename field ${model.id}.${field.id} to ${toId}`)
}

async function deleteField(field: AoiModelFieldSchema) {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  if (field.id === "id") {
    statusMessage.value = "The id field is the primary key and cannot be deleted."
    return
  }

  if (!window.confirm(`Delete field ${model.id}.${field.id}? Existing column data will be removed.`)) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)
  const nextModel = source?.models.find((item) => item.id === model.id)

  if (!source || !nextModel) {
    return
  }

  nextModel.fields = nextModel.fields.filter((item) => item.id !== field.id)

  if (nextModel.displayField === field.id) {
    nextModel.displayField = firstDisplayField(nextModel)
  }

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, fieldId: field.id, kind: "field.delete", modelId: model.id }
  ], `Delete field ${model.id}.${field.id}`, true)
}

async function applyFieldMeta(field: AoiModelFieldSchema) {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)
  const nextModel = source?.models.find((item) => item.id === model.id)
  const nextField = nextModel?.fields.find((item) => item.id === field.id)

  if (!source || !nextModel || !nextField) {
    return
  }

  if (nextField.type !== "enum") {
    delete nextField.enumOptions
  }

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, field: nextField, kind: "field.updateMeta", modelId: model.id }
  ], `Update field ${model.id}.${field.id}`)
}

function firstDisplayField(model: AoiModelSchema) {
  return model.fields.find((field) => field.id !== "id")?.id || "id"
}

function updateFieldEnumOptions(field: AoiModelFieldSchema, event: Event) {
  const input = event.target as HTMLInputElement
  field.enumOptions = input.value.split(",").map((item) => item.trim()).filter(Boolean)
}

function updateFieldDefaultValue(field: AoiModelFieldSchema, event: Event) {
  const input = event.target as HTMLInputElement

  if (!input.value) {
    delete field.defaultValue
  } else {
    field.defaultValue = input.value
  }
}

async function addResource() {
  const model = activeWorkbenchModel.value
  const sourceId = activeDataSourceId()

  if (!model || !sourceId) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  const resourceId = promptIdentifier("Resource id", `${model.id}Resource`, source.resources.map((resource) => resource.id))

  if (!resourceId) {
    return
  }

  const resource: AoiDataResourceSchema = {
    driver: source.driver,
    id: resourceId,
    label: `${model.label} Resource`,
    modelId: model.id,
    operations: [...dataOperations]
  }

  source.resources.push(resource)
  activeResourceId.value = resourceId

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, kind: "resource.create", resource }
  ], `Create resource ${resourceId}`)
}

async function renameResource(resource: AoiDataResourceSchema) {
  const sourceId = activeDataSourceId()

  if (!sourceId) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  const toId = promptIdentifier("New resource id", resource.id, source.resources.filter((item) => item.id !== resource.id).map((item) => item.id))

  if (!toId || toId === resource.id) {
    return
  }

  const nextResource = source.resources.find((item) => item.id === resource.id)

  if (!nextResource) {
    return
  }

  nextResource.id = toId
  updateNodeProps(nextSchema, (node) => {
    if (node.props.resourceId === resource.id) {
      node.props.resourceId = toId
    }
  })
  activeResourceId.value = toId

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, fromId: resource.id, kind: "resource.rename", toId }
  ], `Rename resource ${resource.id} to ${toId}`)
}

async function deleteResource(resource: AoiDataResourceSchema) {
  const sourceId = activeDataSourceId()

  if (!sourceId) {
    return
  }

  if (!window.confirm(`Delete resource ${resource.id}? Components using it will lose their binding.`)) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)

  if (!source) {
    return
  }

  source.resources = source.resources.filter((item) => item.id !== resource.id)
  updateNodeProps(nextSchema, (node) => {
    if (node.props.resourceId === resource.id) {
      delete node.props.resourceId
    }
  })

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, kind: "resource.delete", resourceId: resource.id }
  ], `Delete resource ${resource.id}`)
}

async function applyResourceUpdate(resource: AoiDataResourceSchema) {
  const sourceId = activeDataSourceId()

  if (!sourceId) {
    return
  }

  const nextSchema = cloneWorkingSchema()
  const source = findDataSource(nextSchema, sourceId)
  const nextResource = source?.resources.find((item) => item.id === resource.id)

  if (!source || !nextResource) {
    return
  }

  await applySchemaMigration(nextSchema, [
    { dataSourceId: sourceId, kind: "resource.update", resource: nextResource }
  ], `Update resource ${resource.id}`)
}

function updateResourceOperationDraft(resource: AoiDataResourceSchema, operation: AoiDataOperation, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  const nextOperations = new Set(resource.operations)

  if (checked) {
    nextOperations.add(operation)
  } else {
    nextOperations.delete(operation)
  }

  resource.operations = dataOperations.filter((item) => nextOperations.has(item))
}

async function seedData(action: "resetData" | "seedData") {
  projectBusy.value = true

  try {
    const response = await $fetch<ProjectPayload>("/api/projects/current", {
      body: { action },
      method: "POST"
    })

    projectPayload.value = response
    await loadPageResources()
    if (activeResource.value) {
      await loadResource(activeResource.value.id)
    }
    statusMessage.value = action === "resetData" ? "SQLite data reset from seed." : "Seed data written."
  } catch (error) {
    statusMessage.value = errorText(error, "SQLite seed action failed.")
  } finally {
    projectBusy.value = false
  }
}

function applyPropsDraft() {
  if (!selectedNode.value) {
    return
  }

  try {
    const parsed = JSON.parse(propsDraft.value) as Record<string, unknown>

    selectedNode.value.props = parsed
    propsError.value = ""
    statusMessage.value = "Node props updated in the working Schema."
  } catch {
    propsError.value = "Props must be valid JSON."
  }
}

async function createRecord() {
  if (!activeResource.value || !activeModel.value) {
    return
  }

  await mutateResource("create", createSampleRecord(activeModel.value))
}

async function updateFirstRecord() {
  if (!activeResource.value || !activeModel.value || !activeRows.value[0]) {
    statusMessage.value = "No record is available to update."
    return
  }

  const first = activeRows.value[0]
  const record = createStatusUpdate(activeModel.value, first)

  await mutateResource("update", record, String(first.id || ""))
}

async function deleteFirstRecord() {
  if (!activeRows.value[0]) {
    statusMessage.value = "No record is available to delete."
    return
  }

  await mutateResource("delete", {}, String(activeRows.value[0].id || ""))
}

async function mutateResource(action: "create" | "delete" | "update", record: Record<string, unknown>, id = "") {
  if (!activeResource.value) {
    return
  }

  resourceBusy.value = true

  try {
    await $fetch(`/api/data/${activeResource.value.id}`, {
      body: { action, id, record },
      method: "POST"
    })
    await loadResource(activeResource.value.id)
    await loadPageResources()
    statusMessage.value = `${action} completed on ${activeResource.value.label}.`
  } catch (error) {
    statusMessage.value = errorText(error, `${action} failed.`)
  } finally {
    resourceBusy.value = false
  }
}

async function compileRuntime() {
  projectBusy.value = true

  try {
    await saveSchema()
    const result = await $fetch<{ outputDir: string }>("/api/compiler/admin-crud", { method: "POST" })

    statusMessage.value = `Runtime generated at ${result.outputDir}.`
  } catch (error) {
    statusMessage.value = errorText(error, "Runtime compile failed.")
  } finally {
    projectBusy.value = false
  }
}

function exportSchema() {
  const blob = new Blob([`${JSON.stringify(schema.value, null, 2)}\n`], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = "system.schema.json"
  link.click()
  URL.revokeObjectURL(url)
  statusMessage.value = "Schema exported."
}

async function importSchema(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    const nextSchema = JSON.parse(await file.text()) as AoiSystemSchema
    const validation = validateAoiSystemSchema(normalizeAoiSystemSchema(nextSchema))

    if (!validation.ok) {
      schema.value = validation.normalizedSchema
      statusMessage.value = `Schema import failed validation: ${validation.issues.map((issue) => issue.message).join("; ")}`
      return
    }

    schema.value = cloneAoiSchema(validation.normalizedSchema)
    activePageId.value = schema.value.pages[0]?.id || ""
    await saveSchema()
    await refreshProject()
    statusMessage.value = "Schema imported."
  } catch {
    statusMessage.value = "Schema import failed."
  } finally {
    input.value = ""
  }
}

async function handleRendererAction(event: AoiRuntimeActionEvent) {
  await runAoiActionFlow(event.flow, {
    create: async (resourceId, payload) => {
      const resource = resources.value.find((item) => item.id === resourceId)

      if (resource) {
        activeResourceId.value = resource.id
        await mutateResource("create", payload || {})
      }
    },
    delete: async (resourceId, payload) => {
      const id = String(payload?.id || "")

      if (id) {
        activeResourceId.value = resourceId
        await mutateResource("delete", {}, id)
      }
    },
    navigate: (to) => {
      const route = routes.value.find((item) => item.path === to)

      if (route) {
        activePageId.value = route.pageId
      }
    },
    query: async (resourceId) => loadResource(resourceId),
    toast: (message) => {
      statusMessage.value = message
    },
    update: async (resourceId, payload) => {
      const id = String(payload?.id || "")

      if (id) {
        activeResourceId.value = resourceId
        await mutateResource("update", payload || {}, id)
      }
    }
  }, event)
}

function createSampleRecord(model: AoiModelSchema) {
  const timestamp = new Date().toISOString()
  const record: Record<string, unknown> = {}

  model.fields.forEach((field) => {
    if (field.id === "id") {
      record[field.id] = `${model.id}_${Date.now()}`
    } else if (field.id === "createdAt") {
      record[field.id] = timestamp
    } else if (field.type === "number" || field.type === "integer") {
      record[field.id] = Math.round(Math.random() * 9000) + 1000
    } else if (field.type === "boolean") {
      record[field.id] = false
    } else if (field.enumOptions?.length) {
      record[field.id] = field.enumOptions[0]
    } else {
      record[field.id] = `New ${field.label}`
    }
  })

  return record
}

function createStatusUpdate(model: AoiModelSchema, source: Record<string, unknown>) {
  const record = { ...source }
  const statusField = model.fields.find((field) => field.id === "status" && field.enumOptions?.length)

  if (statusField?.enumOptions?.length) {
    const current = String(record.status || statusField.enumOptions[0])
    const index = statusField.enumOptions.indexOf(current)

    record.status = statusField.enumOptions[(index + 1) % statusField.enumOptions.length]
  } else {
    const displayField = model.displayField

    record[displayField] = `${record[displayField] || "Record"} updated`
  }

  return record
}

function errorText(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data as { aoiDataRuntimeError?: { code?: string, message?: string, recoverable?: boolean }, statusMessage?: string } | undefined
    const dataError = data?.aoiDataRuntimeError

    if (dataError?.message) {
      return `${fallback} ${dataError.message}${dataError.recoverable ? " You can reset seed data to recover." : ""}`
    }

    if (data?.statusMessage) {
      return `${fallback} ${data.statusMessage}`
    }
  }

  if (error && typeof error === "object" && "statusMessage" in error && typeof error.statusMessage === "string") {
    return `${fallback} ${error.statusMessage}`
  }

  return fallback
}
</script>

<template>
  <main class="builder-shell">
    <aside class="builder-sidebar builder-sidebar--left" aria-label="Project structure and materials">
      <div class="builder-brand">
        <span class="builder-brand__mark">A</span>
        <div>
          <strong>Aoi Builder</strong>
          <span>{{ schema.app.name }}</span>
        </div>
      </div>

      <section class="builder-panel">
        <header class="builder-panel__header">
          <Icon name="lucide:folder-tree" />
          <h2>Project Tree</h2>
        </header>
        <button
          v-for="page in pages"
          :key="page.id"
          class="builder-list-button"
          :class="{ 'builder-list-button--active': activePageId === page.id }"
          type="button"
          @click="activePageId = page.id"
        >
          <span>{{ page.name }}</span>
          <small>{{ page.routePath }}</small>
        </button>
      </section>

      <section class="builder-panel">
        <header class="builder-panel__header">
          <Icon name="lucide:blocks" />
          <h2>Materials</h2>
        </header>
        <div class="material-list">
          <button
            v-for="material in aoiBuiltinMaterialManifests"
            :key="material.type"
            class="material-item"
            type="button"
            @click="statusMessage = `${material.label} is available through the schema registry.`"
          >
            <Icon :name="`lucide:${material.icon}`" />
            <span>{{ material.label }}</span>
            <small>{{ material.category }}</small>
          </button>
        </div>
      </section>
    </aside>

    <section class="builder-main">
      <header class="builder-toolbar">
        <div>
          <h1>{{ activePage?.name || "Building" }}</h1>
          <p>{{ activePage?.routePath }}</p>
        </div>
        <div class="builder-toolbar__actions">
          <button class="builder-command" type="button" :disabled="projectBusy" @click="saveSchema">
            <Icon name="lucide:save" />
            Save Schema
          </button>
          <button class="builder-command" type="button" @click="exportSchema">
            <Icon name="lucide:download" />
            Export
          </button>
          <label class="builder-command builder-command--file">
            <Icon name="lucide:upload" />
            Import
            <input accept=".json,application/json" type="file" @change="importSchema">
          </label>
          <button class="builder-command builder-command--primary" type="button" :disabled="projectBusy" @click="compileRuntime">
            <Icon name="lucide:package-check" />
            Compile Runtime
          </button>
        </div>
      </header>

      <section class="builder-canvas" aria-label="Schema canvas">
        <AoiSchemaRenderer
          v-if="activePage"
          :data-context="dataContext"
          :page="activePage"
          :schema="schema"
          :selected-node-id="selectedNodeId"
          @action="handleRendererAction"
          @select-node="selectedNodeId = $event"
        />
      </section>

      <section class="builder-data-console" aria-label="SQLite data console">
        <div class="builder-data-console__header">
          <div>
            <strong>SQLite Data Bus</strong>
            <span>{{ sqlitePath }}</span>
          </div>
          <select v-model="activeResourceId" class="builder-select" aria-label="Resource">
            <option v-for="resource in resources" :key="resource.id" :value="resource.id">
              {{ resource.label }}
            </option>
          </select>
        </div>
        <div class="builder-data-console__actions">
          <button class="builder-command" type="button" :disabled="resourceBusy" @click="loadResource(activeResourceId)">
            <Icon name="lucide:refresh-cw" />
            Query
          </button>
          <button class="builder-command" type="button" :disabled="resourceBusy" @click="createRecord">
            <Icon name="lucide:plus" />
            Create
          </button>
          <button class="builder-command" type="button" :disabled="resourceBusy" @click="updateFirstRecord">
            <Icon name="lucide:shuffle" />
            Update First
          </button>
          <button class="builder-command builder-command--danger" type="button" :disabled="resourceBusy" @click="deleteFirstRecord">
            <Icon name="lucide:trash-2" />
            Delete First
          </button>
          <button class="builder-command" type="button" :disabled="projectBusy" @click="seedData('resetData')">
            <Icon name="lucide:database-backup" />
            Reset Seed
          </button>
        </div>
        <div class="builder-mini-table">
          <table v-if="activeModel">
            <thead>
              <tr>
                <th v-for="field in activeModel.fields" :key="field.id">{{ field.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in activeRows" :key="String(record.id)">
                <td v-for="field in activeModel.fields" :key="field.id">{{ record[field.id] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <aside class="builder-sidebar builder-sidebar--right" aria-label="Inspector">
      <section class="builder-panel builder-panel--data-model">
        <header class="builder-panel__header">
          <Icon name="lucide:database-zap" />
          <h2>Data Model</h2>
          <button class="builder-icon-command" type="button" title="Add model" @click="addModel">
            <Icon name="lucide:plus" />
          </button>
        </header>

        <template v-if="activeWorkbenchModel">
          <div class="model-toolbar">
            <select v-model="activeWorkbenchModelId" class="builder-select" aria-label="Model">
              <option v-for="model in models" :key="model.id" :value="model.id">
                {{ model.label }}
              </option>
            </select>
            <button class="builder-icon-command" type="button" title="Rename model" @click="renameActiveModel">
              <Icon name="lucide:pencil" />
            </button>
            <button class="builder-icon-command builder-icon-command--danger" type="button" title="Delete model" @click="deleteActiveModel">
              <Icon name="lucide:trash-2" />
            </button>
          </div>

          <label class="builder-field">
            <span>Label</span>
            <input v-model="activeWorkbenchModel.label">
          </label>
          <label class="builder-field">
            <span>Plural Label</span>
            <input v-model="activeWorkbenchModel.pluralLabel">
          </label>
          <label class="builder-field">
            <span>Display Field</span>
            <select v-model="activeWorkbenchModel.displayField">
              <option v-for="field in activeWorkbenchModel.fields" :key="field.id" :value="field.id">
                {{ field.label }}
              </option>
            </select>
          </label>
          <button class="builder-command" type="button" :disabled="projectBusy" @click="saveModelMeta">
            <Icon name="lucide:save" />
            Save Model Meta
          </button>

          <div class="data-model-subhead">
            <strong>Fields</strong>
            <button class="builder-icon-command" type="button" title="Add field" @click="addField">
              <Icon name="lucide:plus" />
            </button>
          </div>
          <div class="model-field-list">
            <article v-for="field in activeWorkbenchModel.fields" :key="field.id" class="model-field-card">
              <div class="model-field-card__header">
                <strong>{{ field.id }}</strong>
                <div>
                  <button class="builder-icon-command" type="button" title="Rename field" :disabled="field.id === 'id'" @click="renameField(field)">
                    <Icon name="lucide:pencil" />
                  </button>
                  <button class="builder-icon-command builder-icon-command--danger" type="button" title="Delete field" :disabled="field.id === 'id'" @click="deleteField(field)">
                    <Icon name="lucide:trash-2" />
                  </button>
                </div>
              </div>
              <div class="field-grid">
                <label class="builder-field">
                  <span>Label</span>
                  <input v-model="field.label">
                </label>
                <label class="builder-field">
                  <span>Type</span>
                  <select v-model="field.type">
                    <option v-for="type in fieldTypes" :key="type" :value="type">
                      {{ type }}
                    </option>
                  </select>
                </label>
                <label class="builder-checkbox">
                  <input v-model="field.required" type="checkbox">
                  <span>Required</span>
                </label>
                <label class="builder-field">
                  <span>Default</span>
                  <input :value="String(field.defaultValue ?? '')" @input="updateFieldDefaultValue(field, $event)">
                </label>
                <label v-if="field.type === 'enum'" class="builder-field builder-field--wide">
                  <span>Enum Options</span>
                  <input :value="(field.enumOptions || []).join(', ')" @input="updateFieldEnumOptions(field, $event)">
                </label>
              </div>
              <button class="builder-command" type="button" :disabled="projectBusy" @click="applyFieldMeta(field)">
                <Icon name="lucide:check" />
                Apply Field
              </button>
            </article>
          </div>

          <div class="data-model-subhead">
            <strong>Resources</strong>
            <button class="builder-icon-command" type="button" title="Add resource" @click="addResource">
              <Icon name="lucide:plus" />
            </button>
          </div>
          <div class="resource-list">
            <article v-for="resource in activeWorkbenchResources" :key="resource.id" class="resource-card">
              <div class="model-field-card__header">
                <strong>{{ resource.id }}</strong>
                <div>
                  <button class="builder-icon-command" type="button" title="Rename resource" @click="renameResource(resource)">
                    <Icon name="lucide:pencil" />
                  </button>
                  <button class="builder-icon-command builder-icon-command--danger" type="button" title="Delete resource" @click="deleteResource(resource)">
                    <Icon name="lucide:trash-2" />
                  </button>
                </div>
              </div>
              <label class="builder-field">
                <span>Label</span>
                <input v-model="resource.label">
              </label>
              <div class="operation-list">
                <label v-for="operation in dataOperations" :key="operation" class="builder-checkbox">
                  <input
                    :checked="resource.operations.includes(operation)"
                    type="checkbox"
                    @change="updateResourceOperationDraft(resource, operation, $event)"
                  >
                  <span>{{ operation }}</span>
                </label>
              </div>
              <button class="builder-command" type="button" :disabled="projectBusy" @click="applyResourceUpdate(resource)">
                <Icon name="lucide:check" />
                Apply Resource
              </button>
            </article>
          </div>
        </template>
        <p v-else class="builder-muted">Create a model to start data modeling.</p>
      </section>

      <section class="builder-panel">
        <header class="builder-panel__header">
          <Icon name="lucide:sliders-horizontal" />
          <h2>Inspector</h2>
        </header>
        <template v-if="selectedNode">
          <dl class="inspector-meta">
            <div>
              <dt>Node</dt>
              <dd>{{ selectedNode.id }}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{{ selectedManifest?.label || selectedNode.material }}</dd>
            </div>
          </dl>
          <label class="builder-field">
            <span>Props JSON</span>
            <textarea v-model="propsDraft" spellcheck="false" />
          </label>
          <p v-if="propsError" class="builder-error">{{ propsError }}</p>
          <button class="builder-command builder-command--primary" type="button" @click="applyPropsDraft">
            <Icon name="lucide:check" />
            Apply Props
          </button>
        </template>
        <p v-else class="builder-muted">Select a node on the canvas.</p>
      </section>

      <section class="builder-panel">
        <header class="builder-panel__header">
          <Icon name="lucide:file-json-2" />
          <h2>Schema</h2>
        </header>
        <dl class="inspector-meta">
          <div>
            <dt>Version</dt>
            <dd>{{ schema.version }}</dd>
          </div>
          <div>
            <dt>Models</dt>
            <dd>{{ models.length }}</dd>
          </div>
          <div>
            <dt>Resources</dt>
            <dd>{{ resources.length }}</dd>
          </div>
        </dl>
        <div v-if="schemaIssues.length" class="schema-issues">
          <strong>Validation Issues</strong>
          <ul>
            <li v-for="issue in schemaIssues" :key="`${issue.path}:${issue.code}`">
              {{ issue.path }} - {{ issue.message }}
            </li>
          </ul>
        </div>
        <p v-else class="builder-muted">Schema validation passed.</p>
      </section>

      <p v-if="statusMessage" class="builder-status">{{ statusMessage }}</p>
    </aside>
  </main>
</template>
