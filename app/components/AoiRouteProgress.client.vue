<script setup lang="ts">
import NProgress from "nprogress"

const settings = useAppSettingsStore()
const nuxtApp = useNuxtApp()

const nativeDuration = computed(() => Math.max(800, settings.routeProgressSpeedMs * 8))

let startTimeout: number | undefined
let stateTimeout: number | undefined

function clearStartTimeout() {
  if (startTimeout !== undefined) {
    window.clearTimeout(startTimeout)
    startTimeout = undefined
  }
}

function clearStateTimeout() {
  if (stateTimeout !== undefined) {
    window.clearTimeout(stateTimeout)
    stateTimeout = undefined
  }
}

function setProgressState(state: "idle" | "loading" | "done" | "error" | "disabled") {
  document.documentElement.dataset.aoiRouteProgressState = state
}

function configureNProgress() {
  NProgress.configure({
    easing: settings.routeProgressEasing,
    minimum: settings.routeProgressMinimum,
    showSpinner: settings.routeProgressShowSpinner,
    speed: settings.routeProgressSpeedMs,
    trickle: settings.routeProgressTrickle,
    trickleSpeed: settings.routeProgressTrickleSpeedMs
  })
}

function removeNProgress() {
  clearStartTimeout()
  clearStateTimeout()
  NProgress.remove()
  setProgressState(settings.routeProgressEnabled ? "idle" : "disabled")
}

function startNProgress() {
  if (!settings.routeProgressEnabled) {
    removeNProgress()
    return
  }

  clearStateTimeout()
  configureNProgress()
  setProgressState("loading")
  NProgress.start()
}

function startRouteProgress() {
  clearStartTimeout()

  if (!settings.routeProgressEnabled) {
    removeNProgress()
    return
  }

  configureNProgress()

  if (settings.routeProgressDelayMs <= 0) {
    startNProgress()
    return
  }

  startTimeout = window.setTimeout(startNProgress, settings.routeProgressDelayMs)
}

function finishRouteProgress(error = false) {
  clearStartTimeout()

  if (!settings.routeProgressEnabled) {
    removeNProgress()
    return
  }

  configureNProgress()
  setProgressState(error ? "error" : "done")

  if (NProgress.isStarted()) {
    NProgress.done()
  } else {
    NProgress.remove()
  }

  clearStateTimeout()
  stateTimeout = window.setTimeout(() => {
    if (document.documentElement.dataset.aoiRouteProgressState !== "loading") {
      setProgressState("idle")
    }
  }, settings.routeProgressSpeedMs + 120)
}

const unhookLoadingStart = nuxtApp.hook("page:loading:start", startRouteProgress)
const unhookLoadingEnd = nuxtApp.hook("page:loading:end", () => finishRouteProgress())
const unhookVueError = nuxtApp.hook("vue:error", () => finishRouteProgress(true))

watch(() => [
  settings.routeProgressDelayMs,
  settings.routeProgressEasing,
  settings.routeProgressEnabled,
  settings.routeProgressMinimum,
  settings.routeProgressShowSpinner,
  settings.routeProgressSpeedMs,
  settings.routeProgressTrickle,
  settings.routeProgressTrickleSpeedMs
], () => {
  configureNProgress()

  if (!settings.routeProgressEnabled) {
    removeNProgress()
  } else if (!NProgress.isStarted()) {
    setProgressState("idle")
  }
}, { immediate: true })

onBeforeUnmount(() => {
  unhookLoadingStart()
  unhookLoadingEnd()
  unhookVueError()
  removeNProgress()
})
</script>

<template>
  <NuxtLoadingIndicator
    class="aoi-route-progress-native"
    :color="false"
    :height="0"
    :throttle="settings.routeProgressDelayMs"
    :duration="nativeDuration"
    :hide-delay="0"
    :reset-delay="0"
  />
</template>
