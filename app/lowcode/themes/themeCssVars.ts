import type { ThemeConfig } from "~/types/lowcode"

export function toThemeCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--low-code-background": theme.colors.background,
    "--low-code-border": theme.colors.border,
    "--low-code-muted-text": theme.colors.mutedText,
    "--low-code-primary": theme.colors.primary,
    "--low-code-primary-text": theme.colors.primaryText,
    "--low-code-surface": theme.colors.surface,
    "--low-code-text": theme.colors.text,
    "--low-code-radius-lg": theme.radius.lg,
    "--low-code-radius-md": theme.radius.md,
    "--low-code-radius-pill": theme.radius.pill,
    "--low-code-radius-sm": theme.radius.sm,
    "--low-code-shadow-card": theme.shadows.card,
    "--low-code-shadow-focus": theme.shadows.focus,
    "--low-code-space-lg": theme.spacing.lg,
    "--low-code-space-md": theme.spacing.md,
    "--low-code-space-sm": theme.spacing.sm,
    "--low-code-space-xl": theme.spacing.xl,
    "--low-code-space-xs": theme.spacing.xs,
    "--low-code-font-family": theme.typography.fontFamily,
    "--low-code-font-size": theme.typography.fontSize,
    "--low-code-font-weight": theme.typography.fontWeight,
    "--low-code-heading-size": theme.typography.headingSize,
    "--low-code-line-height": theme.typography.lineHeight
  }
}
