import { getDefaultTheme } from "~/lowcode/themes/themeRegistry"
import {
  translateComponentCategory,
  translateComponentName,
  type LowCodeTranslate
} from "~/lowcode/componentI18n"
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

const fallbackTranslate: LowCodeTranslate = (key) => key

function translateWithFallback(
  t: LowCodeTranslate,
  key: string,
  fallback: string,
  params?: Record<string, unknown>
) {
  const translated = t(key, params)

  return translated === key ? fallback : translated
}

function toComponentCatalogItem(component: ComponentMeta, t: LowCodeTranslate): ComponentCatalogItem {
  const propCount = component.propSchema.length
  const category = translateComponentCategory(component, t)

  return {
    category,
    id: component.type,
    name: translateComponentName(component, t),
    propCount,
    summary: translateWithFallback(
      t,
      "building.catalog.itemSummary",
      `${component.type} · ${component.category} · ${propCount} props`,
      {
        category,
        count: propCount,
        type: component.type
      }
    ),
    type: component.type
  }
}

export function createBuilderComponentCatalogPageSchema(
  components: ComponentMeta[],
  translate: LowCodeTranslate = fallbackTranslate
): LowCodePage {
  const catalogItems = components
    .map((component) => toComponentCatalogItem(component, translate))
    .sort((left, right) => left.name.localeCompare(right.name))

  const layout: ComponentNode = {
    children: [
      {
        id: "builder-component-catalog-title",
        props: {
          text: translateWithFallback(translate, "building.catalog.schemaTitle", "Component Catalog")
        },
        type: "text"
      },
      {
        id: "builder-component-catalog-summary",
        props: {
          text: translateWithFallback(
            translate,
            "building.catalog.schemaSummary",
            `Current registry exposes ${catalogItems.length} low-code components. This page is rendered by LowCodeRenderer.`,
            { count: catalogItems.length }
          )
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
          emptyText: translateWithFallback(translate, "building.catalog.emptyText", "No components to display."),
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
        name: translateWithFallback(translate, "building.catalog.sourceName", "Builder Component Catalog"),
        type: "mock"
      }
    ],
    events: [],
    id: "builder-component-catalog",
    layout,
    meta: {
      description: translateWithFallback(
        translate,
        "building.catalog.metaDescription",
        "Read-only builder management page rendered from LowCodePage schema."
      ),
      order: 1
    },
    name: translateWithFallback(translate, "building.catalog.name", "Component Catalog"),
    path: "/components",
    root: layout,
    theme: getDefaultTheme(),
    title: translateWithFallback(translate, "building.catalog.schemaTitle", "Component Catalog")
  }
}
