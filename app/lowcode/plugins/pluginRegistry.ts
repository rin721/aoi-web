import { cardBlockPlugin } from "~/lowcode/plugins/cardBlockPlugin"
import type {
  ActionRegistry,
  ComponentRegistry,
  DataSource,
  PluginManifest,
  PluginSummary,
  ThemeConfig
} from "~/types/lowcode"

interface RegisteredPlugin {
  enabled: boolean
  manifest: PluginManifest
}

type PluginListener = () => void

const pluginMap = new Map<string, RegisteredPlugin>()
const listeners = new Set<PluginListener>()
let registryVersion = 0

function emitChange() {
  registryVersion += 1

  for (const listener of listeners) {
    listener()
  }
}

function warnDuplicate(kind: string, key: string, pluginId: string) {
  if (!import.meta.dev) {
    return
  }

  console.warn(`[lowcode-plugin] Ignored duplicate ${kind} "${key}" from plugin "${pluginId}".`)
}

function enabledPlugins() {
  return Array.from(pluginMap.values()).filter((entry) => entry.enabled)
}

function toPluginSummary(entry: RegisteredPlugin): PluginSummary {
  return {
    contributionKinds: entry.manifest.contributionKinds,
    enabled: entry.enabled,
    id: entry.manifest.id,
    name: entry.manifest.name,
    version: entry.manifest.version
  }
}

export function registerPlugin(manifest: PluginManifest) {
  const existing = pluginMap.get(manifest.id)

  pluginMap.set(manifest.id, {
    enabled: existing?.enabled ?? manifest.enabledByDefault !== false,
    manifest
  })
  emitChange()
}

export function enablePlugin(pluginId: string) {
  const entry = pluginMap.get(pluginId)

  if (!entry || entry.enabled) {
    return
  }

  entry.enabled = true
  emitChange()
}

export function disablePlugin(pluginId: string) {
  const entry = pluginMap.get(pluginId)

  if (!entry || !entry.enabled) {
    return
  }

  entry.enabled = false
  emitChange()
}

export function isPluginEnabled(pluginId: string) {
  return Boolean(pluginMap.get(pluginId)?.enabled)
}

export function listPlugins() {
  return Array.from(pluginMap.values()).map(toPluginSummary)
}

export function subscribe(listener: PluginListener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getPluginRegistryVersion() {
  return registryVersion
}

export function getComponents(): ComponentRegistry {
  const components: ComponentRegistry = {}

  for (const entry of enabledPlugins()) {
    for (const [type, component] of Object.entries(entry.manifest.contributions.components || {})) {
      if (components[type]) {
        warnDuplicate("component", type, entry.manifest.id)
        continue
      }

      components[type] = component
    }
  }

  return components
}

export function getActions(): Partial<ActionRegistry> {
  const actions: Record<string, unknown> = {}

  for (const entry of enabledPlugins()) {
    for (const [type, action] of Object.entries(entry.manifest.contributions.actions || {})) {
      if (actions[type]) {
        warnDuplicate("action", type, entry.manifest.id)
        continue
      }

      actions[type] = action
    }
  }

  return actions as Partial<ActionRegistry>
}

export function getDataSources(): DataSource[] {
  const dataSources: DataSource[] = []
  const seenIds = new Set<string>()

  for (const entry of enabledPlugins()) {
    for (const dataSource of entry.manifest.contributions.dataSources || []) {
      if (seenIds.has(dataSource.id)) {
        warnDuplicate("datasource", dataSource.id, entry.manifest.id)
        continue
      }

      seenIds.add(dataSource.id)
      dataSources.push(dataSource)
    }
  }

  return dataSources
}

export function getThemes(): ThemeConfig[] {
  const themes: ThemeConfig[] = []
  const seenIds = new Set<string>()

  for (const entry of enabledPlugins()) {
    for (const theme of entry.manifest.contributions.themes || []) {
      if (seenIds.has(theme.id)) {
        warnDuplicate("theme", theme.id, entry.manifest.id)
        continue
      }

      seenIds.add(theme.id)
      themes.push(theme)
    }
  }

  return themes
}

registerPlugin(cardBlockPlugin)
