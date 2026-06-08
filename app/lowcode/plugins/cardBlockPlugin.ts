import LowCodeCardBlock from "~/components/lowcode/LowCodeCardBlock.vue"
import type { PluginManifest } from "~/types/lowcode"

export const cardBlockPlugin = {
  contributionKinds: ["component"],
  contributions: {
    components: {
      cardBlock: {
        category: "layout",
        component: LowCodeCardBlock,
        defaultProps: {
          description: "A plugin-provided block component.",
          title: "Card Block"
        },
        name: "CardBlock",
        propSchema: [
          {
            defaultValue: "Card Block",
            key: "title",
            label: "Title",
            type: "string"
          },
          {
            defaultValue: "A plugin-provided block component.",
            key: "description",
            label: "Description",
            type: "string"
          }
        ],
        type: "cardBlock"
      }
    }
  },
  description: "Adds a local CardBlock component to the low-code editor.",
  enabledByDefault: true,
  id: "aoi.card-block",
  name: "Aoi Card Block",
  version: "0.1.0"
} satisfies PluginManifest
