export function useHomeFeed() {
  const api = useAoiApi()
  const settings = useAppSettingsStore()

  const selectedCategory = computed({
    get: () => settings.selectedCategory,
    set: (value: string) => settings.setSelectedCategory(value)
  })

  const { data, error, pending, refresh } = useAsyncData("home-feed", () => api.getHomePayload(), {
    default: () => ({
      categories: [],
      announcement: null,
      latest: {
        items: [],
        nextCursor: null
      }
    })
  })

  const categories = computed(() => data.value.categories)
  const announcement = computed(() => data.value.announcement)
  const videos = computed(() => {
    if (selectedCategory.value === "home") {
      return data.value.latest.items
    }

    return data.value.latest.items.filter((video) =>
      video.categories.some((category) => category.slug === selectedCategory.value)
    )
  })

  function selectCategory(slug: string) {
    selectedCategory.value = slug
  }

  return {
    announcement,
    categories,
    error,
    pending,
    refresh,
    selectCategory,
    selectedCategory,
    videos
  }
}
