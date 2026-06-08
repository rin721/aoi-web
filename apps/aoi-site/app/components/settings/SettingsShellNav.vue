<script setup lang="ts">
interface SettingsShellItem {
  depth: "basic" | "all"
  icon: string
  label: string
  to: string
}

interface SettingsShellGroup {
  items: SettingsShellItem[]
  label: string
}

const props = defineProps<{
  activePath: string
  description: string
  depthItems: Array<{
    description?: string
    icon?: string
    label: string
    value: string
  }>
  depthLabel: string
  depthModelValue: string
  emptyText: string
  groups: SettingsShellGroup[]
  modelValue: string
  searchLabel: string
  searchPlaceholder: string
  title: string
}>()

const emit = defineEmits<{
  "update:depthModelValue": [value: string]
  "update:modelValue": [value: string]
}>()

const query = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value)
})
const depth = computed({
  get: () => props.depthModelValue,
  set: (value: string) => emit("update:depthModelValue", value)
})
</script>

<template>
  <aside
    v-aoi-scroll-native
    class="settings-shell-nav"
    aria-label="设置分类"
  >
    <div class="settings-shell-nav__intro">
      <span class="settings-shell-nav__mark" aria-hidden="true">
        <AoiIcon name="settings" :size="22" decorative />
      </span>
      <div>
        <h1>{{ props.title }}</h1>
        <p>{{ props.description }}</p>
      </div>
    </div>

    <AoiTextField
      v-model="query"
      class="settings-shell-nav__search-field"
      icon="search"
      :label="props.searchLabel"
      :placeholder="props.searchPlaceholder"
      variant="outlined"
      type="search"
    />

    <AoiSegmentedControl
      v-model="depth"
      class="settings-shell-nav__depth"
      :items="props.depthItems"
      :aria-label="props.depthLabel"
      :columns="2"
    />

    <nav class="settings-shell-nav__groups" aria-label="设置页面">
      <section
        v-for="group in props.groups"
        :key="group.label"
        class="settings-shell-nav__group"
      >
        <h2>{{ group.label }}</h2>
        <AoiLink
          v-for="item in group.items"
          :key="item.to"
          class="settings-shell-nav__item"
          :class="{ 'settings-shell-nav__item--active': props.activePath === item.to }"
          :to="item.to"
        >
          <AoiIcon :name="item.icon" :size="17" decorative />
          <span>{{ item.label }}</span>
        </AoiLink>
      </section>

      <p v-if="props.groups.length === 0" class="settings-shell-nav__empty">
        {{ props.emptyText }}
      </p>
    </nav>
  </aside>

  <div class="settings-shell-nav-mobile">
    <AoiSegmentedControl
      v-model="depth"
      class="settings-shell-nav__depth"
      :items="props.depthItems"
      :aria-label="props.depthLabel"
      :columns="2"
    />

    <nav v-aoi-scroll-native class="settings-shell-nav-mobile__items" aria-label="设置页面">
      <template
        v-for="group in props.groups"
        :key="group.label"
      >
        <AoiLink
          v-for="item in group.items"
          :key="item.to"
          class="settings-shell-nav__item"
          :class="{ 'settings-shell-nav__item--active': props.activePath === item.to }"
          :to="item.to"
        >
          <AoiIcon :name="item.icon" :size="17" decorative />
          <span>{{ item.label }}</span>
        </AoiLink>
      </template>

      <p v-if="props.groups.length === 0" class="settings-shell-nav__empty">
        {{ props.emptyText }}
      </p>
    </nav>
  </div>
</template>

<style scoped>
.settings-shell-nav {
  position: sticky;
  top: var(--aoi-settings-sticky-top);
  z-index: var(--aoi-z-sticky);
  display: grid;
  max-height: calc(100dvh - var(--aoi-settings-sticky-top) * 2);
  align-self: start;
  gap: var(--aoi-grid-gap-compact);
  overflow: auto;
  border: 1px solid var(--aoi-border);
  border-radius: var(--aoi-radius-container);
  background: var(--aoi-panel-bg);
  box-shadow: var(--aoi-shadow-sm);
  padding: var(--aoi-card-padding);
}

.settings-shell-nav__search-field {
  --md-filled-text-field-container-height: var(--aoi-control-height-md);
  --md-outlined-text-field-container-height: var(--aoi-control-height-md);
}

.settings-shell-nav__intro {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--aoi-grid-gap-compact);
  align-items: start;
}

.settings-shell-nav__mark {
  display: inline-grid;
  width: var(--aoi-settings-shell-mark-size);
  height: var(--aoi-settings-shell-mark-size);
  place-items: center;
  border-radius: var(--aoi-radius-round);
  background: var(--aoi-accent-10);
  color: var(--aoi-accent-60);
}

.settings-shell-nav__intro h1,
.settings-shell-nav__intro p,
.settings-shell-nav__group h2 {
  margin: 0;
}

.settings-shell-nav__intro h1 {
  font-size: var(--aoi-settings-shell-title-size);
  line-height: 1.1;
}

.settings-shell-nav__intro p,
.settings-shell-nav__empty {
  color: var(--aoi-text-muted);
  line-height: 1.7;
}

.settings-shell-nav__groups {
  display: grid;
  gap: var(--aoi-grid-gap);
}

.settings-shell-nav__depth :deep(.aoi-segmented__item) {
  min-height: var(--aoi-control-height-md);
}

.settings-shell-nav-mobile {
  display: none;
}

.settings-shell-nav__group {
  display: grid;
  gap: max(6px, calc(var(--aoi-grid-gap-compact) - 5px));
}

.settings-shell-nav__group h2 {
  color: var(--aoi-text-muted);
  font-size: 12px;
  font-weight: 780;
  letter-spacing: 0;
}

.settings-shell-nav__item {
  display: flex;
  min-height: var(--aoi-settings-nav-item-height);
  align-items: center;
  gap: var(--aoi-nav-group-gap);
  border-radius: var(--aoi-radius-choice);
  color: var(--aoi-text-muted);
  font-weight: 740;
  padding: var(--aoi-settings-nav-item-padding);
}

.settings-shell-nav__item:hover,
.settings-shell-nav__item--active {
  background: var(--aoi-state-hover);
  color: var(--aoi-active-color);
}

.settings-shell-nav__item--active {
  box-shadow: inset 3px 0 0 var(--aoi-active-color);
}

.settings-shell-nav__empty {
  margin: 0;
}

@media (max-width: 960px) {
  .settings-shell-nav {
    display: none;
  }

  .settings-shell-nav-mobile {
    position: sticky;
    top: calc(var(--aoi-mobile-header-height) + 8px);
    z-index: var(--aoi-z-sticky);
    display: grid;
    gap: var(--aoi-grid-gap-compact);
    border: 1px solid var(--aoi-border);
    border-radius: var(--aoi-radius-container);
    background: var(--aoi-panel-bg);
    box-shadow: var(--aoi-shadow-sm);
    padding: 8px;
  }

  .settings-shell-nav-mobile__items {
    display: flex;
    overflow-x: auto;
    gap: var(--aoi-grid-gap-compact);
  }

  .settings-shell-nav-mobile .settings-shell-nav__item {
    flex: 0 0 auto;
    box-shadow: none;
  }
}
</style>
