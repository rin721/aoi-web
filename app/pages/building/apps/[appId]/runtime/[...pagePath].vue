<script setup lang="ts">
import { computed } from "vue"
import LowCodeRuntimeView from "~/components/lowcode/LowCodeRuntimeView.vue"

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found"
  })
}

const route = useRoute()
const appId = computed(() => {
  const value = route.params.appId

  if (Array.isArray(value)) {
    return value[0] || "mock-app"
  }

  return value || "mock-app"
})
const pagePath = computed(() => route.params.pagePath)

useHead(() => ({
  title: `Low-code Runtime - ${appId.value}`
}))
</script>

<template>
  <div class="aoi-page building-runtime-page">
    <LowCodeRuntimeView
      :app-id="appId"
      :page-path="pagePath"
    />
  </div>
</template>

<style scoped>
.building-runtime-page {
  min-width: 0;
}
</style>
