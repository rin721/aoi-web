import { getDefaultDataSources } from "~/lowcode/dataSources/dataSourceRegistry"
import { getDefaultTheme } from "~/lowcode/themes/themeRegistry"
import type { ComponentNode, LowCodeApp, LowCodePage } from "~/types/lowcode"

export const mockPageLayout: ComponentNode = {
  children: [
    {
      id: "mock-page-title",
      props: {
        text: "Schema rendered page"
      },
      type: "text"
    },
    {
      id: "mock-page-copy",
      props: {
        text: "This static page is rendered from ComponentNode schema through LowCodeRenderer."
      },
      type: "text"
    },
    {
      events: [
        {
          actions: [
            {
              id: "mock-page-action-toast",
              message: "Button action executed",
              tone: "success",
              type: "showToast"
            },
            {
              dataSourceId: "api-jsonplaceholder-users",
              id: "mock-page-action-call-api",
              type: "callApi"
            }
          ],
          event: "onClick"
        }
      ],
      id: "mock-page-action",
      props: {
        label: "Preview action",
        variant: "filled"
      },
      type: "button"
    },
    {
      events: [
        {
          actions: [
            {
              id: "mock-page-navigate-action",
              to: "/building",
              type: "navigate"
            }
          ],
          event: "onClick"
        }
      ],
      id: "mock-page-navigate",
      props: {
        label: "Open builder home",
        variant: "outlined"
      },
      type: "button"
    },
    {
      bindings: [
        {
          id: "mock-page-users-list-items-binding",
          path: "users",
          sourceId: "mock-users",
          target: "props",
          targetKey: "items"
        }
      ],
      id: "mock-page-users-list",
      props: {
        emptyText: "No mock users",
        subtitleField: "email",
        titleField: "name"
      },
      type: "listBlock"
    },
    {
      bindings: [
        {
          fallback: [],
          id: "mock-page-api-users-list-items-binding",
          path: "users",
          sourceId: "api-jsonplaceholder-users",
          target: "props",
          targetKey: "items"
        }
      ],
      id: "mock-page-api-users-list",
      props: {
        emptyText: "API users are unavailable",
        subtitleField: "email",
        titleField: "name"
      },
      type: "listBlock"
    },
    {
      children: [
        {
          id: "mock-page-unknown-child",
          props: {
            text: "The renderer keeps rendering children for unknown component types."
          },
          type: "text"
        }
      ],
      id: "mock-page-unknown-node",
      type: "unknown.demo"
    }
  ],
  id: "mock-page-root",
  props: {
    class: "low-code-mock-page"
  },
  style: {
    inline: {
      display: "grid",
      gap: "12px"
    }
  },
  type: "container"
}

export const mockPageSchema: LowCodePage = {
  dataSources: getDefaultDataSources(),
  events: [
    {
      actions: [
        {
          id: "mock-page-load-toast",
          message: "Page onLoad action executed",
          tone: "info",
          type: "showToast"
        }
      ],
      event: "onLoad"
    }
  ],
  id: "mock-page-home",
  layout: mockPageLayout,
  meta: {
    description: "Default mock page for the low-code editor.",
    order: 1
  },
  name: "Mock Home",
  path: "/mock-home",
  root: mockPageLayout,
  theme: getDefaultTheme(),
  title: "Mock Low-code Page"
}

export const mockLowCodeApp: LowCodeApp = {
  currentPageId: mockPageSchema.id,
  dataSources: getDefaultDataSources(),
  id: "mock-app",
  meta: {
    description: "Local starter app for the /building low-code workspace."
  },
  name: "Mock Low-code App",
  pages: [
    mockPageSchema
  ],
  schemaVersion: "lowcode.app.v1",
  theme: getDefaultTheme()
}
