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
