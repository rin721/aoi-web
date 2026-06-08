import assert from "node:assert/strict"
import test from "node:test"
import type { AoiModelSchema } from "@aoi/protocol"
import { coerceAoiFormRecord } from "./index"

test("coerces model form values into typed records", () => {
  const model: AoiModelSchema = {
    displayField: "name",
    fields: [
      { id: "id", label: "ID", type: "string" },
      { id: "name", label: "Name", type: "string" },
      { id: "score", label: "Score", type: "number" },
      { id: "count", label: "Count", type: "integer" },
      { id: "enabled", label: "Enabled", type: "boolean" },
      { enumOptions: ["draft", "active"], id: "status", label: "Status", type: "enum" },
      { id: "dueAt", label: "Due At", type: "datetime" }
    ],
    id: "tasks",
    label: "Task",
    pluralLabel: "Tasks"
  }

  assert.deepEqual(coerceAoiFormRecord(model, {
    count: "7.8",
    dueAt: "2026-06-08T12:30:00.000Z",
    enabled: "on",
    name: "Launch",
    score: "42.5",
    status: "active"
  }), {
    count: 7,
    dueAt: "2026-06-08T12:30:00.000Z",
    enabled: true,
    name: "Launch",
    score: 42.5,
    status: "active"
  })
})

test("uses defaults for empty numeric and enum-like form values", () => {
  const model: AoiModelSchema = {
    displayField: "name",
    fields: [
      { defaultValue: 10, id: "amount", label: "Amount", type: "number" },
      { defaultValue: "draft", enumOptions: ["draft", "active"], id: "status", label: "Status", type: "enum" },
      { defaultValue: false, id: "enabled", label: "Enabled", type: "boolean" }
    ],
    id: "tasks",
    label: "Task",
    pluralLabel: "Tasks"
  }

  assert.deepEqual(coerceAoiFormRecord(model, {
    amount: "",
    enabled: false,
    status: ""
  }), {
    amount: 10,
    enabled: false,
    status: "draft"
  })
})
