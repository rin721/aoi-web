import { defineComponent, h, type PropType, type VNodeChild } from "vue"
import { aoiComponentRegistry } from "~/lowcode/componentRegistry"
import type { AoiSchemaNode } from "~/types/lowcode"

interface SchemaRenderContext {
  emitSelectNode?: (id: string) => void
  inspectMode: boolean
  selectedNodeId?: string
}

function pickAllowedProps(props: Record<string, unknown> | undefined, allowedProps: string[]) {
  const nextProps: Record<string, unknown> = {}

  if (!props) {
    return nextProps
  }

  allowedProps.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(props, key)) {
      nextProps[key] = props[key]
    }
  })

  return nextProps
}

function renderMissingComponent(componentKey: string) {
  if (!import.meta.dev) {
    return null
  }

  return h("div", {
    style: {
      border: "1px solid var(--aoi-danger)",
      borderRadius: "var(--aoi-radius-card)",
      color: "var(--aoi-danger)",
      padding: "10px"
    }
  }, `Unknown schema component: ${componentKey}`)
}

function renderSchemaNode(node: AoiSchemaNode, context: SchemaRenderContext): VNodeChild {
  if (node.kind === "text") {
    return node.text
  }

  const entry = aoiComponentRegistry[node.componentKey]

  if (!entry) {
    return renderMissingComponent(node.componentKey)
  }

  const props = pickAllowedProps(node.props, entry.allowedProps)
  const classes = [props.class, node.class]

  if (context.inspectMode) {
    classes.push(
      "aoi-schema-renderer-node",
      context.selectedNodeId === node.id ? "aoi-schema-renderer-node--selected" : undefined
    )
    props["data-aoi-schema-node-id"] = node.id
    props["data-aoi-schema-component-key"] = node.componentKey
    const selectCurrentNode = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      context.emitSelectNode?.(node.id)
    }

    if (node.componentKey === "aoi.link") {
      props.onClickCapture = selectCurrentNode
    } else {
      props.onClick = selectCurrentNode
    }
  }

  props.class = classes

  const slots: Record<string, () => VNodeChild[]> = {}

  if (node.children?.length) {
    slots.default = () => node.children?.map((child) => renderSchemaNode(child, context)) || []
  }

  Object.entries(node.slots || {}).forEach(([name, slotNodes]) => {
    slots[name] = () => slotNodes.map((child) => renderSchemaNode(child, context))
  })

  return h(entry.component, props, Object.keys(slots).length ? slots : undefined)
}

export default defineComponent({
  name: "AoiSchemaRenderer",
  emits: {
    "select-node": (id: string) => Boolean(id)
  },
  props: {
    inspectMode: {
      default: false,
      type: Boolean
    },
    node: {
      required: true,
      type: Object as PropType<AoiSchemaNode>
    },
    selectedNodeId: {
      default: undefined,
      type: String
    }
  },
  setup(props, { emit }) {
    return () => renderSchemaNode(props.node, {
      emitSelectNode: (id) => emit("select-node", id),
      inspectMode: props.inspectMode,
      selectedNodeId: props.selectedNodeId
    })
  }
})
