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

export type ApiDataSourceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiDataSourceResponseMapping {
  rootKey?: string
}

export interface ApiDataSourceConfig {
  body?: unknown
  headers?: Record<string, string>
  method: ApiDataSourceMethod
  params?: Record<string, string | number | boolean>
  responseMapping?: ApiDataSourceResponseMapping
  url: string
}

export type SQLiteFieldType = "text" | "integer" | "real" | "boolean" | "json"

export interface SQLiteFieldSchema {
  defaultValue?: unknown
  name: string
  primaryKey?: boolean
  required?: boolean
  type: SQLiteFieldType
  unique?: boolean
}

export interface SQLiteTableSchema {
  fields: SQLiteFieldSchema[]
  name: string
  seed?: DatabaseRecord[]
}

export interface SQLiteDataSourceConfig {
  adapter?: "memory" | "sqlite"
  databaseName?: string
  tables: SQLiteTableSchema[]
}

export type DatabaseRecord = Record<string, unknown>

export type DatabaseWhere = Record<string, unknown>

export interface DatabaseQueryOptions {
  limit?: number
  where?: DatabaseWhere
}

export interface DatabaseAdapter {
  connect: () => Promise<void>
  delete: (table: string, where?: DatabaseWhere) => Promise<number>
  initSchema: (tables: SQLiteTableSchema[]) => Promise<void>
  insert: (table: string, record: DatabaseRecord) => Promise<DatabaseRecord>
  query: (table: string, options?: DatabaseQueryOptions) => Promise<DatabaseRecord[]>
  update: (table: string, where: DatabaseWhere, patch: DatabaseRecord) => Promise<DatabaseRecord[]>
}

export type EventName = "onClick" | "onSubmit" | "onChange" | "onLoad"

export type ActionMessageTone = "info" | "success" | "warning" | "danger"

export type ActionConfig =
  | {
      id: string
      message: string
      tone?: ActionMessageTone
      type: "showToast"
    }
  | {
      id: string
      to: string
      type: "navigate"
    }
  | {
      id: string
      key: string
      type: "setVariable"
      value: unknown
    }
  | {
      dataSourceId: string
      id: string
      payload?: unknown
      type: "callApi"
    }

export interface EventConfig {
  actions: ActionConfig[]
  event: EventName
}

export interface ActionMessage {
  message: string
  tone?: ActionMessageTone
}

export interface ActionRunnerContext {
  dataSources?: DataSource[]
  navigate: (to: string) => Promise<unknown> | unknown
  setDataSourceValue: (sourceId: string, value: unknown) => void
  setVariable: (key: string, value: unknown) => void
  showMessage: (message: ActionMessage) => void
}

export type ActionExecutor<TAction extends ActionConfig = ActionConfig> = (
  action: TAction,
  context: ActionRunnerContext
) => Promise<void> | void

export type ActionRegistry = {
  [Type in ActionConfig["type"]]: ActionExecutor<Extract<ActionConfig, { type: Type }>>
}

export type DataSource =
  | {
      data?: unknown
      id: string
      name: string
      type: "mock"
    }
  | {
      config: ApiDataSourceConfig
      id: string
      name: string
      type: "api"
    }
  | {
      config: SQLiteDataSourceConfig
      id: string
      name: string
      type: "sqlite"
    }

export type ActionNode =
  | ActionConfig
  | {
      id: string
      key: string
      type: "setState"
      value: unknown
    }
  | {
      dataSourceId: string
      id: string
      params?: Record<string, unknown>
      type: "queryDb"
    }
  | {
      id: string
      input?: unknown
      type: "runWorkflow"
      workflowId: string
    }

export type EventAction = EventConfig

export interface ComponentNode {
  bindings?: DataBinding[]
  children?: ComponentNode[]
  events?: EventConfig[]
  id: string
  props?: ComponentProps
  slots?: Record<string, ComponentNode[]>
  style?: ComponentStyle
  type: string
}

export interface LowCodePageMeta {
  description?: string
  icon?: string
  order?: number
}

export interface LowCodePage {
  dataSources?: DataSource[]
  events?: EventConfig[]
  id: string
  layout: ComponentNode
  meta?: LowCodePageMeta
  name: string
  path: string
  root?: ComponentNode
  theme?: ThemeConfig
  title?: string
}

export interface PageVersion {
  createdAt: string
  id: string
  label: string
  pageId: string
  schema: LowCodePage
}

export interface PageVersionSummary {
  createdAt: string
  id: string
  label: string
  pageId: string
}

export interface ThemeColorTokens {
  background: string
  border: string
  mutedText: string
  primary: string
  primaryText: string
  surface: string
  text: string
}

export interface ThemeSpacingTokens {
  lg: string
  md: string
  sm: string
  xl: string
  xs: string
}

export interface ThemeRadiusTokens {
  lg: string
  md: string
  pill: string
  sm: string
}

export interface ThemeTypographyTokens {
  fontFamily: string
  fontSize: string
  fontWeight: string
  headingSize: string
  lineHeight: string
}

export interface ThemeShadowTokens {
  card: string
  focus: string
}

export interface ThemeConfig {
  colors: ThemeColorTokens
  id: string
  name: string
  radius: ThemeRadiusTokens
  shadows: ThemeShadowTokens
  spacing: ThemeSpacingTokens
  typography: ThemeTypographyTokens
}

export interface LowCodeApp {
  currentPageId?: string
  dataSources?: DataSource[]
  id: string
  meta?: LowCodeAppMeta
  name: string
  pages: LowCodePage[]
  schemaVersion: "lowcode.app.v1"
  theme?: ThemeConfig
}

export interface LowCodeAppMeta {
  description?: string
  icon?: string
}

export interface LowCodeAppSummary {
  currentPageId?: string
  id: string
  name: string
  pageCount: number
}

export type PluginContributionKind = "component" | "action" | "datasource" | "theme"

export type PropSchemaType = "array" | "string" | "number" | "boolean" | "select" | "image" | "route"

export interface PropSchema {
  defaultValue?: unknown
  description?: string
  key: string
  label: string
  options?: string[]
  required?: boolean
  type: PropSchemaType
}

export type ComponentMetaCategory = "basic" | "layout" | "media" | "action" | "data"

export interface ComponentMeta {
  category: ComponentMetaCategory
  component: string | Component
  defaultProps: ComponentProps
  name: string
  propSchema: PropSchema[]
  type: string
}

export type ComponentRegistry = Record<string, ComponentMeta>

export type PluginActionRegistry = Partial<ActionRegistry>

export interface PluginContributions {
  actions?: PluginActionRegistry
  components?: ComponentRegistry
  dataSources?: DataSource[]
  themes?: ThemeConfig[]
}

export interface PluginManifest {
  contributionKinds: PluginContributionKind[]
  contributions: PluginContributions
  description?: string
  enabledByDefault?: boolean
  id: string
  name: string
  version: string
}

export interface PluginSummary {
  contributionKinds: PluginContributionKind[]
  enabled: boolean
  id: string
  name: string
  version: string
}

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
