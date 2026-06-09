import AoiButton from "~/components/aoi/AoiButton.vue"
import AoiIcon from "~/components/aoi/AoiIcon.vue"
import AoiLazyImage from "~/components/aoi/AoiLazyImage.vue"
import AoiLink from "~/components/aoi/AoiLink.vue"
import LowCodeListBlock from "~/components/lowcode/LowCodeListBlock.vue"
import { getComponents as getPluginComponents } from "~/lowcode/plugins/pluginRegistry"
import SettingsPageHeader from "~/components/settings/SettingsPageHeader.vue"
import SettingsPanel from "~/components/settings/SettingsPanel.vue"
import type { AoiComponentRegistry, ComponentRegistry } from "~/types/lowcode"

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

export const componentRegistry: ComponentRegistry = {
  text: {
    category: "basic",
    component: "span",
    defaultProps: {
      text: "Text"
    },
    name: "Text",
    nameKey: "building.registry.components.text.name",
    propSchema: [
      {
        defaultValue: "Text",
        key: "text",
        label: "Text",
        labelKey: "building.registry.props.text",
        type: "string"
      }
    ],
    type: "text"
  },
  button: {
    category: "action",
    component: AoiButton,
    defaultProps: {
      label: "Button",
      size: "md",
      variant: "filled"
    },
    name: "Button",
    nameKey: "building.registry.components.button.name",
    propSchema: [
      {
        defaultValue: "Button",
        key: "label",
        label: "Label",
        labelKey: "building.registry.props.label",
        type: "string"
      },
      {
        defaultValue: "filled",
        key: "variant",
        label: "Variant",
        labelKey: "building.registry.props.variant",
        options: ["filled", "tonal", "outlined", "text", "elevated"],
        type: "select"
      },
      {
        defaultValue: "md",
        key: "size",
        label: "Size",
        labelKey: "building.registry.props.size",
        options: ["sm", "md", "lg"],
        type: "select"
      },
      {
        defaultValue: false,
        key: "disabled",
        label: "Disabled",
        labelKey: "building.registry.props.disabled",
        type: "boolean"
      },
      {
        key: "icon",
        label: "Icon",
        labelKey: "building.registry.props.icon",
        type: "string"
      }
    ],
    type: "button"
  },
  container: {
    category: "layout",
    component: "div",
    defaultProps: {
      class: ""
    },
    name: "Container",
    nameKey: "building.registry.components.container.name",
    propSchema: [
      {
        defaultValue: "",
        description: "Optional CSS class applied by a future renderer.",
        descriptionKey: "building.registry.props.classDescription",
        key: "class",
        label: "Class",
        labelKey: "building.registry.props.class",
        type: "string"
      }
    ],
    type: "container"
  },
  image: {
    category: "media",
    component: AoiLazyImage,
    defaultProps: {
      alt: "",
      aspectRatio: "16 / 9",
      src: ""
    },
    name: "Image",
    nameKey: "building.registry.components.image.name",
    propSchema: [
      {
        defaultValue: "",
        key: "src",
        label: "Source",
        labelKey: "building.registry.props.source",
        type: "image"
      },
      {
        defaultValue: "",
        key: "alt",
        label: "Alt text",
        labelKey: "building.registry.props.altText",
        type: "string"
      },
      {
        defaultValue: "16 / 9",
        key: "aspectRatio",
        label: "Aspect ratio",
        labelKey: "building.registry.props.aspectRatio",
        type: "string"
      }
    ],
    type: "image"
  },
  listBlock: {
    category: "data",
    component: LowCodeListBlock,
    defaultProps: {
      emptyText: "No users",
      items: [],
      subtitleField: "email",
      titleField: "name"
    },
    name: "ListBlock",
    nameKey: "building.registry.components.listBlock.name",
    propSchema: [
      {
        defaultValue: [],
        description: "Array data usually provided by a DataBinding.",
        descriptionKey: "building.registry.props.itemsDescription",
        key: "items",
        label: "Items",
        labelKey: "building.registry.props.items",
        type: "array"
      },
      {
        defaultValue: "name",
        key: "titleField",
        label: "Title field",
        labelKey: "building.registry.props.titleField",
        type: "string"
      },
      {
        defaultValue: "email",
        key: "subtitleField",
        label: "Subtitle field",
        labelKey: "building.registry.props.subtitleField",
        type: "string"
      },
      {
        defaultValue: "No users",
        key: "emptyText",
        label: "Empty text",
        labelKey: "building.registry.props.emptyText",
        type: "string"
      }
    ],
    type: "listBlock"
  }
}

export function getComponentRegistry(): ComponentRegistry {
  return {
    ...getPluginComponents(),
    ...componentRegistry
  }
}

export function getRegisteredComponent(type: string) {
  return componentRegistry[type] || getPluginComponents()[type]
}
