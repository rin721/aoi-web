<script setup lang="ts">
import { computed } from "vue"
import BuildingWorkspace from "~/builder/BuildingWorkspace.vue"

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found"
  })
}

const route = useRoute()
const isNestedBuildingRoute = computed(() => !["/building", "/building/"].includes(route.path))

useHead({
  title: "/building - Aoi"
})
</script>

<template>
  <NuxtPage v-if="isNestedBuildingRoute" />
  <BuildingWorkspace v-else />
</template>
