import type { AoiPageSchema } from "~/types/lowcode"

const links = [
  { description: "Nuxt documentation and community examples.", href: "https://nuxt.com/", label: "Nuxt" },
  { description: "Material Web components wrapped by Aoi.", href: "https://material-web.dev/", label: "Material Web" },
  { description: "Icon set used through @nuxt/icon.", href: "https://lucide.dev/", label: "Lucide" },
  { description: "Inspiration for the settings information architecture.", href: "https://kirakira.moe/settings/appearance", label: "KIRAKIRA Settings" }
]

export const settingsAcknowledgementSchema = {
  id: "settings-acknowledgement-preview",
  schemaVersion: "aoi.page.v1",
  title: "Acknowledgements",
  root: {
    id: "settings-acknowledgement-root",
    kind: "component",
    class: "settings-page",
    componentKey: "native.div",
    children: [
      {
        id: "settings-acknowledgement-header",
        kind: "component",
        componentKey: "settings.pageHeader",
        props: {
          description: "Tools, design references, and open-source ecosystems that help Aoi move faster.",
          title: "Acknowledgements"
        }
      },
      {
        id: "settings-acknowledgement-links-panel",
        kind: "component",
        componentKey: "settings.panel",
        props: {
          description: "These links open in a new tab.",
          icon: "heart-handshake",
          title: "Friendly links"
        },
        children: [
          {
            id: "settings-acknowledgement-links",
            kind: "component",
            class: "settings-link-list",
            componentKey: "native.div",
            children: links.map((item) => ({
              id: `settings-acknowledgement-link-${item.label.toLowerCase().replaceAll(" ", "-")}`,
              kind: "component",
              class: "settings-link-card",
              componentKey: "aoi.link",
              props: {
                external: true,
                target: "_blank",
                to: item.href
              },
              children: [
                {
                  id: `settings-acknowledgement-link-${item.label}-title`,
                  kind: "component",
                  componentKey: "native.strong",
                  children: [
                    {
                      id: `settings-acknowledgement-link-${item.label}-title-text`,
                      kind: "text",
                      text: item.label
                    }
                  ]
                },
                {
                  id: `settings-acknowledgement-link-${item.label}-description`,
                  kind: "component",
                  componentKey: "native.span",
                  children: [
                    {
                      id: `settings-acknowledgement-link-${item.label}-description-text`,
                      kind: "text",
                      text: item.description
                    }
                  ]
                },
                {
                  id: `settings-acknowledgement-link-${item.label}-icon`,
                  kind: "component",
                  componentKey: "aoi.icon",
                  props: {
                    decorative: true,
                    name: "external-link",
                    size: 16
                  }
                }
              ]
            }))
          }
        ]
      }
    ]
  }
} satisfies AoiPageSchema
