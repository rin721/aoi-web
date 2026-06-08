<script setup lang="ts">
import {
  AoiSchemaRenderer,
  getAoiPageResources,
  runAoiActionFlow
} from "@aoi/runtime-core"
import type {
  AoiActionFlowSchema,
  AoiDataResourceSchema,
  AoiModelSchema
} from "@aoi/protocol"
import {
  normalizeAoiSystemSchema,
  validateAoiSystemSchema
} from "@aoi/protocol"
import { generatedSystemSchema } from "../generated/system.schema"

const route = useRoute()
const statusMessage = ref("")
const dataContext = ref<Record<string, Array<Record<string, unknown>>>>({})
const schema = normalizeAoiSystemSchema(generatedSystemSchema)
const schemaValidation = validateAoiSystemSchema(schema)
const schemaIssues = schemaValidation.issues

const currentPath = computed(() => route.path || "/")
const activeRoute = computed(() => schema.routes.find((item) => item.path === currentPath.value) || schema.routes[0])
const activePage = computed(() => schema.pages.find((page) => page.id === activeRoute.value?.pageId) || schema.pages[0] || null)
const resources = computed(() => schema.dataSources.flatMap((source) => source.resources))
const models = computed(() => schema.dataSources.flatMap((source) => source.models))
const pageResources = computed(() => activePage.value ? getAoiPageResources(schema, activePage.value) : [])

useHead(() => ({
  title: `${activeRoute.value?.title || schema.app.name} - ${schema.app.name}`
}))

watch(activePage, async () => {
  if (!schemaValidation.ok) {
    return
  }

  await Promise.all(pageResources.value.map((resourceId) => loadResource(resourceId)))
}, { immediate: true })

async function loadResource(resourceId: string) {
  const result = await $fetch<{ items: Array<Record<string, unknown>>, totalCount: number }>(`/api/data/${resourceId}`, {
    query: { limit: 100 }
  })

  dataContext.value = {
    ...dataContext.value,
    [resourceId]: result.items
  }
}

async function mutateResource(action: "create" | "delete" | "update", resourceId: string, record: Record<string, unknown>, id = "") {
  await $fetch(`/api/data/${resourceId}`, {
    body: { action, id, record },
    method: "POST"
  })
  await loadResource(resourceId)
}

async function handleAction(flow: AoiActionFlowSchema) {
  await runAoiActionFlow(flow, {
    create: async (resourceId, payload) => {
      const resource = resourceById(resourceId)
      const model = resource ? modelForResource(resource) : null

      if (resource && model) {
        await mutateResource("create", resource.id, payload || createSampleRecord(model))
      }
    },
    navigate: async (to) => {
      await navigateTo(to)
    },
    query: async (resourceId) => loadResource(resourceId),
    toast: (message) => {
      statusMessage.value = message
    },
    update: async (resourceId, payload) => {
      const id = String(payload?.id || "")

      if (id) {
        await mutateResource("update", resourceId, payload || {}, id)
      }
    }
  })
}

function resourceById(resourceId: string) {
  return resources.value.find((resource) => resource.id === resourceId) || null
}

function modelForResource(resource: AoiDataResourceSchema) {
  return models.value.find((model) => model.id === resource.modelId) || null
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
      record[field.id] = 1
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
</script>

<template>
  <div class="runtime-shell">
    <aside class="runtime-nav" aria-label="Application navigation">
      <div class="runtime-brand">
        <strong>{{ schema.app.name }}</strong>
        <span>{{ schema.version }}</span>
      </div>
      <NuxtLink
        v-for="item in schema.routes"
        :key="item.path"
        class="runtime-nav__link"
        :class="{ 'runtime-nav__link--active': item.path === currentPath }"
        :to="item.path"
      >
        {{ item.title }}
      </NuxtLink>
    </aside>
    <main class="runtime-main">
      <header class="runtime-header">
        <div>
          <h1>{{ activeRoute?.title || schema.app.name }}</h1>
          <p>{{ schema.app.description }}</p>
        </div>
      </header>
      <section v-if="schemaIssues.length" class="runtime-issues" aria-label="Schema validation issues">
        <strong>Schema issues</strong>
        <ul>
          <li v-for="issue in schemaIssues" :key="`${issue.path}:${issue.code}`">
            {{ issue.path }} - {{ issue.message }}
          </li>
        </ul>
      </section>
      <p v-else-if="!activePage" class="runtime-status">
        This runtime template is waiting for a compiled Aoi Schema.
      </p>
      <p v-if="statusMessage" class="runtime-status">{{ statusMessage }}</p>
      <AoiSchemaRenderer
        v-if="schemaValidation.ok && activePage"
        :data-context="dataContext"
        :page="activePage"
        :schema="schema"
        @action="handleAction"
      />
    </main>
  </div>
</template>
