import { getThemes as getPluginThemes } from "~/lowcode/plugins/pluginRegistry"
import type { ThemeConfig } from "~/types/lowcode"

export const defaultTheme: ThemeConfig = {
  colors: {
    background: "#f8fafc",
    border: "#d8dee8",
    mutedText: "#64748b",
    primary: "#2563eb",
    primaryText: "#ffffff",
    surface: "#ffffff",
    text: "#0f172a"
  },
  id: "default",
  name: "Default",
  radius: {
    lg: "14px",
    md: "10px",
    pill: "999px",
    sm: "6px"
  },
  shadows: {
    card: "0 14px 36px rgba(15, 23, 42, 0.10)",
    focus: "0 0 0 3px rgba(37, 99, 235, 0.22)"
  },
  spacing: {
    lg: "20px",
    md: "14px",
    sm: "10px",
    xl: "28px",
    xs: "6px"
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: "15px",
    fontWeight: "500",
    headingSize: "22px",
    lineHeight: "1.6"
  }
}

export const softTheme: ThemeConfig = {
  colors: {
    background: "#fff7ed",
    border: "#fed7aa",
    mutedText: "#9a3412",
    primary: "#c2410c",
    primaryText: "#fff7ed",
    surface: "#fffbeb",
    text: "#431407"
  },
  id: "soft",
  name: "Soft",
  radius: {
    lg: "18px",
    md: "12px",
    pill: "999px",
    sm: "8px"
  },
  shadows: {
    card: "0 16px 34px rgba(154, 52, 18, 0.16)",
    focus: "0 0 0 3px rgba(194, 65, 12, 0.24)"
  },
  spacing: {
    lg: "24px",
    md: "16px",
    sm: "12px",
    xl: "32px",
    xs: "8px"
  },
  typography: {
    fontFamily: "Georgia, ui-serif, serif",
    fontSize: "16px",
    fontWeight: "520",
    headingSize: "24px",
    lineHeight: "1.65"
  }
}

export const coreThemes = [
  defaultTheme,
  softTheme
]

export function cloneTheme(theme: ThemeConfig) {
  return JSON.parse(JSON.stringify(theme)) as ThemeConfig
}

export function getThemes() {
  const coreIds = new Set(coreThemes.map((theme) => theme.id))
  const pluginThemes = getPluginThemes().filter((theme) => !coreIds.has(theme.id))

  return [
    ...coreThemes,
    ...pluginThemes
  ]
}

export function getThemeById(themeId: string) {
  return getThemes().find((theme) => theme.id === themeId) || null
}

export function getDefaultTheme() {
  return cloneTheme(defaultTheme)
}

export function normalizeTheme(theme?: Partial<ThemeConfig> | null): ThemeConfig {
  const fallback = getDefaultTheme()

  return {
    ...fallback,
    ...theme,
    colors: {
      ...fallback.colors,
      ...theme?.colors
    },
    radius: {
      ...fallback.radius,
      ...theme?.radius
    },
    shadows: {
      ...fallback.shadows,
      ...theme?.shadows
    },
    spacing: {
      ...fallback.spacing,
      ...theme?.spacing
    },
    typography: {
      ...fallback.typography,
      ...theme?.typography
    }
  }
}

export function getThemeOptions() {
  return getThemes().map((theme) => ({
    label: theme.name,
    value: theme.id
  }))
}
