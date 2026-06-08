<script setup lang="ts">
import { computed } from "vue"
import BuildingEditor from "~/builder/editor/BuildingEditor.vue"

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
  title: `Building Editor - ${appId.value}`
}))
</script>

<template>
  <BuildingEditor :app-id="appId" />
</template>
