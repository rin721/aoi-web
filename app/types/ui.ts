import type { AoiRevealDirectiveValue } from "~/utils/aoiReveal"

export type AoiLayoutMode = "stack" | "grid" | "inline" | "split"
export type AoiSurfaceTone = "default" | "accent" | "danger" | "muted"
export type AoiSurfaceKind = "plain" | "panel" | "card" | "state" | "code" | "toolbar"
export type AoiSurfacePadding = "none" | "sm" | "md" | "lg"
export type AoiContentGridGap = "normal" | "compact" | "video"
export type AoiInfoCardDensity = "default" | "compact"
export type AoiInfoCardLayout = "inline" | "stack"
export type AoiMetaPillTone = AoiSurfaceTone
export type AoiProgressBarTone = "accent" | "danger" | "muted"

export interface AoiStatItem {
  description?: string
  icon?: string
  label: string
  tone?: AoiSurfaceTone
  value: number | string
}

export interface AoiTagItem {
  external?: boolean
  href?: string
  icon?: string
  label: string
  target?: string
  to?: string
  value?: string
}

export type AoiRevealProp = AoiRevealDirectiveValue
