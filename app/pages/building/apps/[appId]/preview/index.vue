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

useHead(() => ({
  title: `Building Preview - ${appId.value}`
}))
</script>

<template>
  <div class="aoi-page building-preview-page">
    <LowCodeRuntimeView :app-id="appId" />
  </div>
</template>

<style scoped>
.building-preview-page {
  min-width: 0;
}
</style>
