<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue"
import BuilderShell from "~/builder/BuilderShell.vue"
import Canvas from "~/builder/editor/Canvas.vue"
import ComponentPanel from "~/builder/editor/ComponentPanel.vue"
import PropertyPanel from "~/builder/editor/PropertyPanel.vue"
import SchemaViewer from "~/builder/editor/SchemaViewer.vue"
import Toolbar from "~/builder/editor/Toolbar.vue"
import {
  loadLowCodePageSchema,
  saveLowCodePageSchema
} from "~/builder/editor/schemaStorage"
import { componentRegistry } from "~/lowcode/componentRegistry"
import { mockPageSchema } from "~/lowcode/schemas/mockPageSchema"
import type { ComponentMeta, ComponentNode, LowCodePage } from "~/types/lowcode"

const props = defineProps<{
  appId: string
}>()

const pageSchema = ref<LowCodePage>(clonePageSchema(mockPageSchema))
const selectedNodeId = ref<string | null>(null)
const schemaViewerVisible = ref(false)
const toolbarStatus = ref("")
let createdNodeSequence = 0

const previewTo = computed(() => `/building/apps/${props.appId}/preview`)
const selectedNode = computed(() => {
  if (!selectedNodeId.value) {
    return null
  }

  return findNodeById(pageSchema.value.root, selectedNodeId.value)
})
const selectedComponentMeta = computed<ComponentMeta | null>(() => {
  if (!selectedNode.value) {
    return null
  }

  return componentRegistry[selectedNode.value.type] || null
})

function clonePageSchema(schema: LowCodePage) {
  return JSON.parse(JSON.stringify(schema)) as LowCodePage
}

function createComponentNode(type: string): ComponentNode | null {
  const meta = componentRegistry[type]

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

function handleAddComponent(type: string) {
  const newNode = createComponentNode(type)

  if (!newNode) {
    return
  }

  const root = pageSchema.value.root

  pageSchema.value = {
    ...pageSchema.value,
    root: {
      ...root,
      children: [
        ...(root.children || []),
        newNode
      ]
    }
  }
  selectedNodeId.value = newNode.id
}

function handleSelectNode(id: string) {
  selectedNodeId.value = id
}

function handleSaveSchema() {
  const saved = saveLowCodePageSchema(props.appId, pageSchema.value)

  toolbarStatus.value = saved
    ? `已保存 ${new Date().toLocaleTimeString()}`
    : "保存失败，请检查浏览器存储权限"
}

function toggleSchemaViewer() {
  schemaViewerVisible.value = !schemaViewerVisible.value
}

function restoreSavedSchema() {
  const restored = loadLowCodePageSchema(props.appId, mockPageSchema.id)

  if (!restored) {
    return false
  }

  pageSchema.value = restored
  toolbarStatus.value = "已从本地恢复"
  return true
}

function handleUpdateNodeProp(payload: { key: string, nodeId: string, value: unknown }) {
  pageSchema.value = {
    ...pageSchema.value,
    root: updateNodeProps(pageSchema.value.root, payload.nodeId, payload.key, payload.value)
  }
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

onMounted(() => {
  if (restoreSavedSchema()) {
    return
  }

  nextTick(() => {
    restoreSavedSchema()
  })
})
</script>

<template>
  <div class="aoi-page building-editor-page">
    <BuilderShell
      :title="`Building Editor · ${appId}`"
      description="低代码编辑器骨架：当前支持点击选中与基础 props 编辑，不支持拖拽、样式编辑或后端保存。"
    >
      <template #toolbar>
        <Toolbar
          :preview-to="previewTo"
          :schema-visible="schemaViewerVisible"
          :status="toolbarStatus"
          @save="handleSaveSchema"
          @toggle-schema="toggleSchemaViewer"
        />
      </template>

      <template #resources>
        <ComponentPanel @add-component="handleAddComponent" />
      </template>

      <template #canvas>
        <Canvas
          :page-schema="pageSchema"
          :selected-node-id="selectedNodeId"
          @select-node="handleSelectNode"
        />
      </template>

      <template #inspector>
        <PropertyPanel
          :component-meta="selectedComponentMeta"
          :selected-node="selectedNode"
          @update-prop="handleUpdateNodeProp"
        />
      </template>

      <template #footer>
        <SchemaViewer
          v-if="schemaViewerVisible"
          :page-schema="pageSchema"
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
