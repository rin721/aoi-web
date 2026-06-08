<script setup lang="ts">
import { computed, ref } from "vue"
import AoiButton from "~/components/aoi/AoiButton.vue"
import { executeApiDataSource } from "~/lowcode/dataSources/apiConnector"
import { createDatabaseAdapter } from "~/lowcode/dataSources/databaseAdapter"
import type { DatabaseAdapter, DataSource } from "~/types/lowcode"

type ApiDataSource = Extract<DataSource, { type: "api" }>
type SqliteDataSource = Extract<DataSource, { type: "sqlite" }>

const props = defineProps<{
  dataSources?: DataSource[]
}>()

const apiDataSources = computed<ApiDataSource[]>(() =>
  (props.dataSources || []).filter((source): source is ApiDataSource => source.type === "api")
)
const sqliteDataSources = computed<SqliteDataSource[]>(() =>
  (props.dataSources || []).filter((source): source is SqliteDataSource => source.type === "sqlite")
)
const loadingSourceId = ref("")
const loadingDatabaseAction = ref("")
const apiResults = ref<Record<string, string>>({})
const apiErrors = ref<Record<string, string>>({})
const databaseResults = ref<Record<string, string>>({})
const databaseErrors = ref<Record<string, string>>({})
const databaseAdapters = new Map<string, DatabaseAdapter>()

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data source action failed"
}

function getDatabaseAdapter(source: SqliteDataSource) {
  const existingAdapter = databaseAdapters.get(source.id)

  if (existingAdapter) {
    return existingAdapter
  }

  const adapter = createDatabaseAdapter(source)

  databaseAdapters.set(source.id, adapter)
  return adapter
}

function getTableNames(source: SqliteDataSource) {
  return source.config.tables.map((table) => table.name).join(", ")
}

function getUsersTableName(source: SqliteDataSource) {
  return source.config.tables.some((table) => table.name === "users")
    ? "users"
    : source.config.tables[0]?.name || ""
}

async function testApiDataSource(source: ApiDataSource) {
  loadingSourceId.value = source.id
  apiErrors.value = {
    ...apiErrors.value,
    [source.id]: ""
  }

  const result = await executeApiDataSource(source)

  if (result.ok) {
    apiResults.value = {
      ...apiResults.value,
      [source.id]: JSON.stringify(result.data, null, 2)
    }
  } else {
    apiResults.value = {
      ...apiResults.value,
      [source.id]: ""
    }
    apiErrors.value = {
      ...apiErrors.value,
      [source.id]: result.error || "API request failed"
    }
  }

  loadingSourceId.value = ""
}

async function queryUsers(source: SqliteDataSource) {
  const tableName = getUsersTableName(source)

  if (!tableName) {
    databaseErrors.value = {
      ...databaseErrors.value,
      [source.id]: "SQLite data source has no tables."
    }
    return
  }

  loadingDatabaseAction.value = `${source.id}:query`
  databaseErrors.value = {
    ...databaseErrors.value,
    [source.id]: ""
  }

  try {
    const adapter = getDatabaseAdapter(source)

    await adapter.connect()

    const users = await adapter.query(tableName)

    databaseResults.value = {
      ...databaseResults.value,
      [source.id]: JSON.stringify({ users }, null, 2)
    }
  } catch (error) {
    databaseResults.value = {
      ...databaseResults.value,
      [source.id]: ""
    }
    databaseErrors.value = {
      ...databaseErrors.value,
      [source.id]: getErrorMessage(error)
    }
  } finally {
    loadingDatabaseAction.value = ""
  }
}

async function insertUser(source: SqliteDataSource) {
  const tableName = getUsersTableName(source)

  if (!tableName) {
    databaseErrors.value = {
      ...databaseErrors.value,
      [source.id]: "SQLite data source has no tables."
    }
    return
  }

  loadingDatabaseAction.value = `${source.id}:insert`
  databaseErrors.value = {
    ...databaseErrors.value,
    [source.id]: ""
  }

  try {
    const adapter = getDatabaseAdapter(source)
    const timestamp = Date.now()
    const inserted = await adapter.insert(tableName, {
      email: `inserted-${timestamp}@example.test`,
      id: `local-user-${timestamp}`,
      name: `Inserted User ${timestamp}`,
      role: "Viewer"
    })
    const users = await adapter.query(tableName)

    databaseResults.value = {
      ...databaseResults.value,
      [source.id]: JSON.stringify({ inserted, users }, null, 2)
    }
  } catch (error) {
    databaseResults.value = {
      ...databaseResults.value,
      [source.id]: ""
    }
    databaseErrors.value = {
      ...databaseErrors.value,
      [source.id]: getErrorMessage(error)
    }
  } finally {
    loadingDatabaseAction.value = ""
  }
}
</script>

<template>
  <section class="building-editor-data-source-panel" aria-label="Data source panel">
    <header class="building-editor-data-source-panel__header">
      <div>
        <h2>Data Sources</h2>
        <p>API connector and local database adapter test panel.</p>
      </div>
      <strong>{{ apiDataSources.length + sqliteDataSources.length }}</strong>
    </header>

    <section class="building-editor-data-source-section" aria-label="API data sources">
      <header class="building-editor-data-source-section__header">
        <h3>API Connector</h3>
        <p>GET-only external API requests.</p>
      </header>

      <div
        v-if="!apiDataSources.length"
        class="building-editor-data-source-panel__empty"
      >
        <strong>No API data sources</strong>
        <p>Add api DataSource config to the page schema before testing requests.</p>
      </div>

      <div
        v-else
        class="building-editor-data-source-list"
      >
        <article
          v-for="source in apiDataSources"
          :key="source.id"
          class="building-editor-data-source-card"
        >
          <div class="building-editor-data-source-card__summary">
            <span>{{ source.config.method }}</span>
            <strong>{{ source.name }}</strong>
            <code>{{ source.config.url }}</code>
          </div>

          <AoiButton
            icon="cloud"
            size="sm"
            variant="tonal"
            :loading="loadingSourceId === source.id"
            @click="testApiDataSource(source)"
          >
            Test request
          </AoiButton>

          <p
            v-if="apiErrors[source.id]"
            class="building-editor-data-source-card__error"
            role="status"
          >
            {{ apiErrors[source.id] }}
          </p>

          <pre
            v-if="apiResults[source.id]"
            class="building-editor-data-source-card__result"
          >{{ apiResults[source.id] }}</pre>
        </article>
      </div>
    </section>

    <section class="building-editor-data-source-section" aria-label="SQLite data sources">
      <header class="building-editor-data-source-section__header">
        <h3>SQLite Adapter</h3>
        <p>In-memory adapter for local CRUD flow.</p>
      </header>

      <div
        v-if="!sqliteDataSources.length"
        class="building-editor-data-source-panel__empty"
      >
        <strong>No SQLite data sources</strong>
        <p>Add sqlite DataSource config to test local database operations.</p>
      </div>

      <div
        v-else
        class="building-editor-data-source-list"
      >
        <article
          v-for="source in sqliteDataSources"
          :key="source.id"
          class="building-editor-data-source-card"
        >
          <div class="building-editor-data-source-card__summary">
            <span>{{ source.config.adapter || "memory" }}</span>
            <strong>{{ source.name }}</strong>
            <code>{{ getTableNames(source) }}</code>
          </div>

          <div class="building-editor-data-source-card__actions">
            <AoiButton
              icon="database"
              size="sm"
              variant="tonal"
              :loading="loadingDatabaseAction === `${source.id}:query`"
              @click="queryUsers(source)"
            >
              Query users
            </AoiButton>

            <AoiButton
              icon="plus"
              size="sm"
              variant="outlined"
              :loading="loadingDatabaseAction === `${source.id}:insert`"
              @click="insertUser(source)"
            >
              Insert user
            </AoiButton>
          </div>

          <p
            v-if="databaseErrors[source.id]"
            class="building-editor-data-source-card__error"
            role="status"
          >
            {{ databaseErrors[source.id] }}
          </p>

          <pre
            v-if="databaseResults[source.id]"
            class="building-editor-data-source-card__result"
          >{{ databaseResults[source.id] }}</pre>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.building-editor-data-source-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-card);
  background: var(--aoi-card-bg);
  padding: 14px;
}

.building-editor-data-source-panel__header {
  display: flex;
  min-width: 0;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.building-editor-data-source-panel__header h2,
.building-editor-data-source-panel__header p,
.building-editor-data-source-section__header h3,
.building-editor-data-source-section__header p,
.building-editor-data-source-card__error {
  margin: 0;
}

.building-editor-data-source-panel__header h2 {
  color: var(--aoi-text);
  font-size: 16px;
}

.building-editor-data-source-panel__header p,
.building-editor-data-source-section__header p,
.building-editor-data-source-card__summary span,
.building-editor-data-source-card__summary code,
.building-editor-data-source-panel__empty p {
  color: var(--aoi-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-data-source-panel__header strong {
  display: inline-grid;
  min-width: 32px;
  min-height: 28px;
  place-items: center;
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-state-active);
  color: var(--aoi-accent-60);
  font-size: 13px;
}

.building-editor-data-source-section,
.building-editor-data-source-section__header,
.building-editor-data-source-list,
.building-editor-data-source-card,
.building-editor-data-source-card__actions,
.building-editor-data-source-card__summary,
.building-editor-data-source-panel__empty {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.building-editor-data-source-section {
  border-top: 1px solid var(--aoi-border);
  padding-top: 12px;
}

.building-editor-data-source-section__header h3 {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-data-source-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.building-editor-data-source-card,
.building-editor-data-source-panel__empty {
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-surface);
  padding: 10px;
}

.building-editor-data-source-card__summary strong,
.building-editor-data-source-card__summary code,
.building-editor-data-source-panel__empty strong,
.building-editor-data-source-panel__empty p {
  min-width: 0;
  overflow-wrap: anywhere;
}

.building-editor-data-source-card__summary strong,
.building-editor-data-source-panel__empty strong {
  color: var(--aoi-text);
  font-size: 14px;
}

.building-editor-data-source-card__error {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--aoi-danger);
  font-size: 12px;
  line-height: 1.5;
}

.building-editor-data-source-card__result {
  max-height: 220px;
  min-width: 0;
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-control);
  background: var(--aoi-code-bg, var(--aoi-surface));
  color: var(--aoi-text);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
