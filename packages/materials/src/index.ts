import { defineComponent, h } from "vue"
import type {
  AoiActionFlowSchema,
  AoiMaterialManifest,
  AoiModelSchema,
  AoiNodeSchema
} from "@aoi/protocol"

export interface AoiMaterialRuntimeProps {
  model?: AoiModelSchema
  node: AoiNodeSchema
  records?: Array<Record<string, unknown>>
}

function textProp(node: AoiNodeSchema, key: string, fallback = "") {
  const value = node.props[key]

  return typeof value === "string" ? value : fallback
}

function boolProp(node: AoiNodeSchema, key: string, fallback = false) {
  const value = node.props[key]

  return typeof value === "boolean" ? value : fallback
}

function numberProp(node: AoiNodeSchema, key: string, fallback: number) {
  const value = node.props[key]

  return typeof value === "number" ? value : fallback
}

function emitNodeAction(emit: (event: "action", flow: AoiActionFlowSchema) => void, node: AoiNodeSchema, eventName: string) {
  const flow = node.events?.[eventName]

  if (flow) {
    emit("action", flow)
  }
}

export const aoiBuiltinMaterialManifests: AoiMaterialManifest[] = [
  {
    actions: [],
    category: "layout",
    dataInputs: [],
    description: "A responsive layout container that owns spacing and visual grouping.",
    events: [],
    icon: "layout-template",
    label: "Container",
    lifecycle: [],
    props: [
      { control: "select", defaultValue: "section", key: "as", label: "Tag", options: [{ label: "Section", value: "section" }, { label: "Div", value: "div" }] },
      { control: "select", defaultValue: "panel", key: "surface", label: "Surface", options: [{ label: "Plain", value: "plain" }, { label: "Panel", value: "panel" }, { label: "Card", value: "card" }] },
      { control: "text", defaultValue: "", key: "title", label: "Title" }
    ],
    registryScope: "system",
    styleVars: [{ defaultValue: "16px", name: "--aoi-material-gap" }],
    type: "aoi.layout.container",
    version: "0.1.0"
  },
  {
    actions: [],
    category: "display",
    dataInputs: [],
    description: "Text block for headings, labels, helper copy, and compact body content.",
    events: [],
    icon: "type",
    label: "Text",
    lifecycle: [],
    props: [
      { control: "textarea", defaultValue: "Text", key: "text", label: "Text" },
      { control: "select", defaultValue: "body", key: "variant", label: "Variant", options: [{ label: "Title", value: "title" }, { label: "Subtitle", value: "subtitle" }, { label: "Body", value: "body" }, { label: "Muted", value: "muted" }] }
    ],
    registryScope: "system",
    styleVars: [],
    type: "aoi.display.text",
    version: "0.1.0"
  },
  {
    actions: [{ description: "Runs the bound action flow.", name: "click" }],
    category: "action",
    dataInputs: [],
    description: "Button material that emits a configured action flow.",
    events: [{ description: "Fired when the button is activated.", name: "click" }],
    icon: "mouse-pointer-click",
    label: "Button",
    lifecycle: [],
    props: [
      { control: "text", defaultValue: "Run", key: "label", label: "Label" },
      { control: "select", defaultValue: "primary", key: "tone", label: "Tone", options: [{ label: "Primary", value: "primary" }, { label: "Neutral", value: "neutral" }, { label: "Danger", value: "danger" }] }
    ],
    registryScope: "system",
    styleVars: [],
    type: "aoi.action.button",
    version: "0.1.0"
  },
  {
    actions: [],
    category: "data",
    dataInputs: [{ description: "Records loaded from a data resource.", name: "records" }],
    description: "CRUD table that renders model fields from a data resource.",
    events: [],
    icon: "table-2",
    label: "Data Table",
    lifecycle: [{ description: "Runs before the table resource is queried.", name: "beforeQuery" }],
    props: [
      { control: "resource", key: "resourceId", label: "Resource", required: true },
      { control: "number", defaultValue: 8, key: "limit", label: "Limit" }
    ],
    registryScope: "system",
    styleVars: [],
    type: "aoi.data.table",
    version: "0.1.0"
  },
  {
    actions: [{ description: "Submits the form through a data action.", name: "submit" }],
    category: "form",
    dataInputs: [{ description: "The model used to generate fields.", name: "model" }],
    description: "Schema-driven form shell for CRUD model fields.",
    events: [{ description: "Fired when the form is submitted.", name: "submit" }],
    icon: "clipboard-list",
    label: "Form",
    lifecycle: [{ description: "Runs before form submission.", name: "beforeSubmit" }],
    props: [
      { control: "model", key: "modelId", label: "Model", required: true },
      { control: "text", defaultValue: "Submit", key: "submitLabel", label: "Submit label" }
    ],
    registryScope: "system",
    styleVars: [],
    type: "aoi.form.model",
    version: "0.1.0"
  },
  {
    actions: [],
    category: "feedback",
    dataInputs: [],
    description: "Status message for empty, success, warning, and error states.",
    events: [],
    icon: "circle-alert",
    label: "Status",
    lifecycle: [],
    props: [
      { control: "textarea", defaultValue: "Status message", key: "message", label: "Message" },
      { control: "select", defaultValue: "info", key: "tone", label: "Tone", options: [{ label: "Info", value: "info" }, { label: "Success", value: "success" }, { label: "Warning", value: "warning" }, { label: "Danger", value: "danger" }] }
    ],
    registryScope: "system",
    styleVars: [],
    type: "aoi.feedback.status",
    version: "0.1.0"
  },
  {
    actions: [],
    category: "composite",
    dataInputs: [],
    description: "Reserved protocol hook for future visual composite materials.",
    events: [],
    icon: "boxes",
    label: "Composite Placeholder",
    lifecycle: [],
    props: [],
    registryScope: "project",
    styleVars: [],
    type: "aoi.composite.placeholder",
    version: "0.1.0"
  }
]

export const aoiMaterialManifestByType = new Map(aoiBuiltinMaterialManifests.map((manifest) => [manifest.type, manifest]))

export const AoiLayoutContainer = defineComponent({
  name: "AoiLayoutContainer",
  props: {
    node: { required: true, type: Object as () => AoiNodeSchema }
  },
  setup(props, { slots }) {
    return () => {
      const as = textProp(props.node, "as", "section")
      const title = textProp(props.node, "title")
      const surface = textProp(props.node, "surface", "panel")

      return h(as, {
        class: ["aoi-material-container", `aoi-material-container--${surface}`]
      }, [
        title ? h("div", { class: "aoi-material-container__title" }, title) : null,
        h("div", { class: "aoi-material-container__body" }, slots.default?.())
      ])
    }
  }
})

export const AoiDisplayText = defineComponent({
  name: "AoiDisplayText",
  props: {
    node: { required: true, type: Object as () => AoiNodeSchema }
  },
  setup(props) {
    return () => {
      const variant = textProp(props.node, "variant", "body")
      const tag = variant === "title" ? "h2" : variant === "subtitle" ? "h3" : "p"

      return h(tag, { class: ["aoi-material-text", `aoi-material-text--${variant}`] }, textProp(props.node, "text", "Text"))
    }
  }
})

export const AoiActionButton = defineComponent({
  emits: ["action"],
  name: "AoiActionButton",
  props: {
    node: { required: true, type: Object as () => AoiNodeSchema }
  },
  setup(props, { emit }) {
    return () => h("button", {
      class: ["aoi-material-button", `aoi-material-button--${textProp(props.node, "tone", "primary")}`],
      type: "button",
      onClick: () => emitNodeAction(emit, props.node, "click")
    }, textProp(props.node, "label", "Run"))
  }
})

export const AoiDataTable = defineComponent({
  name: "AoiDataTable",
  props: {
    model: { required: false, type: Object as () => AoiModelSchema },
    node: { required: true, type: Object as () => AoiNodeSchema },
    records: { default: () => [], type: Array as () => Array<Record<string, unknown>> }
  },
  setup(props) {
    return () => {
      const fields = props.model?.fields || []
      const limit = numberProp(props.node, "limit", 8)
      const rows = props.records.slice(0, limit)

      if (!fields.length) {
        return h("div", { class: "aoi-material-empty" }, "No model fields are configured.")
      }

      return h("div", { class: "aoi-material-table-wrap" }, [
        h("table", { class: "aoi-material-table" }, [
          h("thead", [
            h("tr", fields.map((field) => h("th", { key: field.id }, field.label)))
          ]),
          h("tbody", rows.length
            ? rows.map((record, rowIndex) => h("tr", { key: String(record.id || rowIndex) }, fields.map((field) => h("td", { key: field.id }, String(record[field.id] ?? "")))))
            : [h("tr", [h("td", { colspan: fields.length }, "No records yet.")])])
        ])
      ])
    }
  }
})

export const AoiModelForm = defineComponent({
  emits: ["action"],
  name: "AoiModelForm",
  props: {
    model: { required: false, type: Object as () => AoiModelSchema },
    node: { required: true, type: Object as () => AoiNodeSchema }
  },
  setup(props, { emit }) {
    return () => h("form", {
      class: "aoi-material-form",
      onSubmit: (event: Event) => {
        event.preventDefault()
        emitNodeAction(emit, props.node, "submit")
      }
    }, [
      ...(props.model?.fields || []).filter((field) => field.id !== "id").map((field) => h("label", { class: "aoi-material-field", key: field.id }, [
        h("span", field.label),
        h("input", {
          name: field.id,
          placeholder: field.label,
          type: field.type === "number" || field.type === "integer" ? "number" : field.type === "datetime" ? "datetime-local" : "text"
        })
      ])),
      h("button", { class: "aoi-material-button aoi-material-button--primary", type: "submit" }, textProp(props.node, "submitLabel", "Submit"))
    ])
  }
})

export const AoiFeedbackStatus = defineComponent({
  name: "AoiFeedbackStatus",
  props: {
    node: { required: true, type: Object as () => AoiNodeSchema }
  },
  setup(props) {
    return () => h("div", {
      class: ["aoi-material-status", `aoi-material-status--${textProp(props.node, "tone", "info")}`]
    }, textProp(props.node, "message", "Status message"))
  }
})

export const AoiCompositePlaceholder = defineComponent({
  name: "AoiCompositePlaceholder",
  setup() {
    return () => h("div", { class: "aoi-material-empty" }, "Composite materials are reserved for the next stage.")
  }
})

export function createAoiMaterialComponentRegistry() {
  return {
    "aoi.action.button": AoiActionButton,
    "aoi.composite.placeholder": AoiCompositePlaceholder,
    "aoi.data.table": AoiDataTable,
    "aoi.display.text": AoiDisplayText,
    "aoi.feedback.status": AoiFeedbackStatus,
    "aoi.form.model": AoiModelForm,
    "aoi.layout.container": AoiLayoutContainer
  }
}

export function isAoiReadonlyMaterial(type: string) {
  return type === "aoi.display.text" || type === "aoi.feedback.status"
}
