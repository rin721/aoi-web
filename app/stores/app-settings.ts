export const useAppSettingsStore = defineStore("app-settings", () => {
  const selectedCategory = ref("home")
  const preferredTheme = ref<"system" | "light" | "dark">("system")

  function setSelectedCategory(slug: string) {
    selectedCategory.value = slug
  }

  function setPreferredTheme(theme: "system" | "light" | "dark") {
    preferredTheme.value = theme
  }

  return {
    selectedCategory,
    preferredTheme,
    setPreferredTheme,
    setSelectedCategory
  }
})
