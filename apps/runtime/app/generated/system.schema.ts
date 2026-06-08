import type { AoiSystemSchema } from "@aoi/protocol"

export const generatedSystemSchema = {
  app: {
    description: "A neutral Aoi runtime template waiting for a compiled Schema.",
    name: "Aoi Runtime",
    slug: "aoi-runtime-template"
  },
  build: {
    defaultLocale: "zh-CN",
    target: "nuxt"
  },
  dataSources: [],
  id: "aoiRuntimeTemplate",
  materials: [],
  modules: [],
  pages: [],
  routes: [],
  version: "aoi.system.v1"
} satisfies AoiSystemSchema
