import { getDefaultTheme } from "~/lowcode/themes/themeRegistry"
import type { ComponentMeta, ComponentNode, LowCodePage } from "~/types/lowcode"

const COMPONENT_CATALOG_SOURCE_ID = "builder-component-catalog"

interface ComponentCatalogItem {
  category: string
  id: string
  name: string
  propCount: number
  summary: string
  type: string
}

function toComponentCatalogItem(component: ComponentMeta): ComponentCatalogItem {
  const propCount = component.propSchema.length

  return {
    category: component.category,
    id: component.type,
    name: component.name,
    propCount,
    summary: `${component.type} · ${component.category} · ${propCount} props`,
    type: component.type
  }
}

export function createBuilderComponentCatalogPageSchema(components: ComponentMeta[]): LowCodePage {
  const catalogItems = components
    .map(toComponentCatalogItem)
    .sort((left, right) => left.name.localeCompare(right.name))

  const layout: ComponentNode = {
    children: [
      {
        id: "builder-component-catalog-title",
        props: {
          text: "组件列表"
        },
        type: "text"
      },
      {
        id: "builder-component-catalog-summary",
        props: {
          text: `当前 registry 暴露 ${catalogItems.length} 个低代码组件。此页面主体由 LowCodeRenderer 渲染。`
        },
        type: "text"
      },
      {
        bindings: [
          {
            fallback: [],
            id: "builder-component-catalog-items-binding",
            path: "components",
            sourceId: COMPONENT_CATALOG_SOURCE_ID,
            target: "props",
            targetKey: "items"
          }
        ],
        id: "builder-component-catalog-list",
        props: {
          emptyText: "当前没有可展示的组件。",
          subtitleField: "summary",
          titleField: "name"
        },
        type: "listBlock"
      }
    ],
    id: "builder-component-catalog-root",
    props: {
      class: "builder-component-catalog"
    },
    style: {
      inline: {
        display: "grid",
        gap: "12px"
      }
    },
    type: "container"
  }

  return {
    dataSources: [
      {
        data: {
          components: catalogItems
        },
        id: COMPONENT_CATALOG_SOURCE_ID,
        name: "Builder Component Catalog",
        type: "mock"
      }
    ],
    events: [],
    id: "builder-component-catalog",
    layout,
    meta: {
      description: "Read-only builder management page rendered from LowCodePage schema.",
      order: 1
    },
    name: "Component Catalog",
    path: "/components",
    root: layout,
    theme: getDefaultTheme(),
    title: "组件列表"
  }
}
