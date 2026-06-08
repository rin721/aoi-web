import type { LowCodePage } from "~/types/lowcode"

export const mockPageSchema: LowCodePage = {
  id: "mock-page-home",
  name: "Mock Home",
  path: "/mock-home",
  root: {
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
        id: "mock-page-action",
        props: {
          label: "Preview action",
          variant: "filled"
        },
        type: "button"
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
  },
  title: "Mock Low-code Page"
}
