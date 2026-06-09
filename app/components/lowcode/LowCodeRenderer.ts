import { useRouter } from "#app"
import { defineComponent, h, onMounted, ref, watch, type PropType, type VNodeChild } from "vue"
import AoiStatusMessage from "~/components/aoi/AoiStatusMessage.vue"
import { getNodeEvent, runEventActions } from "~/lowcode/actions/actionRunner"
import { getRegisteredComponent } from "~/lowcode/componentRegistry"
import { executeApiDataSource } from "~/lowcode/dataSources/apiConnector"
import { createDatabaseAdapter } from "~/lowcode/dataSources/databaseAdapter"
import { resolveDataBindingValue } from "~/lowcode/dataSources/dataSourceRegistry"
import { toThemeCssVars } from "~/lowcode/themes/themeCssVars"
import { getDefaultTheme, normalizeTheme } from "~/lowcode/themes/themeRegistry"
import type { ActionMessage, ActionMessageTone, ComponentNode, ComponentProps, ComponentStyle, DataSource, EventConfig, EventName, ThemeConfig } from "~/types/lowcode"

type ApiDataSource = Extract<DataSource, { type: "api" }>
type SQLiteDataSource = Extract<DataSource, { type: "sqlite" }>

interface LowCodeRenderContext {
  actionsEnabled: boolean
  dataSources?: DataSource[]
  dataSourceValues?: Record<string, unknown>
  emitSelectNode?: (id: string) => void
  runNodeEvent?: (node: ComponentNode, eventName: EventName, event?: Event) => Promise<void>
  selectable: boolean
  selectedNodeId?: string
  theme: ThemeConfig
  translate?: (key: string, fallback: string, params?: Record<string, unknown>) => string
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

function applyDataBindings(
  props: Record<string, unknown>,
  node: ComponentNode,
  context: LowCodeRenderContext
) {
  for (const binding of node.bindings || []) {
    if (binding.target !== "props" || !binding.targetKey) {
      continue
    }

    const value = resolveDataBindingValue(binding, context.dataSources, context.dataSourceValues)

    if (value === undefined) {
      continue
    }

    props[binding.targetKey] = value
  }
}

function applyEventHandlers(
  props: Record<string, unknown>,
  node: ComponentNode,
  context: LowCodeRenderContext
) {
  if (!context.actionsEnabled) {
    return
  }

  const eventMap: Array<[EventName, string]> = [
    ["onClick", "onClick"],
    ["onSubmit", "onSubmit"],
    ["onChange", "onChange"]
  ]

  for (const [eventName, propName] of eventMap) {
    const eventConfig = getNodeEvent(node, eventName)

    if (!eventConfig) {
      continue
    }

    const previousHandler = props[propName]

    props[propName] = (event: Event) => {
      if (eventName === "onClick" || eventName === "onSubmit") {
        event.preventDefault()
        event.stopPropagation()
      }

      if (typeof previousHandler === "function") {
        previousHandler(event)
      }

      void context.runNodeEvent?.(node, eventName, event)
    }
  }
}

function appendClass(props: Record<string, unknown>, className: string) {
  props.class = [props.class, className].filter(Boolean)
}

function appendStyle(props: Record<string, unknown>, style: Record<string, string>) {
  props.style = props.style
    ? [style, props.style]
    : style
}

function applyThemeProps(
  props: Record<string, unknown>,
  node: ComponentNode
) {
  if (node.type === "text") {
    appendClass(props, "low-code-themed-text")
    appendStyle(props, {
      color: "var(--low-code-text)",
      fontFamily: "var(--low-code-font-family)",
      fontSize: "var(--low-code-font-size)",
      fontWeight: "var(--low-code-font-weight)",
      lineHeight: "var(--low-code-line-height)"
    })
    return
  }

  if (node.type === "container") {
    appendClass(props, "low-code-themed-container")
    appendStyle(props, {
      background: "var(--low-code-background)",
      border: "1px solid var(--low-code-border)",
      borderRadius: "var(--low-code-radius-lg)",
      boxShadow: "var(--low-code-shadow-card)",
      color: "var(--low-code-text)",
      padding: "var(--low-code-space-lg)"
    })
    return
  }

  if (node.type === "button") {
    appendClass(props, "low-code-themed-button")
    appendStyle(props, {
      "--md-elevated-button-container-color": "var(--low-code-surface)",
      "--md-elevated-button-label-text-color": "var(--low-code-primary)",
      "--md-filled-button-container-color": "var(--low-code-primary)",
      "--md-filled-button-label-text-color": "var(--low-code-primary-text)",
      "--md-filled-tonal-button-container-color": "var(--low-code-surface)",
      "--md-filled-tonal-button-label-text-color": "var(--low-code-primary)",
      "--md-outlined-button-label-text-color": "var(--low-code-primary)",
      "--md-outlined-button-outline-color": "var(--low-code-primary)",
      "--md-text-button-label-text-color": "var(--low-code-primary)"
    })
  }
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
  const children = node.children?.map((child) => renderNode(child, context)) || []
  const slotChildren = Object.values(node.slots || {})
    .flatMap((slotNodes) => slotNodes.map((child) => renderNode(child, context)))

  return [
    ...children,
    ...slotChildren
  ]
}

function getDefaultNodeChildren(node: ComponentNode, context: LowCodeRenderContext) {
  return node.children?.map((child) => renderNode(child, context)) || []
}

function getNodeSlots(node: ComponentNode, context: LowCodeRenderContext) {
  return Object.fromEntries(
    Object.entries(node.slots || {}).map(([slotName, slotNodes]) => [
      slotName,
      () => slotNodes.map((child) => renderNode(child, context))
    ])
  ) as Record<string, () => VNodeChild[]>
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
    context.translate?.(
      "building.validation.unknownComponent",
      `Unknown low-code component: ${node.type}`,
      { type: node.type }
    ) || `Unknown low-code component: ${node.type}`,
    ...getNodeChildren(node, context)
  ])
}

function resolveNodeContent(node: ComponentNode, props: Record<string, unknown>) {
  if (node.type === "text") {
    const text = props.text

    delete props.text

    return formatNodeContent(text)
  }

  if (node.type === "button") {
    const label = props.label

    delete props.label

    return formatNodeContent(label)
  }

  return undefined
}

function formatNodeContent(value: unknown) {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function getApiDataSources(dataSources?: DataSource[]): ApiDataSource[] {
  return (dataSources || []).filter((source): source is ApiDataSource => source.type === "api")
}

function getSQLiteDataSources(dataSources?: DataSource[]): SQLiteDataSource[] {
  return (dataSources || []).filter((source): source is SQLiteDataSource => source.type === "sqlite")
}

function toStatusMessageTone(tone: ActionMessageTone | undefined) {
  return tone === "danger" ? "error" : tone || "info"
}

export function renderNode(
  node: ComponentNode,
  context: LowCodeRenderContext = {
    actionsEnabled: true,
    selectable: false,
    theme: getDefaultTheme()
  }
): VNodeChild {
  const entry = getRegisteredComponent(node.type)

  if (!entry) {
    return renderUnknownNode(node, context)
  }

  const props = mergeNodeProps(entry.defaultProps, node)
  applyDataBindings(props, node, context)
  applyEventHandlers(props, node, context)
  applyThemeProps(props, node)
  applySelectableProps(props, node, context)
  const nodeContent = resolveNodeContent(node, props)
  const children = getDefaultNodeChildren(node, context)
  const renderedChildren = nodeContent !== undefined
    ? [nodeContent, ...children]
    : children
  const slots = getNodeSlots(node, context)
  const hasNamedSlots = Object.keys(slots).length > 0

  if (!renderedChildren.length && !hasNamedSlots) {
    return h(entry.component, props)
  }

  if (typeof entry.component === "string") {
    return h(entry.component, props, [
      ...renderedChildren,
      ...Object.values(slots).flatMap((slot) => slot())
    ])
  }

  return h(entry.component, props, {
    ...(renderedChildren.length ? { default: () => renderedChildren } : {}),
    ...slots
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
    dataSources: {
      default: undefined,
      type: Array as PropType<DataSource[]>
    },
    theme: {
      default: undefined,
      type: Object as PropType<ThemeConfig>
    },
    pageEvents: {
      default: undefined,
      type: Array as PropType<EventConfig[]>
    },
    actionsEnabled: {
      default: true,
      type: Boolean
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
    const actionMessage = ref<ActionMessage | null>(null)
    const dataSourceValues = ref<Record<string, unknown>>({})
    const variables = ref<Record<string, unknown>>({})
    const router = useRouter()
    const { t } = useI18n()
    let requestSequence = 0

    function translate(key: string, fallback: string, params?: Record<string, unknown>) {
      const translated = params ? t(key, params) : t(key)

      return translated === key ? fallback : translated
    }

    function setDataSourceValue(sourceId: string, value: unknown) {
      dataSourceValues.value = {
        ...dataSourceValues.value,
        [sourceId]: value
      }
    }

    function setVariable(key: string, value: unknown) {
      variables.value = {
        ...variables.value,
        [key]: value
      }
    }

    function showMessage(message: ActionMessage) {
      actionMessage.value = message
    }

    async function runNodeEvent(node: ComponentNode, eventName: EventName) {
      if (!props.actionsEnabled) {
        return
      }

      await runEventActions(getNodeEvent(node, eventName), {
        dataSources: props.dataSources,
        navigate: (to) => router.push(to),
        setDataSourceValue,
        setVariable,
        showMessage,
        translate
      })
    }

    async function runLoadEvents() {
      if (!props.actionsEnabled) {
        return
      }

      const pageLoadEvent = props.pageEvents?.find((eventConfig) => eventConfig.event === "onLoad")

      await runEventActions(pageLoadEvent, {
        dataSources: props.dataSources,
        navigate: (to) => router.push(to),
        setDataSourceValue,
        setVariable,
        showMessage,
        translate
      })
      await runNodeEvent(props.node, "onLoad")
    }

    async function querySQLiteDataSource(source: SQLiteDataSource) {
      const adapter = createDatabaseAdapter(source)
      const value: Record<string, unknown> = {}

      await adapter.connect()

      for (const table of source.config.tables) {
        value[table.name] = await adapter.query(table.name)
      }

      return value
    }

    async function loadRuntimeDataSources() {
      const apiSources = getApiDataSources(props.dataSources)
      const sqliteSources = getSQLiteDataSources(props.dataSources)

      if (!import.meta.client || (!apiSources.length && !sqliteSources.length)) {
        dataSourceValues.value = {}
        return
      }

      requestSequence += 1
      const currentRequest = requestSequence
      const apiResults = await Promise.all(apiSources.map(async (source) => ({
        result: await executeApiDataSource(source),
        source
      })))
      const sqliteResults = await Promise.all(sqliteSources.map(async (source) => {
        try {
          return {
            result: {
              data: await querySQLiteDataSource(source),
              ok: true
            },
            source
          }
        } catch (error) {
          return {
            result: {
              error: error instanceof Error ? error.message : translate(
                "building.validation.sqliteQueryFailed",
                "SQLite query failed"
              ),
              ok: false
            },
            source
          }
        }
      }))

      if (currentRequest !== requestSequence) {
        return
      }

      const nextValues: Record<string, unknown> = {}

      for (const { result, source } of [
        ...apiResults,
        ...sqliteResults
      ]) {
        if (result.ok) {
          nextValues[source.id] = result.data
        }
      }

      dataSourceValues.value = nextValues
    }

    watch(
      () => props.dataSources,
      () => {
        void loadRuntimeDataSources()
      },
      { deep: true, immediate: true }
    )

    onMounted(() => {
      void runLoadEvents()
    })

    watch(
      () => [props.node.id, props.pageEvents],
      () => {
        void runLoadEvents()
      },
      { deep: true }
    )

    return () => {
      const theme = normalizeTheme(props.theme)
      const renderedNode = renderNode(props.node, {
        actionsEnabled: props.actionsEnabled,
        dataSources: props.dataSources,
        dataSourceValues: dataSourceValues.value,
        emitSelectNode: (id) => emit("select-node", id),
        runNodeEvent,
        selectable: props.selectable,
        selectedNodeId: props.selectedNodeId,
        theme,
        translate
      })
      const themedChildren = [
        props.actionsEnabled && actionMessage.value
          ? h(AoiStatusMessage, {
              message: actionMessage.value.message,
              tone: toStatusMessageTone(actionMessage.value.tone)
            })
          : null,
        renderedNode
      ]

      return h("div", {
        class: [
          "low-code-theme-provider",
          props.actionsEnabled ? "low-code-renderer-runtime" : undefined
        ],
        style: toThemeCssVars(theme)
      }, themedChildren)
    }
  }
})
