import type { Component } from "vue"

export type AoiSchemaNode =
  | {
      id: string
      kind: "text"
      text: string
    }
  | {
      id: string
      kind: "component"
      class?: string
      children?: AoiSchemaNode[]
      componentKey: string
      props?: Record<string, unknown>
      slots?: Record<string, AoiSchemaNode[]>
    }

export interface AoiPageSchema {
  id: string
  root: AoiSchemaNode
  schemaVersion: "aoi.page.v1"
  title: string
}

export type ComponentProps = Record<string, unknown>

export interface ComponentStyle {
  class?: string
  inline?: Record<string, string | number>
  styleVars?: Record<string, string | number>
}

export interface DataBinding {
  fallback?: unknown
  id: string
  path: string
  sourceId: string
  target: "props" | "style" | "visibility" | "children"
  targetKey?: string
}

export type DataSource =
  | {
      data?: unknown
      id: string
      name: string
      type: "mock"
    }
  | {
      headers?: Record<string, string>
      id: string
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
      name: string
      type: "api"
      url: string
    }
  | {
      id: string
      name: string
      query?: string
      table?: string
      type: "sqlite"
    }

export type ActionNode =
  | {
      id: string
      to: string
      type: "navigate"
    }
  | {
      id: string
      key: string
      type: "setState"
      value: unknown
    }
  | {
      dataSourceId: string
      id: string
      payload?: unknown
      type: "callApi"
    }
  | {
      dataSourceId: string
      id: string
      params?: Record<string, unknown>
      type: "queryDb"
    }
  | {
      id: string
      message: string
      tone?: "info" | "success" | "warning" | "danger"
      type: "showToast"
    }
  | {
      id: string
      input?: unknown
      type: "runWorkflow"
      workflowId: string
    }

export interface EventAction {
  actions: ActionNode[]
  event: string
}

export interface ComponentNode {
  bindings?: DataBinding[]
  children?: ComponentNode[]
  events?: EventAction[]
  id: string
  props?: ComponentProps
  slots?: Record<string, ComponentNode[]>
  style?: ComponentStyle
  type: string
}

export interface LowCodePage {
  dataSources?: DataSource[]
  id: string
  name: string
  path: string
  root: ComponentNode
  title?: string
}

export interface ThemeConfig {
  id: string
  name: string
  tokens?: Record<string, string | number>
  variables?: Record<string, string | number>
}

export interface LowCodeApp {
  dataSources?: DataSource[]
  id: string
  name: string
  pages: LowCodePage[]
  schemaVersion: "lowcode.app.v1"
  theme?: ThemeConfig
}

export type PropSchemaType = "string" | "number" | "boolean" | "select" | "image" | "route"

export interface PropSchema {
  defaultValue?: unknown
  description?: string
  key: string
  label: string
  options?: string[]
  required?: boolean
  type: PropSchemaType
}

export type ComponentMetaCategory = "basic" | "layout" | "media" | "action"

export interface ComponentMeta {
  category: ComponentMetaCategory
  component: string | Component
  defaultProps: ComponentProps
  name: string
  propSchema: PropSchema[]
  type: string
}

export type ComponentRegistry = Record<string, ComponentMeta>

export type AoiMaterialCategory = "native" | "layout" | "settings" | "aoi"

export type AoiPropControlKind = "text" | "number" | "boolean" | "icon" | "route"

export interface AoiPropControl {
  control: AoiPropControlKind
  defaultValue?: unknown
  description?: string
  key: string
  label: string
}

export interface AoiComponentRegistryItem {
  allowedProps: string[]
  category: AoiMaterialCategory
  component: string | Component
  defaultProps?: Record<string, unknown>
  description?: string
  label: string
  propControls?: AoiPropControl[]
}

export type AoiComponentRegistry = Record<string, AoiComponentRegistryItem>
