<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import BuilderShell from "~/builder/BuilderShell.vue"
import Canvas from "~/builder/editor/Canvas.vue"
import ComponentPanel from "~/builder/editor/ComponentPanel.vue"
import DataSourcePanel from "~/builder/editor/DataSourcePanel.vue"
import NodeTreePanel from "~/builder/editor/NodeTreePanel.vue"
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
import { cloneLowCodeValue } from "~/lowcode/schemaModel"
import { getRegisteredComponent } from "~/lowcode/componentRegistry"
import { getDefaultDataSources } from "~/lowcode/dataSources/dataSourceRegistry"
import { subscribe as subscribeToPluginRegistry } from "~/lowcode/plugins/pluginRegistry"
import { getDefaultTheme, normalizeTheme } from "~/lowcode/themes/themeRegistry"
import type { ComponentMeta, ComponentNode, DataBinding, EventConfig, LowCodeApp, LowCodeAppSummary, LowCodePage, PageVersion, ThemeConfig } from "~/types/lowcode"

const props = defineProps<{
  appId: string
}>()

const { t } = useI18n()
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

function cloneDefaultDataSources() {
  return cloneLowCodeValue(getDefaultDataSources()) as LowCodePage["dataSources"]
}

function cloneDefaultTheme() {
  return cloneLowCodeValue(getDefaultTheme()) as ThemeConfig
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
  toolbarStatus.value = storedApp ? t("building.editor.status.restoredFromLocal") : ""
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
    children: meta.category === "layout" ? [] : undefined,
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
    const targetId = selectedNode.value && canAcceptChildNodes(selectedNode.value)
      ? selectedNode.value.id
      : page.layout.id

    return withLayout(page, insertNodeIntoTarget(page.layout, targetId, newNode))
  })
  selectedNodeId.value = newNode.id
}

function canAcceptChildNodes(node: ComponentNode) {
  const meta = getRegisteredComponent(node.type)

  return node.type === "container"
    || meta?.category === "layout"
    || Array.isArray(node.children)
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
  const pageNumber = appSchema.value.pages.length + 1
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
      description: t("building.editor.generatedPageDescription"),
      order: pageNumber
    },
    name: t("building.editor.generatedPageName", { number: pageNumber }),
    path: `/${slug}`,
    root: layout,
    theme: currentPage.value?.theme || cloneDefaultTheme(),
    title: t("building.editor.generatedPageTitle", { number: pageNumber })
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
        t("building.editor.status.versionLabel", { time: new Date().toLocaleString() })
      )
    : null
  const saved = saveLowCodeApp(appSchema.value)
  const versionSaved = !page || Boolean(version)

  toolbarStatus.value = saved && versionSaved
    ? t("building.editor.status.savedAt", { time: new Date().toLocaleTimeString() })
    : t("building.editor.status.saveFailed")
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

function handleUpdateDataSources(dataSources: LowCodePage["dataSources"]) {
  updateCurrentPage((page) => ({
    ...page,
    dataSources
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

function handleDeleteNode(nodeId: string) {
  if (!currentPage.value || currentPage.value.layout.id === nodeId) {
    return
  }

  updateCurrentPage((page) => withLayout(
    page,
    deleteNodeById(page.layout, nodeId)
  ))
  selectedNodeId.value = currentPage.value?.layout.id || null
}

function handleDuplicateNode(nodeId: string) {
  if (!currentPage.value || currentPage.value.layout.id === nodeId) {
    return
  }

  const duplicatedNode = findNodeById(currentPage.value.layout, nodeId)
  const duplicatedNodeId = duplicatedNode ? createNodeCopyId(duplicatedNode.id) : ""

  updateCurrentPage((page) => withLayout(
    page,
    duplicateNodeById(page.layout, nodeId, duplicatedNodeId)
  ))

  if (duplicatedNodeId) {
    selectedNodeId.value = duplicatedNodeId
  }
}

function handleMoveNode(nodeId: string, direction: "down" | "up") {
  if (!currentPage.value || currentPage.value.layout.id === nodeId) {
    return
  }

  updateCurrentPage((page) => withLayout(
    page,
    moveNodeById(page.layout, nodeId, direction)
  ))
  selectedNodeId.value = nodeId
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
  toolbarStatus.value = t("building.editor.status.versionRestored")
  refreshPageVersions(restoredPage.id)
}

function handleImportApp(importedApp: LowCodeApp) {
  appSchema.value = withEditorDefaults({
    ...importedApp,
    id: props.appId
  })
  selectedNodeId.value = currentPage.value?.layout.id || null
  toolbarStatus.value = t("building.editor.status.imported")
  refreshPageVersions()
}

function findNodeById(node: ComponentNode, nodeId: string): ComponentNode | null {
  if (node.id === nodeId) {
    return node
  }

  for (const child of getChildNodes(node)) {
    const result = findNodeById(child, nodeId)

    if (result) {
      return result
    }
  }

  return null
}

function getChildNodes(node: ComponentNode) {
  return [
    ...(node.children || []),
    ...Object.values(node.slots || {}).flat()
  ]
}

function mapNodeChildren(
  node: ComponentNode,
  mapper: (child: ComponentNode) => ComponentNode
): ComponentNode {
  return {
    ...node,
    children: node.children?.map(mapper),
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, slotNodes]) => [
            slotName,
            slotNodes.map(mapper)
          ])
        )
      : undefined
  }
}

function insertNodeIntoTarget(node: ComponentNode, targetId: string, newNode: ComponentNode): ComponentNode {
  if (node.id === targetId) {
    return {
      ...node,
      children: [
        ...(node.children || []),
        newNode
      ]
    }
  }

  return mapNodeChildren(node, (child) => insertNodeIntoTarget(child, targetId, newNode))
}

function deleteNodeById(node: ComponentNode, nodeId: string): ComponentNode {
  return {
    ...node,
    children: node.children
      ?.filter((child) => child.id !== nodeId)
      .map((child) => deleteNodeById(child, nodeId)),
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, slotNodes]) => [
            slotName,
            slotNodes
              .filter((child) => child.id !== nodeId)
              .map((child) => deleteNodeById(child, nodeId))
          ])
        )
      : undefined
  }
}

function createNodeCopyId(nodeId: string) {
  createdNodeSequence += 1

  return `${nodeId}-copy-${Date.now()}-${createdNodeSequence}`
}

function cloneNodeWithFreshIds(node: ComponentNode, rootId?: string): ComponentNode {
  const nextId = rootId || createNodeCopyId(node.id)

  return {
    ...cloneLowCodeValue(node),
    children: node.children?.map((child) => cloneNodeWithFreshIds(child)),
    id: nextId,
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, slotNodes]) => [
            slotName,
            slotNodes.map((child) => cloneNodeWithFreshIds(child))
          ])
        )
      : undefined
  }
}

function duplicateNodeInList(nodes: ComponentNode[] | undefined, nodeId: string, duplicateRootId: string) {
  if (!nodes?.length) {
    return nodes
  }

  const nextNodes: ComponentNode[] = []

  for (const node of nodes) {
    nextNodes.push(duplicateNodeById(node, nodeId, duplicateRootId))

    if (node.id === nodeId) {
      nextNodes.push(cloneNodeWithFreshIds(node, duplicateRootId))
    }
  }

  return nextNodes
}

function duplicateNodeById(node: ComponentNode, nodeId: string, duplicateRootId: string): ComponentNode {
  return {
    ...node,
    children: duplicateNodeInList(node.children, nodeId, duplicateRootId),
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, slotNodes]) => [
            slotName,
            duplicateNodeInList(slotNodes, nodeId, duplicateRootId) || []
          ])
        )
      : undefined
  }
}

function moveNodeInList(nodes: ComponentNode[] | undefined, nodeId: string, direction: "down" | "up") {
  if (!nodes?.length) {
    return nodes
  }

  const index = nodes.findIndex((node) => node.id === nodeId)

  if (index >= 0) {
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= nodes.length) {
      return nodes
    }

    const nextNodes = [...nodes]
    const currentNode = nextNodes[index]
    const targetNode = nextNodes[targetIndex]

    if (!currentNode || !targetNode) {
      return nodes
    }

    nextNodes[index] = targetNode
    nextNodes[targetIndex] = currentNode
    return nextNodes
  }

  return nodes.map((node) => moveNodeById(node, nodeId, direction))
}

function moveNodeById(node: ComponentNode, nodeId: string, direction: "down" | "up"): ComponentNode {
  return {
    ...node,
    children: moveNodeInList(node.children, nodeId, direction),
    slots: node.slots
      ? Object.fromEntries(
          Object.entries(node.slots).map(([slotName, slotNodes]) => [
            slotName,
            moveNodeInList(slotNodes, nodeId, direction) || []
          ])
        )
      : undefined
  }
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

  return mapNodeChildren(node, (child) => updateNodeBinding(child, nodeId, binding))
}

function updateNodeEvents(node: ComponentNode, nodeId: string, events: EventConfig[]): ComponentNode {
  if (node.id === nodeId) {
    return {
      ...node,
      events
    }
  }

  return mapNodeChildren(node, (child) => updateNodeEvents(child, nodeId, events))
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

  return mapNodeChildren(node, (child) => updateNodeProps(child, nodeId, key, value))
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
      :title="t('building.editor.title', { appId })"
      :description="t('building.editor.description')"
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
        <NodeTreePanel
          :page-schema="currentPage"
          :selected-node-id="selectedNodeId"
          @delete-node="handleDeleteNode"
          @duplicate-node="handleDuplicateNode"
          @move-node-down="handleMoveNode($event, 'down')"
          @move-node-up="handleMoveNode($event, 'up')"
          @select-node="handleSelectNode"
        />
        <ComponentPanel @add-component="handleAddComponent" />
        <PluginPanel />
        <ThemePanel
          :theme="currentPage?.theme"
          @update-theme="handleUpdateTheme"
        />
        <DataSourcePanel
          :data-sources="currentPage?.dataSources"
          @update-data-sources="handleUpdateDataSources"
        />
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
