import { defineComponent, h, reactive } from "vue"
import { createAoiMaterialComponentRegistry } from "@aoi/materials"
import type {
  AoiActionFlowSchema,
  AoiActionStepSchema,
  AoiDataResourceSchema,
  AoiModelSchema,
  AoiNodeSchema,
  AoiPageSchema,
  AoiSystemSchema
} from "@aoi/protocol"

export interface AoiRendererDataContext {
  [resourceId: string]: Array<Record<string, unknown>>
}

export interface AoiActionRuntimeContext {
  closeDialog?: (dialogId: string) => void | Promise<void>
  create?: (resourceId: string, payload?: Record<string, unknown>) => void | Promise<void>
  delete?: (resourceId: string, payload?: Record<string, unknown>) => void | Promise<void>
  navigate?: (to: string) => void | Promise<void>
  openDialog?: (dialogId: string) => void | Promise<void>
  query?: (resourceId: string, payload?: Record<string, unknown>) => void | Promise<void>
  setState?: (key: string, value: unknown) => void | Promise<void>
  toast?: (message: string, tone?: string) => void | Promise<void>
  update?: (resourceId: string, payload?: Record<string, unknown>) => void | Promise<void>
}

const builtinComponents = createAoiMaterialComponentRegistry()

function getResource(schema: AoiSystemSchema, resourceId: unknown): AoiDataResourceSchema | undefined {
  if (typeof resourceId !== "string") {
    return undefined
  }

  return schema.dataSources.flatMap((source) => source.resources).find((resource) => resource.id === resourceId)
}

function getModel(schema: AoiSystemSchema, modelId: unknown): AoiModelSchema | undefined {
  if (typeof modelId !== "string") {
    return undefined
  }

  return schema.dataSources.flatMap((source) => source.models).find((model) => model.id === modelId)
}

function resolveNodeModel(schema: AoiSystemSchema, node: AoiNodeSchema) {
  const directModel = getModel(schema, node.props.modelId)

  if (directModel) {
    return directModel
  }

  const resource = getResource(schema, node.props.resourceId)

  return resource ? getModel(schema, resource.modelId) : undefined
}

function renderNode(input: {
  dataContext: AoiRendererDataContext
  node: AoiNodeSchema
  schema: AoiSystemSchema
  selectNode?: (nodeId: string) => void
  selectedNodeId?: string
  emitAction: (flow: AoiActionFlowSchema) => void
}) {
  const component = builtinComponents[input.node.material as keyof typeof builtinComponents]

  if (!component) {
    return h("div", { class: "aoi-material-empty" }, `Unknown material: ${input.node.material}`)
  }

  const resourceId = typeof input.node.props.resourceId === "string" ? input.node.props.resourceId : ""
  const records = resourceId ? input.dataContext[resourceId] || [] : []
  const children = input.node.children || []
  const selected = input.node.id === input.selectedNodeId

  return h("div", {
    class: ["aoi-schema-node", selected ? "aoi-schema-node--selected" : ""],
    "data-node-id": input.node.id,
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      input.selectNode?.(input.node.id)
    }
  }, [
    h(component, {
      model: resolveNodeModel(input.schema, input.node),
      node: input.node,
      records,
      onAction: input.emitAction
    }, {
      default: () => children.map((child) => renderNode({ ...input, node: child }))
    })
  ])
}

export const AoiSchemaRenderer = defineComponent({
  emits: ["action", "selectNode"],
  name: "AoiSchemaRenderer",
  props: {
    dataContext: { default: () => ({}), type: Object as () => AoiRendererDataContext },
    page: { required: true, type: Object as () => AoiPageSchema },
    schema: { required: true, type: Object as () => AoiSystemSchema },
    selectedNodeId: { default: "", type: String }
  },
  setup(props, { emit }) {
    return () => h("div", {
      class: "aoi-schema-renderer",
      onClick: () => emit("selectNode", "")
    }, renderNode({
      dataContext: props.dataContext,
      emitAction: (flow) => emit("action", flow),
      node: props.page.root,
      schema: props.schema,
      selectedNodeId: props.selectedNodeId,
      selectNode: (nodeId) => emit("selectNode", nodeId)
    }))
  }
})

export function getAoiDefaultPage(schema: AoiSystemSchema) {
  return schema.pages[0] || null
}

export function getAoiPageById(schema: AoiSystemSchema, pageId: string) {
  return schema.pages.find((page) => page.id === pageId) || getAoiDefaultPage(schema)
}

export function getAoiPageResources(schema: AoiSystemSchema, page: AoiPageSchema) {
  const resources = new Set<string>()

  function visit(node: AoiNodeSchema) {
    const resourceId = node.props.resourceId

    if (typeof resourceId === "string" && resourceId) {
      resources.add(resourceId)
    }

    const childNodes = node.children || []

    childNodes.forEach(visit)
    Object.values(node.slots || {}).flat().forEach(visit)
  }

  visit(page.root)
  return Array.from(resources)
}

export function getAoiSchemaResource(schema: AoiSystemSchema, resourceId: string) {
  return getResource(schema, resourceId)
}

export function getAoiSchemaModel(schema: AoiSystemSchema, modelId: string) {
  return getModel(schema, modelId)
}

export function createAoiRuntimeState(page: AoiPageSchema) {
  return reactive({ ...page.state })
}

export async function runAoiActionFlow(flow: AoiActionFlowSchema, context: AoiActionRuntimeContext) {
  for (const step of flow.steps) {
    await runAoiActionStep(step, context)
  }
}

async function runAoiActionStep(step: AoiActionStepSchema, context: AoiActionRuntimeContext) {
  switch (step.kind) {
    case "navigate":
      await context.navigate?.(step.to)
      break
    case "setState":
      await context.setState?.(step.key, step.value)
      break
    case "data.query":
      await context.query?.(step.resourceId, step.payload)
      break
    case "data.create":
      await context.create?.(step.resourceId, step.payload)
      break
    case "data.update":
      await context.update?.(step.resourceId, step.payload)
      break
    case "data.delete":
      await context.delete?.(step.resourceId, step.payload)
      break
    case "openDialog":
      await context.openDialog?.(step.dialogId)
      break
    case "closeDialog":
      await context.closeDialog?.(step.dialogId)
      break
    case "toast":
      await context.toast?.(step.message, step.tone)
      break
  }
}
