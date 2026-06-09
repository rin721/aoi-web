import { executeApiDataSource } from "~/lowcode/dataSources/apiConnector"
import { getActions as getPluginActions } from "~/lowcode/plugins/pluginRegistry"
import type { ActionRegistry, ActionRunnerContext, DataSource } from "~/types/lowcode"

type ApiDataSource = Extract<DataSource, { type: "api" }>

function findApiDataSource(dataSources: DataSource[] | undefined, dataSourceId: string) {
  return dataSources?.find((source): source is ApiDataSource =>
    source.type === "api" && source.id === dataSourceId
  )
}

function translate(
  context: ActionRunnerContext,
  key: string,
  fallback: string,
  params?: Record<string, unknown>
) {
  return context.translate?.(key, fallback, params) || fallback
}

export const coreActionRegistry = {
  async callApi(action, context) {
    const source = findApiDataSource(context.dataSources, action.dataSourceId)

    if (!source) {
      context.showMessage({
        message: translate(
          context,
          "building.validation.apiDataSourceNotFound",
          `API data source not found: ${action.dataSourceId}`,
          { id: action.dataSourceId }
        ),
        tone: "danger"
      })
      return
    }

    const result = await executeApiDataSource(source)

    if (!result.ok) {
      context.showMessage({
        message: result.error || translate(context, "building.validation.apiActionFailed", "API action failed"),
        tone: "danger"
      })
      return
    }

    context.setDataSourceValue(source.id, result.data)
    context.showMessage({
      message: translate(
        context,
        "building.actions.apiCompleted",
        `${source.name} completed`,
        { name: source.name }
      ),
      tone: "success"
    })
  },
  async navigate(action, context) {
    await context.navigate(action.to)
  },
  setVariable(action, context) {
    context.setVariable(action.key, action.value)
  },
  showToast(action, context) {
    context.showMessage({
      message: action.message,
      tone: action.tone || "info"
    })
  }
} satisfies ActionRegistry

export const actionRegistry = coreActionRegistry

export function getActionRegistry(): ActionRegistry {
  return {
    ...getPluginActions(),
    ...coreActionRegistry
  } as ActionRegistry
}
