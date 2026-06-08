<script setup lang="ts">
const props = withDefaults(defineProps<{
  open?: boolean
}>(), {
  open: false
})

const emit = defineEmits<{
  "update:open": [value: boolean]
  closed: []
}>()

const layer = useAoiLayer("dialog", computed(() => props.open))

function onClosed() {
  emit("update:open", false)
  emit("closed")
}
</script>

<template>
  <md-dialog :open="props.open || undefined" :style="layer.style.value" @closed="onClosed">
    <div slot="headline">
      <slot name="headline" />
    </div>
    <form slot="content" method="dialog">
      <slot />
    </form>
    <div slot="actions">
      <slot name="actions" />
    </div>
  </md-dialog>
</template>
