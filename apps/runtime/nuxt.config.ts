export default defineNuxtConfig({
  compatibilityDate: "2026-06-03",
  devtools: { enabled: false },
  modules: ["@nuxt/icon"],
  css: ["~/assets/css/main.css"],
  icon: {
    provider: "server",
    fallbackToApi: false,
    serverBundle: {
      collections: ["lucide"]
    },
    clientBundle: {
      scan: true
    }
  }
})
