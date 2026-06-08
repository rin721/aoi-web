import assert from "node:assert/strict"
import test from "node:test"
import { adminCrudSystemSchema } from "../../templates/admin-crud/src/index"
import {
  cloneAoiSchema,
  validateAoiSystemSchema
} from "./index"

test("validates the admin CRUD template schema", () => {
  const result = validateAoiSystemSchema(adminCrudSystemSchema)

  assert.equal(result.ok, true)
  assert.deepEqual(result.issues.filter((issue) => issue.severity === "error"), [])
})

test("reports broken schema references and duplicate ids", () => {
  const schema = cloneAoiSchema(adminCrudSystemSchema)

  schema.pages.push({
    ...cloneAoiSchema(schema.pages[0]),
    id: schema.pages[0].id
  })
  schema.routes[0].pageId = "missingPage"
  schema.dataSources[0].resources[0].modelId = "missingModel"
  schema.dataSources[0].resources[0].operations.push("query")
  schema.dataSources[0].resources[0].operations.push("archive" as never)
  schema.pages[0].root.children?.push({
    id: "brokenNode",
    material: "aoi.unknown.material",
    props: { resourceId: "missingResource" }
  })
  schema.pages[0].root.events = {
    submit: {
      steps: [{ kind: "data.query", resourceId: "missingResource" }]
    }
  }

  const result = validateAoiSystemSchema(schema)
  const codes = new Set(result.issues.map((issue) => issue.code))

  assert.equal(result.ok, false)
  assert.equal(codes.has("identifier.duplicate"), true)
  assert.equal(codes.has("route.page"), true)
  assert.equal(codes.has("resource.model"), true)
  assert.equal(codes.has("resource.operation"), true)
  assert.equal(codes.has("node.material"), true)
  assert.equal(codes.has("node.resource"), true)
  assert.equal(codes.has("actionFlow.resource"), true)
})
