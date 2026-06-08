import assert from "node:assert/strict"
import test from "node:test"
import type { AoiActionFlowSchema, AoiRuntimeActionEvent } from "@aoi/protocol"
import {
  resolveActionPayload,
  runAoiActionFlow
} from "./index"

test("resolves action payload bindings from explicit event payloads", async () => {
  const flow: AoiActionFlowSchema = {
    steps: [{
      kind: "data.create",
      payload: {
        source: "manual"
      },
      payloadBindings: [
        { source: "event", from: "record" },
        { source: "state", from: "tenantId", to: "tenantId" },
        { source: "constant", to: "meta.origin", value: "form" }
      ],
      resourceId: "customersResource"
    }]
  }
  const event: AoiRuntimeActionEvent = {
    eventName: "submit",
    flow,
    nodeId: "customersForm",
    payload: {
      record: {
        name: "Aoi",
        status: "active"
      }
    }
  }
  const calls: Array<{ payload?: Record<string, unknown>, resourceId: string }> = []

  await runAoiActionFlow(flow, {
    create: (resourceId, payload) => {
      calls.push({ payload, resourceId })
    },
    state: {
      tenantId: "tenant_1"
    }
  }, event)

  assert.deepEqual(calls, [{
    payload: {
      meta: { origin: "form" },
      name: "Aoi",
      source: "manual",
      status: "active",
      tenantId: "tenant_1"
    },
    resourceId: "customersResource"
  }])
})

test("does not implicitly merge event data when payloadBindings are omitted", () => {
  const flow: AoiActionFlowSchema = {
    steps: [{
      kind: "data.create",
      payload: { source: "default" },
      resourceId: "customersResource"
    }]
  }

  assert.deepEqual(resolveActionPayload({ source: "default" }, undefined, {}, {
    eventName: "submit",
    flow,
    nodeId: "customersForm",
    payload: {
      record: { name: "Ignored" }
    }
  }), {
    source: "default"
  })
})
