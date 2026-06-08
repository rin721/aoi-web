import type {
  DatabaseAdapter,
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseWhere,
  DataSource,
  SQLiteTableSchema
} from "~/types/lowcode"

type SQLiteDataSource = Extract<DataSource, { type: "sqlite" }>

interface MemoryTable {
  rows: DatabaseRecord[]
  schema: SQLiteTableSchema
}

function cloneRecord(record: DatabaseRecord): DatabaseRecord {
  return JSON.parse(JSON.stringify(record)) as DatabaseRecord
}

function cloneRecords(records: DatabaseRecord[]) {
  return records.map((record) => cloneRecord(record))
}

function matchesWhere(record: DatabaseRecord, where?: DatabaseWhere) {
  if (!where || !Object.keys(where).length) {
    return true
  }

  return Object.entries(where).every(([key, value]) => record[key] === value)
}

function applyFieldDefaults(schema: SQLiteTableSchema, record: DatabaseRecord) {
  const nextRecord: DatabaseRecord = {}

  for (const field of schema.fields) {
    if (Object.prototype.hasOwnProperty.call(record, field.name)) {
      nextRecord[field.name] = record[field.name]
      continue
    }

    if (Object.prototype.hasOwnProperty.call(field, "defaultValue")) {
      nextRecord[field.name] = field.defaultValue
    }
  }

  for (const [key, value] of Object.entries(record)) {
    nextRecord[key] = value
  }

  return nextRecord
}

export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  private connected = false
  private readonly source: SQLiteDataSource
  private readonly tables = new Map<string, MemoryTable>()

  constructor(source: SQLiteDataSource) {
    this.source = source
  }

  async connect() {
    if (this.connected) {
      return
    }

    await this.initSchema(this.source.config.tables)
    this.connected = true
  }

  async initSchema(tables: SQLiteTableSchema[]) {
    this.tables.clear()

    for (const table of tables) {
      this.tables.set(table.name, {
        rows: cloneRecords(table.seed || []),
        schema: table
      })
    }
  }

  async query(table: string, options: DatabaseQueryOptions = {}) {
    await this.connect()

    const memoryTable = this.getTable(table)
    const rows = memoryTable.rows.filter((record) => matchesWhere(record, options.where))
    const limitedRows = typeof options.limit === "number"
      ? rows.slice(0, options.limit)
      : rows

    return cloneRecords(limitedRows)
  }

  async insert(table: string, record: DatabaseRecord) {
    await this.connect()

    const memoryTable = this.getTable(table)
    const nextRecord = applyFieldDefaults(memoryTable.schema, record)

    memoryTable.rows.push(cloneRecord(nextRecord))

    return cloneRecord(nextRecord)
  }

  async update(table: string, where: DatabaseWhere, patch: DatabaseRecord) {
    await this.connect()

    const memoryTable = this.getTable(table)
    const updatedRows: DatabaseRecord[] = []

    memoryTable.rows = memoryTable.rows.map((record) => {
      if (!matchesWhere(record, where)) {
        return record
      }

      const nextRecord = {
        ...record,
        ...patch
      }

      updatedRows.push(nextRecord)
      return nextRecord
    })

    return cloneRecords(updatedRows)
  }

  async delete(table: string, where?: DatabaseWhere) {
    await this.connect()

    const memoryTable = this.getTable(table)
    const originalCount = memoryTable.rows.length

    memoryTable.rows = memoryTable.rows.filter((record) => !matchesWhere(record, where))

    return originalCount - memoryTable.rows.length
  }

  private getTable(table: string) {
    const memoryTable = this.tables.get(table)

    if (!memoryTable) {
      throw new Error(`Unknown sqlite table: ${table}`)
    }

    return memoryTable
  }
}

export function createSQLiteDatabaseAdapter(source: SQLiteDataSource): DatabaseAdapter {
  return new InMemoryDatabaseAdapter(source)
}

export function createDatabaseAdapter(source: SQLiteDataSource): DatabaseAdapter {
  if (source.config.adapter === "sqlite") {
    return createSQLiteDatabaseAdapter(source)
  }

  return new InMemoryDatabaseAdapter(source)
}
