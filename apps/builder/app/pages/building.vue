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
  AoiActionFlowSchema,
  AoiDataResourceSchema,
  AoiModelSchema,
  AoiNodeSchema,
  AoiSchemaIssue,
  AoiSystemSchema
} from "@aoi/protocol"
import {
  cloneAoiSchema,
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"

interface ProjectPayload {
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

const schema = ref<AoiSystemSchema>(cloneAoiSchema(projectPayload.value?.schema || adminCrudSystemSchema))
const activePageId = ref(schema.value.pages[0]?.id || "")
const activeResourceId = ref("")
const selectedNodeId = ref("")
const propsDraft = ref("")
const propsError = ref("")
const statusMessage = ref("")
const dataContext = ref<Record<string, Array<Record<string, unknown>>>>({})
const resourceBusy = ref(false)
const projectBusy = ref(false)

const pages = computed(() => schema.value.pages)
const routes = computed(() => schema.value.routes)
const resources = computed(() => schema.value.dataSources.flatMap((source) => source.resources))
const models = computed(() => schema.value.dataSources.flatMap((source) => source.models))
const activePage = computed(() => pages.value.find((page) => page.id === activePageId.value) || pages.value[0] || null)
const activeResource = computed(() => resources.value.find((resource) => resource.id === activeResourceId.value) || resources.value[0] || null)
const activeModel = computed(() => activeResource.value ? modelForResource(activeResource.value) : null)
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

  schema.value = cloneAoiSchema(payload.schema)
  activePageId.value = schema.value.pages[0]?.id || ""
}, { immediate: true })

watch(resources, (nextResources) => {
  if (!nextResources.some((resource) => resource.id === activeResourceId.value)) {
    activeResourceId.value = nextResources[0]?.id || ""
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

async function handleRendererAction(flow: AoiActionFlowSchema) {
  await runAoiActionFlow(flow, {
    create: async (resourceId, payload) => {
      const resource = resources.value.find((item) => item.id === resourceId)
      const model = resource ? modelForResource(resource) : null

      if (resource && model) {
        activeResourceId.value = resource.id
        await mutateResource("create", payload || createSampleRecord(model))
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
  })
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
