import AoiIcon from "~/components/aoi/AoiIcon.vue"
import AoiLink from "~/components/aoi/AoiLink.vue"
import SettingsPageHeader from "~/components/settings/SettingsPageHeader.vue"
import SettingsPanel from "~/components/settings/SettingsPanel.vue"
import type { AoiComponentRegistry } from "~/types/lowcode"

export const aoiComponentRegistry: AoiComponentRegistry = {
  "native.div": {
    allowedProps: [],
    category: "native",
    component: "div",
    description: "Plain block container for grouping schema nodes.",
    label: "Div"
  },
  "native.span": {
    allowedProps: [],
    category: "native",
    component: "span",
    description: "Inline text container for small copy fragments.",
    label: "Span"
  },
  "native.strong": {
    allowedProps: [],
    category: "native",
    component: "strong",
    description: "Inline emphasis text.",
    label: "Strong"
  },
  "settings.pageHeader": {
    allowedProps: ["title", "description"],
    category: "settings",
    component: SettingsPageHeader,
    defaultProps: {
      description: "",
      title: "Page title"
    },
    description: "Settings page heading with optional description.",
    label: "Settings Page Header",
    propControls: [
      { control: "text", defaultValue: "Page title", key: "title", label: "Title" },
      { control: "text", defaultValue: "", key: "description", label: "Description" }
    ]
  },
  "settings.panel": {
    allowedProps: ["icon", "title", "description"],
    category: "settings",
    component: SettingsPanel,
    defaultProps: {
      icon: "blocks",
      title: "Panel"
    },
    description: "Settings page panel container.",
    label: "Settings Panel",
    propControls: [
      { control: "text", defaultValue: "Panel", key: "title", label: "Title" },
      { control: "text", key: "description", label: "Description" },
      { control: "icon", defaultValue: "blocks", key: "icon", label: "Icon" }
    ]
  },
  "aoi.icon": {
    allowedProps: ["name", "size", "decorative"],
    category: "aoi",
    component: AoiIcon,
    defaultProps: {
      decorative: true,
      name: "sparkles",
      size: 16
    },
    description: "Lucide icon rendered through the Aoi icon wrapper.",
    label: "Aoi Icon",
    propControls: [
      { control: "icon", defaultValue: "sparkles", key: "name", label: "Name" },
      { control: "number", defaultValue: 16, key: "size", label: "Size" },
      { control: "boolean", defaultValue: true, key: "decorative", label: "Decorative" }
    ]
  },
  "aoi.link": {
    allowedProps: ["to", "external", "target", "class"],
    category: "aoi",
    component: AoiLink,
    defaultProps: {
      to: "/"
    },
    description: "Aoi navigation or external link wrapper.",
    label: "Aoi Link",
    propControls: [
      { control: "route", defaultValue: "/", key: "to", label: "To" },
      { control: "boolean", defaultValue: false, key: "external", label: "External" },
      { control: "text", key: "target", label: "Target" }
    ]
  }
}
