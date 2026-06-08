<script setup lang="ts">
import BuildingWorkspace from "~/builder/BuildingWorkspace.vue"

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found"
  })
}

useHead({
  title: "/building - Aoi"
})
</script>

<template>
  <BuildingWorkspace />
</template>
