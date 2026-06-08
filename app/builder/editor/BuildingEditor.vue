<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import BuilderShell from "~/builder/BuilderShell.vue"
import Canvas from "~/builder/editor/Canvas.vue"
import ComponentPanel from "~/builder/editor/ComponentPanel.vue"
import DataSourcePanel from "~/builder/editor/DataSourcePanel.vue"
import PageManagerPanel from "~/builder/editor/PageManagerPanel.vue"
import PluginPanel from "~/builder/editor/PluginPanel.vue"
import PropertyPanel from "~/builder/editor/PropertyPanel.vue"
import PublishPanel from "~/builder/editor/PublishPanel.vue"
import SchemaViewer from "~/builder/editor/SchemaViewer.vue"
import ThemePanel from "~/builder/editor/ThemePanel.vue"
import Toolbar from "~/builder/editor/Toolbar.vue"
import VersionPanel from "~/builder/editor/VersionPanel.vue"
import {
  listLowCodeApps,
  loadLowCodeApp,
  loadLowCodePageVersions,
  loadOrCreateLowCodeApp,
  normalizeLowCodeApp,
  normalizeLowCodePage,
  restoreLowCodePageVersion,
  saveLowCodeApp,
  saveLowCodePageVersion
} from "~/builder/editor/schemaStorage"
import { getRegisteredComponent } from "~/lowcode/componentRegistry"
import { getDefaultDataSources } from "~/lowcode/dataSources/dataSourceRegistry"
import { subscribe as subscribeToPluginRegistry } from "~/lowcode/plugins/pluginRegistry"
import { getDefaultTheme, normalizeTheme } from "~/lowcode/themes/themeRegistry"
import type { ComponentMeta, ComponentNode, DataBinding, EventConfig, LowCodeApp, LowCodeAppSummary, LowCodePage, PageVersion, ThemeConfig } from "~/types/lowcode"

const props = defineProps<{
  appId: string
}>()

const appSchema = ref<LowCodeApp>(withEditorDefaults(loadOrCreateLowCodeApp(props.appId)))
const selectedNodeId = ref<string | null>(null)
const storedAppSummaries = ref<LowCodeAppSummary[]>([])
const pageVersions = ref<PageVersion[]>([])
const pluginRegistryVersion = ref(0)
const schemaViewerVisible = ref(false)
const toolbarStatus = ref("")
let createdNodeSequence = 0
let createdPageSequence = 0
let unsubscribeFromPluginRegistry: (() => void) | undefined

const appSummaries = computed(() => {
  const currentSummary: LowCodeAppSummary = {
    currentPageId: appSchema.value.currentPageId,
    id: appSchema.value.id,
    name: appSchema.value.name,
    pageCount: appSchema.value.pages.length
  }
  const summaries = storedAppSummaries.value.filter((app) => app.id !== currentSummary.id)

  return [
    currentSummary,
    ...summaries
  ]
})
const currentPage = computed(() =>
  appSchema.value.pages.find((page) => page.id === appSchema.value.currentPageId)
  || appSchema.value.pages[0]
  || null
)
const componentsTo = computed(() => `/building/apps/${props.appId}/components`)
const previewTo = computed(() => getPreviewPath(currentPage.value))
const runtimeTo = computed(() => getRuntimePath(currentPage.value))
const selectedNode = computed(() => {
  if (!selectedNodeId.value || !currentPage.value) {
    return null
  }

  return findNodeById(currentPage.value.layout, selectedNodeId.value)
})
const selectedComponentMeta = computed<ComponentMeta | null>(() => {
  pluginRegistryVersion.value

  if (!selectedNode.value) {
    return null
  }

  return getRegisteredComponent(selectedNode.value.type) || null
})

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function cloneDefaultDataSources() {
  return clone(getDefaultDataSources()) as LowCodePage["dataSources"]
}

function cloneDefaultTheme() {
  return clone(getDefaultTheme()) as ThemeConfig
}

function withPageDefaults(page: LowCodePage) {
  const normalizedPage = normalizeLowCodePage(page)
  const dataSourceMap = new Map(
    [
      ...(cloneDefaultDataSources() || []),
      ...(normalizedPage.dataSources || [])
    ].map((source) => [source.id, source])
  )

  return {
    ...normalizedPage,
    dataSources: Array.from(dataSourceMap.values()),
    theme: normalizeTheme(normalizedPage.theme || cloneDefaultTheme())
  }
}

function withEditorDefaults(app: LowCodeApp) {
  const normalizedApp = normalizeLowCodeApp(app)
  const appDataSourceMap = new Map(
    [
      ...(cloneDefaultDataSources() || []),
      ...(normalizedApp.dataSources || [])
    ].map((source) => [source.id, source])
  )

  return {
    ...normalizedApp,
    dataSources: Array.from(appDataSourceMap.values()),
    pages: normalizedApp.pages.map(withPageDefaults),
    theme: normalizeTheme(normalizedApp.theme || cloneDefaultTheme())
  }
}

function refreshStoredApps() {
  storedAppSummaries.value = listLowCodeApps()
}

function refreshPageVersions(pageId = currentPage.value?.id) {
  pageVersions.value = pageId ? loadLowCodePageVersions(props.appId, pageId) : []
}

function loadCurrentApp() {
  const storedApp = loadLowCodeApp(props.appId)

  appSchema.value = withEditorDefaults(storedApp || loadOrCreateLowCodeApp(props.appId))
  selectedNodeId.value = currentPage.value?.layout.id || null
  toolbarStatus.value = storedApp ? "已从本地恢复" : ""
  refreshStoredApps()
  refreshPageVersions()
}

function createComponentNode(type: string): ComponentNode | null {
  pluginRegistryVersion.value

  const meta = getRegisteredComponent(type)

  if (!meta) {
    return null
  }

  createdNodeSequence += 1

  return {
    children: type === "container" ? [] : undefined,
    id: `lowcode-${type}-${Date.now()}-${createdNodeSequence}`,
    props: {
      ...meta.defaultProps
    },
    type
  }
}

function getPreviewPath(page: LowCodePage | null) {
  if (!page) {
    return `/building/apps/${props.appId}/preview`
  }

  const normalizedPath = page.path === "/" ? "" : page.path.replace(/^\/+/, "")
  const encodedPath = normalizedPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return encodedPath
    ? `/building/apps/${props.appId}/preview/${encodedPath}`
    : `/building/apps/${props.appId}/preview`
}

function getRuntimePath(page: LowCodePage | null) {
  if (!page) {
    return `/building/apps/${props.appId}/runtime`
  }

  const normalizedPath = page.path === "/" ? "" : page.path.replace(/^\/+/, "")
  const encodedPath = normalizedPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return encodedPath
    ? `/building/apps/${props.appId}/runtime/${encodedPath}`
    : `/building/apps/${props.appId}/runtime`
}

function updateCurrentPage(updater: (page: LowCodePage) => LowCodePage) {
  if (!currentPage.value) {
    return
  }

  const nextPage = withPageDefaults(updater(currentPage.value))

  appSchema.value = withEditorDefaults({
    ...appSchema.value,
    currentPageId: nextPage.id,
    pages: appSchema.value.pages.map((page) => page.id === nextPage.id ? nextPage : page)
  })
}

function withLayout(page: LowCodePage, layout: ComponentNode): LowCodePage {
  return {
    ...page,
    layout,
    root: layout
  }
}

function handleAddComponent(type: string) {
  const newNode = createComponentNode(type)

  if (!newNode || !currentPage.value) {
    return
  }

  updateCurrentPage((page) => {
    const layout = page.layout

    return withLayout(page, {
      ...layout,
      children: [
        ...(layout.children || []),
        newNode
      ]
    })
  })
  selectedNodeId.value = newNode.id
}

function handleSelectNode(id: string) {
  selectedNodeId.value = id
}

function handleSelectPage(pageId: string) {
  const page = appSchema.value.pages.find((item) => item.id === pageId)

  if (!page) {
    return
  }

  appSchema.value = withEditorDefaults({
    ...appSchema.value,
    currentPageId: page.id
  })
  selectedNodeId.value = page.layout.id
  refreshPageVersions(page.id)
}

function createUniquePageSlug() {
  let index = appSchema.value.pages.length + createdPageSequence + 1
  let slug = `page-${index}`
  const usedIds = new Set(appSchema.value.pages.map((page) => page.id))
  const usedPaths = new Set(appSchema.value.pages.map((page) => page.path))

  while (usedIds.has(slug) || usedPaths.has(`/${slug}`)) {
    index += 1
    slug = `page-${index}`
  }

  createdPageSequence += 1
  return slug
}

function createBlankPage(slug: string): LowCodePage {
  const layout: ComponentNode = {
    children: [],
    id: `${slug}-root`,
    props: {
      class: "low-code-generated-page"
    },
    style: {
      inline: {
        display: "grid",
        gap: "12px"
      }
    },
    type: "container"
  }

  return withPageDefaults({
    dataSources: cloneDefaultDataSources(),
    events: [],
    id: slug,
    layout,
    meta: {
      description: "Created in the local /building editor.",
      order: appSchema.value.pages.length + 1
    },
    name: `Page ${appSchema.value.pages.length + 1}`,
    path: `/${slug}`,
    root: layout,
    theme: currentPage.value?.theme || cloneDefaultTheme(),
    title: `Page ${appSchema.value.pages.length + 1}`
  })
}

function handleCreatePage() {
  const slug = createUniquePageSlug()
  const page = createBlankPage(slug)

  appSchema.value = withEditorDefaults({
    ...appSchema.value,
    currentPageId: page.id,
    pages: [
      ...appSchema.value.pages,
      page
    ]
  })
  selectedNodeId.value = page.layout.id
  pageVersions.value = []
}

function handleSaveSchema() {
  const page = currentPage.value
  const version = page
    ? saveLowCodePageVersion(
        props.appId,
        page,
        `保存于 ${new Date().toLocaleString()}`
      )
    : null
  const saved = saveLowCodeApp(appSchema.value)
  const versionSaved = !page || Boolean(version)

  toolbarStatus.value = saved && versionSaved
    ? `已保存 ${new Date().toLocaleTimeString()}`
    : "保存失败，请检查浏览器存储权限"
  refreshStoredApps()
  refreshPageVersions()
}

function toggleSchemaViewer() {
  schemaViewerVisible.value = !schemaViewerVisible.value
}

function handleUpdateNodeBinding(payload: { binding: DataBinding, nodeId: string }) {
  updateCurrentPage((page) => withLayout(
    page,
    updateNodeBinding(page.layout, payload.nodeId, payload.binding)
  ))
}

function handleUpdateTheme(theme: ThemeConfig) {
  updateCurrentPage((page) => ({
    ...page,
    theme
  }))
}

function handleUpdateNodeEvents(payload: { events: EventConfig[], nodeId: string }) {
  updateCurrentPage((page) => withLayout(
    page,
    updateNodeEvents(page.layout, payload.nodeId, payload.events)
  ))
}

function handleUpdateNodeProp(payload: { key: string, nodeId: string, value: unknown }) {
  updateCurrentPage((page) => withLayout(
    page,
    updateNodeProps(page.layout, payload.nodeId, payload.key, payload.value)
  ))
}

function handleRestorePageVersion(version: PageVersion) {
  const restoredPage = withPageDefaults(restoreLowCodePageVersion(version))
  const pageExists = appSchema.value.pages.some((page) => page.id === restoredPage.id)

  appSchema.value = withEditorDefaults({
    ...appSchema.value,
    currentPageId: restoredPage.id,
    pages: pageExists
      ? appSchema.value.pages.map((page) => page.id === restoredPage.id ? restoredPage : page)
      : [
          ...appSchema.value.pages,
          restoredPage
        ]
  })
  selectedNodeId.value = restoredPage.layout.id
  toolbarStatus.value = "已恢复历史版本，点击保存后持久化"
  refreshPageVersions(restoredPage.id)
}

function handleImportApp(importedApp: LowCodeApp) {
  appSchema.value = withEditorDefaults({
    ...importedApp,
    id: props.appId
  })
  selectedNodeId.value = currentPage.value?.layout.id || null
  toolbarStatus.value = "已导入，点击保存后持久化"
  refreshPageVersions()
}

function findNodeById(node: ComponentNode, nodeId: string): ComponentNode | null {
  if (node.id === nodeId) {
    return node
  }

  for (const child of node.children || []) {
    const result = findNodeById(child, nodeId)

    if (result) {
      return result
    }
  }

  return null
}

function updateNodeBinding(node: ComponentNode, nodeId: string, binding: DataBinding): ComponentNode {
  if (node.id === nodeId) {
    const bindings = node.bindings || []
    const nextBindings = bindings.filter((item) =>
      !(item.target === binding.target && item.targetKey === binding.targetKey)
    )

    return {
      ...node,
      bindings: [
        ...nextBindings,
        binding
      ]
    }
  }

  if (!node.children?.length) {
    return node
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeBinding(child, nodeId, binding))
  }
}

function updateNodeEvents(node: ComponentNode, nodeId: string, events: EventConfig[]): ComponentNode {
  if (node.id === nodeId) {
    return {
      ...node,
      events
    }
  }

  if (!node.children?.length) {
    return node
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeEvents(child, nodeId, events))
  }
}

function updateNodeProps(node: ComponentNode, nodeId: string, key: string, value: unknown): ComponentNode {
  if (node.id === nodeId) {
    return {
      ...node,
      props: {
        ...(node.props || {}),
        [key]: value
      }
    }
  }

  if (!node.children?.length) {
    return node
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeProps(child, nodeId, key, value))
  }
}

watch(
  () => props.appId,
  () => {
    loadCurrentApp()
  }
)

onMounted(() => {
  unsubscribeFromPluginRegistry = subscribeToPluginRegistry(() => {
    pluginRegistryVersion.value += 1
  })

  loadCurrentApp()
})

onBeforeUnmount(() => {
  unsubscribeFromPluginRegistry?.()
})
</script>

<template>
  <div class="aoi-page building-editor-page">
    <BuilderShell
      :title="`Building Editor · ${appId}`"
      description="低代码编辑器骨架：当前支持多应用、多页面、本地保存、版本快照和预览，不支持拖拽、权限或发布。"
    >
      <template #toolbar>
        <Toolbar
          :components-to="componentsTo"
          :preview-to="previewTo"
          :runtime-to="runtimeTo"
          :schema-visible="schemaViewerVisible"
          :status="toolbarStatus"
          @save="handleSaveSchema"
          @toggle-schema="toggleSchemaViewer"
        />
      </template>

      <template #resources>
        <PageManagerPanel
          :app-schema="appSchema"
          :apps="appSummaries"
          :current-page-id="currentPage?.id"
          @create-page="handleCreatePage"
          @select-page="handleSelectPage"
        />
        <ComponentPanel @add-component="handleAddComponent" />
        <PluginPanel />
        <ThemePanel
          :theme="currentPage?.theme"
          @update-theme="handleUpdateTheme"
        />
        <DataSourcePanel :data-sources="currentPage?.dataSources" />
      </template>

      <template #canvas>
        <Canvas
          v-if="currentPage"
          :key="`${pluginRegistryVersion}-${currentPage.id}`"
          :page-schema="currentPage"
          :selected-node-id="selectedNodeId"
          @select-node="handleSelectNode"
        />
      </template>

      <template #inspector>
        <PropertyPanel
          :component-meta="selectedComponentMeta"
          :data-sources="currentPage?.dataSources"
          :selected-node="selectedNode"
          @update-binding="handleUpdateNodeBinding"
          @update-events="handleUpdateNodeEvents"
          @update-prop="handleUpdateNodeProp"
        />
        <VersionPanel
          :page="currentPage"
          :versions="pageVersions"
          @restore-version="handleRestorePageVersion"
        />
        <PublishPanel
          :app-schema="appSchema"
          :current-page="currentPage"
          @import-app="handleImportApp"
        />
      </template>

      <template #footer>
        <SchemaViewer
          v-if="schemaViewerVisible"
          :app-schema="appSchema"
        />
      </template>
    </BuilderShell>
  </div>
</template>

<style scoped>
.building-editor-page {
  min-width: 0;
}
</style>
