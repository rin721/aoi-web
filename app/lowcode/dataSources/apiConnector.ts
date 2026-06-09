import type { DataSource } from "~/types/lowcode"

type ApiDataSource = Extract<DataSource, { type: "api" }>

export interface ApiConnectorResult {
  data?: unknown
  error?: string
  ok: boolean
  status?: number
}

function applyResponseMapping(source: ApiDataSource, data: unknown) {
  const rootKey = source.config.responseMapping?.rootKey

  if (!rootKey) {
    return data
  }

  return {
    [rootKey]: data
  }
}

function createRequestUrl(source: ApiDataSource) {
  const sourceUrl = source.config.url.trim()
  const isRelativeUrl = sourceUrl.startsWith("/")
  const baseURL = import.meta.client ? window.location.origin : "http://localhost"
  const url = new URL(sourceUrl, baseURL)

  for (const [key, value] of Object.entries(source.config.params || {})) {
    url.searchParams.set(key, String(value))
  }

  return isRelativeUrl ? `${url.pathname}${url.search}` : url.toString()
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "API request failed"
}

export async function executeApiDataSource(source: ApiDataSource): Promise<ApiConnectorResult> {
  if (!source.config?.url) {
    return {
      error: "API data source is missing a URL.",
      ok: false
    }
  }

  if (source.config.method !== "GET") {
    return {
      error: "Only GET API data sources are supported in this stage.",
      ok: false
    }
  }

  try {
    const response = await fetch(createRequestUrl(source), {
      headers: source.config.headers,
      method: "GET"
    })
    const rawBody = await response.text()
    const parsedBody = rawBody ? JSON.parse(rawBody) : null

    if (!response.ok) {
      return {
        error: `API request failed with status ${response.status}.`,
        ok: false,
        status: response.status
      }
    }

    return {
      data: applyResponseMapping(source, parsedBody),
      ok: true,
      status: response.status
    }
  } catch (error) {
    return {
      error: getErrorMessage(error),
      ok: false
    }
  }
}
