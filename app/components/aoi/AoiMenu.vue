<script setup lang="ts">
export interface AoiMenuItem {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  open?: boolean
  anchor?: string
  items?: AoiMenuItem[]
}>(), {
  open: false,
  anchor: undefined,
  items: () => []
})

const emit = defineEmits<{
  "update:open": [value: boolean]
  select: [value: string]
}>()

function select(item: AoiMenuItem) {
  if (item.disabled) {
    return
  }

  emit("select", item.value)
  emit("update:open", false)
}
</script>

<template>
  <md-menu
    :open="open || undefined"
    :anchor="anchor"
    @closed="emit('update:open', false)"
  >
    <md-menu-item
      v-for="item in items"
      :key="item.value"
      :disabled="item.disabled || undefined"
      @click="select(item)"
    >
      <AoiIcon v-if="item.icon" slot="start" :name="item.icon" decorative />
      <div slot="headline">{{ item.label }}</div>
    </md-menu-item>
    <slot />
  </md-menu>
</template>
