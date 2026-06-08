export type AoiSchemaVersion = "aoi.system.v1"
export type AoiBuildTargetKind = "nuxt" | "vue" | "static"
export type AoiRegistryScope = "system" | "project" | "team" | "platform"
export type AoiDataDriverMode = "mock" | "sqlite-node" | "http"
export type AoiFieldType = "string" | "text" | "integer" | "number" | "boolean" | "datetime" | "enum"
export type AoiMaterialCategory = "layout" | "display" | "form" | "data" | "feedback" | "action" | "composite"
export type AoiPropControl = "text" | "textarea" | "number" | "switch" | "select" | "color" | "resource" | "model" | "json"
export type AoiBindingSource = "state" | "resource" | "route" | "constant"
export type AoiSchemaIssueSeverity = "error" | "warning"
export type AoiDataRuntimeErrorCode =
  | "INVALID_INPUT"
  | "MISSING_RECORD"
  | "OPERATION_NOT_ALLOWED"
  | "RESOURCE_NOT_FOUND"
  | "SCHEMA_INVALID"
  | "SCHEMA_PARSE_FAILED"

export interface AoiSystemSchema {
  app: AoiAppSchema
  build: AoiBuildSchema
  dataSources: AoiDataSourceSchema[]
  id: string
  materials: AoiMaterialReference[]
  modules: AoiModuleSchema[]
  pages: AoiPageSchema[]
  routes: AoiRouteSchema[]
  version: AoiSchemaVersion
}

export interface AoiAppSchema {
  description: string
  name: string
  slug: string
}

export interface AoiBuildSchema {
  defaultLocale: string
  target: AoiBuildTargetKind
}

export interface AoiRouteSchema {
  pageId: string
  path: string
  title: string
}

export interface AoiModuleSchema {
  description: string
  id: string
  modelIds: string[]
  name: string
  pageIds: string[]
}

export interface AoiPageSchema {
  description: string
  id: string
  name: string
  root: AoiNodeSchema
  routePath: string
  state: Record<string, unknown>
}

export interface AoiNodeSchema {
  bindings?: Record<string, AoiBindingSchema>
  children?: AoiNodeSchema[]
  events?: Record<string, AoiActionFlowSchema>
  id: string
  material: string
  props: Record<string, unknown>
  slots?: Record<string, AoiNodeSchema[]>
  style?: Record<string, string | number>
}

export interface AoiBindingSchema {
  fallback?: unknown
  path: string
  source: AoiBindingSource
}

export interface AoiMaterialReference {
  type: string
  version: string
}

export interface AoiMaterialManifest {
  actions: AoiMaterialActionPort[]
  category: AoiMaterialCategory
  dataInputs: AoiMaterialDataInput[]
  description: string
  events: AoiMaterialEventPort[]
  icon: string
  label: string
  lifecycle: AoiMaterialLifecycleHook[]
  props: AoiMaterialPropSchema[]
  registryScope: AoiRegistryScope
  styleVars: AoiMaterialStyleVar[]
  type: string
  version: string
}

export interface AoiMaterialPropSchema {
  control: AoiPropControl
  defaultValue?: unknown
  key: string
  label: string
  options?: Array<{ label: string, value: string }>
  required?: boolean
}

export interface AoiMaterialEventPort {
  description: string
  name: string
}

export interface AoiMaterialActionPort {
  description: string
  name: string
}

export interface AoiMaterialDataInput {
  description: string
  name: string
  resourceId?: string
}

export interface AoiMaterialStyleVar {
  defaultValue: string
  name: string
}

export interface AoiMaterialLifecycleHook {
  description: string
  name: "mount" | "beforeQuery" | "afterQuery" | "beforeSubmit" | "afterSubmit"
}

export interface AoiDataSourceSchema {
  driver: AoiDataDriverMode
  id: string
  label: string
  models: AoiModelSchema[]
  resources: AoiDataResourceSchema[]
}

export interface AoiModelSchema {
  displayField: string
  fields: AoiModelFieldSchema[]
  id: string
  label: string
  pluralLabel: string
}

export interface AoiModelFieldSchema {
  defaultValue?: unknown
  enumOptions?: string[]
  id: string
  indexed?: boolean
  label: string
  required?: boolean
  type: AoiFieldType
}

export interface AoiDataResourceSchema {
  driver: AoiDataDriverMode
  id: string
  label: string
  modelId: string
  operations: AoiDataOperation[]
}

export type AoiDataOperation = "query" | "create" | "update" | "delete" | "seed" | "reset"

export interface AoiActionFlowSchema {
  steps: AoiActionStepSchema[]
}

export type AoiActionStepSchema =
  | AoiNavigateAction
  | AoiSetStateAction
  | AoiDataAction
  | AoiDialogAction
  | AoiToastAction

export interface AoiNavigateAction {
  kind: "navigate"
  to: string
}

export interface AoiSetStateAction {
  key: string
  kind: "setState"
  value: unknown
}

export interface AoiDataAction {
  kind: "data.create" | "data.delete" | "data.query" | "data.update"
  payload?: Record<string, unknown>
  resourceId: string
}

export interface AoiDialogAction {
  dialogId: string
  kind: "openDialog" | "closeDialog"
}

export interface AoiToastAction {
  kind: "toast"
  message: string
  tone?: "info" | "success" | "warning" | "danger"
}

export interface AoiQueryInput {
  limit?: number
  resourceId: string
}

export interface AoiMutationInput {
  id?: string
  record?: Record<string, unknown>
  resourceId: string
}

export interface AoiDataDriver {
  create(input: AoiMutationInput): Promise<AoiDataResult>
  delete(input: AoiMutationInput): Promise<AoiDataResult>
  query(input: AoiQueryInput): Promise<AoiDataResult>
  reset(): Promise<void>
  seed(seedData: AoiSeedData): Promise<void>
  update(input: AoiMutationInput): Promise<AoiDataResult>
}

export interface AoiDataResult {
  items: Array<Record<string, unknown>>
  totalCount: number
}

export type AoiSeedData = Record<string, Array<Record<string, unknown>>>

export interface AoiSchemaIssue {
  code: string
  message: string
  path: string
  severity: AoiSchemaIssueSeverity
}

export interface AoiSchemaValidationOptions {
  materialTypes?: Iterable<string>
}

export interface AoiSchemaValidationResult {
  issues: AoiSchemaIssue[]
  normalizedSchema: AoiSystemSchema
  ok: boolean
}

export interface AoiGeneratedManifest {
  generatedAt: string
  packageName: string
  projectSlug: string
  runtimeDependencies: Record<string, string>
  schemaHash: string
  schemaVersion: AoiSchemaVersion
  target: AoiBuildTargetKind
}

export interface AoiDataRuntimeError {
  code: AoiDataRuntimeErrorCode
  details?: unknown
  message: string
  operation?: AoiDataOperation
  recoverable: boolean
  resourceId?: string
}

export function isAoiIdentifier(value: string) {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value)
}

export function cloneAoiSchema<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function normalizeAoiSystemSchema(schema: AoiSystemSchema): AoiSystemSchema {
  const next = cloneAoiSchema(schema)

  next.dataSources = next.dataSources || []
  next.materials = next.materials || []
  next.modules = next.modules || []
  next.pages = next.pages || []
  next.routes = next.routes || []

  next.dataSources.forEach((source) => {
    source.models = source.models || []
    source.resources = source.resources || []
    source.models.forEach((model) => {
      model.fields = model.fields || []
    })
    source.resources.forEach((resource) => {
      resource.operations = resource.operations || []
    })
  })

  next.pages.forEach((page) => {
    page.state = page.state || {}
  })

  return next
}

export function validateAoiSystemSchema(schema: AoiSystemSchema, options: AoiSchemaValidationOptions = {}): AoiSchemaValidationResult {
  const normalizedSchema = normalizeAoiSystemSchema(schema)
  const issues: AoiSchemaIssue[] = []
  const materialTypes = new Set([
    ...normalizedSchema.materials.map((material) => material.type),
    ...Array.from(options.materialTypes || [])
  ])
  const pageIds = new Set(normalizedSchema.pages.map((page) => page.id))
  const modelIdList = normalizedSchema.dataSources.flatMap((source) => source.models.map((model) => model.id))
  const resourceIdList = normalizedSchema.dataSources.flatMap((source) => source.resources.map((resource) => resource.id))
  const modelIds = new Set(modelIdList)
  const resourceIds = new Set(resourceIdList)

  const addIssue = (code: string, path: string, message: string, severity: AoiSchemaIssueSeverity = "error") => {
    issues.push({ code, message, path, severity })
  }

  if (normalizedSchema.version !== "aoi.system.v1") {
    addIssue("schema.version", "version", "Schema version must be aoi.system.v1.")
  }

  checkIdentifier(normalizedSchema.id, "id", "schema.id", addIssue)
  if (!isAoiSlug(normalizedSchema.app?.slug || "")) {
    addIssue("slug.invalid", "app.slug", `Invalid app.slug: ${normalizedSchema.app?.slug || "(empty)"}.`)
  }

  checkUnique(normalizedSchema.pages.map((page) => page.id), "pages", "page.id", addIssue)
  checkUnique(normalizedSchema.routes.map((route) => route.path), "routes", "route.path", addIssue)
  checkUnique(normalizedSchema.materials.map((material) => material.type), "materials", "material.type", addIssue)
  checkUnique(normalizedSchema.dataSources.map((source) => source.id), "dataSources", "dataSource.id", addIssue)
  checkUnique(modelIdList, "dataSources.models", "model.id", addIssue)
  checkUnique(resourceIdList, "dataSources.resources", "resource.id", addIssue)

  normalizedSchema.routes.forEach((route, index) => {
    if (!route.path?.startsWith("/")) {
      addIssue("route.path", `routes.${index}.path`, `Route path ${route.path || "(empty)"} must start with /.`)
    }

    if (!pageIds.has(route.pageId)) {
      addIssue("route.page", `routes.${index}.pageId`, `Route ${route.path} points to missing page ${route.pageId}.`)
    }
  })

  normalizedSchema.modules.forEach((module, moduleIndex) => {
    checkIdentifier(module.id, `modules.${moduleIndex}.id`, "module.id", addIssue)
    module.pageIds.forEach((pageId, pageIndex) => {
      if (!pageIds.has(pageId)) {
        addIssue("module.page", `modules.${moduleIndex}.pageIds.${pageIndex}`, `Module ${module.id} points to missing page ${pageId}.`)
      }
    })
    module.modelIds.forEach((modelId, modelIndex) => {
      if (!modelIds.has(modelId)) {
        addIssue("module.model", `modules.${moduleIndex}.modelIds.${modelIndex}`, `Module ${module.id} points to missing model ${modelId}.`)
      }
    })
  })

  normalizedSchema.dataSources.forEach((source, sourceIndex) => {
    checkIdentifier(source.id, `dataSources.${sourceIndex}.id`, "dataSource.id", addIssue)
    source.models.forEach((model, modelIndex) => {
      checkIdentifier(model.id, `dataSources.${sourceIndex}.models.${modelIndex}.id`, "model.id", addIssue)
      checkUnique(model.fields.map((field) => field.id), `dataSources.${sourceIndex}.models.${modelIndex}.fields`, "field.id", addIssue)
      model.fields.forEach((field, fieldIndex) => {
        checkIdentifier(field.id, `dataSources.${sourceIndex}.models.${modelIndex}.fields.${fieldIndex}.id`, "field.id", addIssue)
      })
    })

    source.resources.forEach((resource, resourceIndex) => {
      const resourcePath = `dataSources.${sourceIndex}.resources.${resourceIndex}`

      checkIdentifier(resource.id, `${resourcePath}.id`, "resource.id", addIssue)

      if (!source.models.some((model) => model.id === resource.modelId)) {
        addIssue("resource.model", `${resourcePath}.modelId`, `Resource ${resource.id} points to missing model ${resource.modelId}.`)
      }

      if (resource.driver !== source.driver) {
        addIssue("resource.driver", `${resourcePath}.driver`, `Resource ${resource.id} driver must match its data source driver.`)
      }

      resource.operations.forEach((operation, operationIndex) => {
        if (!isAoiDataOperation(operation)) {
          addIssue("resource.operation", `${resourcePath}.operations.${operationIndex}`, `Resource ${resource.id} uses unsupported operation ${operation}.`)
        }
      })
      checkUnique(resource.operations, `${resourcePath}.operations`, "operation", addIssue)
    })
  })

  normalizedSchema.pages.forEach((page, pageIndex) => {
    checkIdentifier(page.id, `pages.${pageIndex}.id`, "page.id", addIssue)

    if (page.routePath && !normalizedSchema.routes.some((route) => route.path === page.routePath && route.pageId === page.id)) {
      addIssue("page.route", `pages.${pageIndex}.routePath`, `Page ${page.id} routePath is not backed by a matching route.`, "warning")
    }

    const nodeIds = new Set<string>()
    visitNode(page.root, `pages.${pageIndex}.root`, nodeIds, materialTypes, resourceIds, modelIds, addIssue)
  })

  return {
    issues,
    normalizedSchema,
    ok: issues.every((issue) => issue.severity !== "error")
  }
}

export function isAoiDataRuntimeError(value: unknown): value is AoiDataRuntimeError {
  return Boolean(
    value &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value &&
    "recoverable" in value &&
    typeof (value as AoiDataRuntimeError).code === "string" &&
    typeof (value as AoiDataRuntimeError).message === "string" &&
    typeof (value as AoiDataRuntimeError).recoverable === "boolean"
  )
}

function visitNode(
  node: AoiNodeSchema,
  path: string,
  nodeIds: Set<string>,
  materialTypes: Set<string>,
  resourceIds: Set<string>,
  modelIds: Set<string>,
  addIssue: (code: string, path: string, message: string, severity?: AoiSchemaIssueSeverity) => void
) {
  if (!node) {
    addIssue("node.missing", path, "Page root node is required.")
    return
  }

  checkIdentifier(node.id, `${path}.id`, "node.id", addIssue)

  if (nodeIds.has(node.id)) {
    addIssue("node.unique", `${path}.id`, `Node id ${node.id} is duplicated within the page.`)
  }

  nodeIds.add(node.id)

  if (!materialTypes.has(node.material)) {
    addIssue("node.material", `${path}.material`, `Node ${node.id} uses unregistered material ${node.material}.`)
  }

  if (typeof node.props?.resourceId === "string" && !resourceIds.has(node.props.resourceId)) {
    addIssue("node.resource", `${path}.props.resourceId`, `Node ${node.id} points to missing resource ${node.props.resourceId}.`)
  }

  if (typeof node.props?.modelId === "string" && !modelIds.has(node.props.modelId)) {
    addIssue("node.model", `${path}.props.modelId`, `Node ${node.id} points to missing model ${node.props.modelId}.`)
  }

  Object.entries(node.events || {}).forEach(([eventName, flow]) => {
    validateActionFlow(flow, `${path}.events.${eventName}`, resourceIds, addIssue)
  })

  ;(node.children || []).forEach((child, index) => {
    visitNode(child, `${path}.children.${index}`, nodeIds, materialTypes, resourceIds, modelIds, addIssue)
  })

  Object.entries(node.slots || {}).forEach(([slotName, slotNodes]) => {
    slotNodes.forEach((slotNode, index) => {
      visitNode(slotNode, `${path}.slots.${slotName}.${index}`, nodeIds, materialTypes, resourceIds, modelIds, addIssue)
    })
  })
}

function validateActionFlow(
  flow: AoiActionFlowSchema,
  path: string,
  resourceIds: Set<string>,
  addIssue: (code: string, path: string, message: string, severity?: AoiSchemaIssueSeverity) => void
) {
  if (!flow || !Array.isArray(flow.steps)) {
    addIssue("actionFlow.steps", `${path}.steps`, "Action flow steps must be an array.")
    return
  }

  flow.steps.forEach((step, index) => {
    if (isAoiDataAction(step) && !resourceIds.has(step.resourceId)) {
      addIssue("actionFlow.resource", `${path}.steps.${index}.resourceId`, `Action ${step.kind} points to missing resource ${step.resourceId}.`)
    }
  })
}

function checkIdentifier(
  value: string,
  path: string,
  label: string,
  addIssue: (code: string, path: string, message: string, severity?: AoiSchemaIssueSeverity) => void
) {
  if (!isAoiIdentifier(value || "")) {
    addIssue("identifier.invalid", path, `Invalid ${label}: ${value || "(empty)"}.`)
  }
}

function checkUnique(
  values: string[],
  path: string,
  label: string,
  addIssue: (code: string, path: string, message: string, severity?: AoiSchemaIssueSeverity) => void
) {
  const seen = new Set<string>()

  values.forEach((value) => {
    if (seen.has(value)) {
      addIssue("identifier.duplicate", path, `Duplicate ${label}: ${value}.`)
    }

    seen.add(value)
  })
}

function isAoiDataOperation(value: string): value is AoiDataOperation {
  return ["query", "create", "update", "delete", "seed", "reset"].includes(value)
}

function isDataActionKind(value: string): value is AoiDataAction["kind"] {
  return ["data.create", "data.delete", "data.query", "data.update"].includes(value)
}

function isAoiDataAction(step: AoiActionStepSchema): step is AoiDataAction {
  return isDataActionKind(step.kind)
}

function isAoiSlug(value: string) {
  return /^[a-z][a-z0-9-]{0,63}$/.test(value)
}
