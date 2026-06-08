import { getActionRegistry } from "~/lowcode/actions/actionRegistry"
import type { ActionConfig, ActionRegistry, ActionRunnerContext, ComponentNode, EventConfig, EventName } from "~/types/lowcode"

export function getNodeEvent(node: ComponentNode, eventName: EventName) {
  return node.events?.find((eventConfig) => eventConfig.event === eventName) || null
}

export async function runAction(
  action: ActionConfig,
  context: ActionRunnerContext,
  registry: ActionRegistry = getActionRegistry()
) {
  const executor = registry[action.type]

  if (!executor) {
    context.showMessage({
      message: `Unsupported action: ${action.type}`,
      tone: "danger"
    })
    return
  }

  await executor(action as never, context)
}

export async function runEventActions(
  eventConfig: EventConfig | null | undefined,
  context: ActionRunnerContext,
  registry: ActionRegistry = getActionRegistry()
) {
  if (!eventConfig) {
    return
  }

  for (const action of eventConfig.actions) {
    await runAction(action, context, registry)
  }
}
