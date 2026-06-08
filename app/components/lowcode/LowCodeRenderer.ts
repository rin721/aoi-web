import { defineComponent, h, type PropType, type VNodeChild } from "vue"
import { getRegisteredComponent } from "~/lowcode/componentRegistry"
import type { ComponentNode, ComponentProps, ComponentStyle } from "~/types/lowcode"

interface LowCodeRenderContext {
  emitSelectNode?: (id: string) => void
  selectable: boolean
  selectedNodeId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function toStyleVars(styleVars: ComponentStyle["styleVars"]) {
  if (!styleVars) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(styleVars).map(([key, value]) => [
      key.startsWith("--") ? key : `--${key}`,
      value
    ])
  )
}

function mergeNodeProps(defaultProps: ComponentProps, node: ComponentNode) {
  const props: Record<string, unknown> = {
    ...defaultProps,
    ...node.props
  }

  const classes = [props.class, node.style?.class].filter(Boolean)
  const styles = [
    isRecord(props.style) ? props.style : undefined,
    toStyleVars(node.style?.styleVars),
    node.style?.inline
  ].filter((style) => isRecord(style) && Object.keys(style).length)

  if (classes.length) {
    props.class = classes
  }

  if (styles.length) {
    props.style = styles
  }

  return props
}

function applySelectableProps(
  props: Record<string, unknown>,
  node: ComponentNode,
  context: LowCodeRenderContext
) {
  if (!context.selectable) {
    return
  }

  const classes = [
    props.class,
    "low-code-renderer-node",
    context.selectedNodeId === node.id ? "low-code-renderer-node--selected" : undefined
  ].filter(Boolean)
  const selectCurrentNode = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    context.emitSelectNode?.(node.id)
  }

  props.class = classes
  props["data-lowcode-node-id"] = node.id
  props["data-lowcode-node-type"] = node.type
  props.onClick = selectCurrentNode
}

function getNodeChildren(node: ComponentNode, context: LowCodeRenderContext) {
  return node.children?.map((child) => renderNode(child, context)) || []
}

function renderUnknownNode(node: ComponentNode, context: LowCodeRenderContext): VNodeChild {
  const props: Record<string, unknown> = {
    class: "low-code-renderer__unknown",
    style: {
      border: "1px solid var(--aoi-danger)",
      borderRadius: "var(--aoi-radius-card)",
      color: "var(--aoi-danger)",
      padding: "10px"
    }
  }

  applySelectableProps(props, node, context)

  return h("div", props, [
    `Unknown low-code component: ${node.type}`,
    ...getNodeChildren(node, context)
  ])
}

function resolveNodeContent(node: ComponentNode, props: Record<string, unknown>) {
  if (node.type === "text") {
    const text = props.text

    delete props.text

    return typeof text === "string" || typeof text === "number" ? String(text) : ""
  }

  if (node.type === "button") {
    const label = props.label

    delete props.label

    return typeof label === "string" || typeof label === "number" ? String(label) : ""
  }

  return undefined
}

export function renderNode(
  node: ComponentNode,
  context: LowCodeRenderContext = {
    selectable: false
  }
): VNodeChild {
  const entry = getRegisteredComponent(node.type)

  if (!entry) {
    return renderUnknownNode(node, context)
  }

  const props = mergeNodeProps(entry.defaultProps, node)
  applySelectableProps(props, node, context)
  const nodeContent = resolveNodeContent(node, props)
  const children = getNodeChildren(node, context)
  const renderedChildren = nodeContent !== undefined
    ? [nodeContent, ...children]
    : children

  if (!renderedChildren.length) {
    return h(entry.component, props)
  }

  if (typeof entry.component === "string") {
    return h(entry.component, props, renderedChildren)
  }

  return h(entry.component, props, {
    default: () => renderedChildren
  })
}

export default defineComponent({
  name: "LowCodeRenderer",
  emits: {
    "select-node": (id: string) => Boolean(id)
  },
  props: {
    node: {
      required: true,
      type: Object as PropType<ComponentNode>
    },
    selectable: {
      default: false,
      type: Boolean
    },
    selectedNodeId: {
      default: undefined,
      type: String
    }
  },
  setup(props, { emit }) {
    return () => renderNode(props.node, {
      emitSelectNode: (id) => emit("select-node", id),
      selectable: props.selectable,
      selectedNodeId: props.selectedNodeId
    })
  }
})
