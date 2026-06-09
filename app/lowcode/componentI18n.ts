import type { ComponentMeta, PropSchema } from "~/types/lowcode"

export type LowCodeTranslate = (key: string, params?: Record<string, unknown>) => string

function translateKey(t: LowCodeTranslate, key: string | undefined, fallback: string) {
  if (!key) {
    return fallback
  }

  const translated = t(key)

  return translated === key ? fallback : translated
}

export function translateComponentName(component: ComponentMeta, t: LowCodeTranslate) {
  return translateKey(t, component.nameKey, component.name)
}

export function translateComponentDescription(component: ComponentMeta, t: LowCodeTranslate) {
  return translateKey(t, component.descriptionKey, component.description || "")
}

export function translateComponentCategory(component: ComponentMeta, t: LowCodeTranslate) {
  return translateKey(t, component.categoryKey || `building.registry.categories.${component.category}`, component.category)
}

export function translatePropLabel(prop: PropSchema, t: LowCodeTranslate) {
  return translateKey(t, prop.labelKey, prop.label)
}

export function translatePropDescription(prop: PropSchema, t: LowCodeTranslate) {
  return translateKey(t, prop.descriptionKey, prop.description || "")
}

export function translatePropSchema(prop: PropSchema, t: LowCodeTranslate): PropSchema {
  return {
    ...prop,
    description: translatePropDescription(prop, t) || undefined,
    label: translatePropLabel(prop, t)
  }
}

export function translateComponentMeta(component: ComponentMeta, t: LowCodeTranslate): ComponentMeta {
  return {
    ...component,
    categoryKey: component.categoryKey || `building.registry.categories.${component.category}`,
    description: translateComponentDescription(component, t) || undefined,
    name: translateComponentName(component, t),
    propSchema: component.propSchema.map((prop) => translatePropSchema(prop, t))
  }
}
