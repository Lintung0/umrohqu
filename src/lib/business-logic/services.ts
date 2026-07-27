// ─── Service Abstraction Layer ────────────────────────────────────────────────
// This layer abstracts data access. When DB is ready, swap implementations.

export interface ServiceConfig {
  apiBaseUrl: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

// ─── Generic CRUD Interface ──────────────────────────────────────────────────

export interface DataProvider<T, ID = string> {
  findAll(filter?: Record<string, any>): Promise<T[]>
  findById(id: ID): Promise<T | null>
  create(data: Omit<T, "id">): Promise<T>
  update(id: ID, data: Partial<T>): Promise<T>
  delete(id: ID): Promise<boolean>
  count(filter?: Record<string, any>): Promise<number>
}

// ─── In-Memory Provider (for dummy data) ─────────────────────────────────────

export class InMemoryProvider<T extends { id: string }> implements DataProvider<T> {
  private data: T[] = []

  constructor(initialData: T[] = []) {
    this.data = [...initialData]
  }

  async findAll(filter?: Record<string, any>): Promise<T[]> {
    if (!filter) return [...this.data]
    return this.data.filter((item) => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined || value === null || value === "") return true
        return (item as any)[key] === value
      })
    })
  }

  async findById(id: string): Promise<T | null> {
    return this.data.find((item) => item.id === id) || null
  }

  async create(data: Omit<T, "id">): Promise<T> {
    const newItem = { ...data, id: `auto-${Date.now()}` } as T
    this.data.push(newItem)
    return newItem
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const index = this.data.findIndex((item) => item.id === id)
    if (index === -1) throw new Error(`Item ${id} not found`)
    this.data[index] = { ...this.data[index], ...data }
    return this.data[index]
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex((item) => item.id === id)
    if (index === -1) return false
    this.data.splice(index, 1)
    return true
  }

  async count(filter?: Record<string, any>): Promise<number> {
    return (await this.findAll(filter)).length
  }
}

// ─── Supabase Provider (placeholder for DB integration) ──────────────────────

export class SupabaseProvider<T extends { id: string }> implements DataProvider<T> {
  private tableName: string
  private supabase: any // Will be SupabaseClient when integrated

  constructor(tableName: string, supabaseClient?: any) {
    this.tableName = tableName
    this.supabase = supabaseClient
  }

  async findAll(filter?: Record<string, any>): Promise<T[]> {
    if (!this.supabase) throw new Error("Supabase not configured")
    let query = this.supabase.from(this.tableName).select("*")
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value)
        }
      })
    }
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    if (!this.supabase) throw new Error("Supabase not configured")
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single()
    if (error) throw error
    return data
  }

  async create(data: Omit<T, "id">): Promise<T> {
    if (!this.supabase) throw new Error("Supabase not configured")
    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    if (!this.supabase) throw new Error("Supabase not configured")
    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<boolean> {
    if (!this.supabase) throw new Error("Supabase not configured")
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
    return !error
  }

  async count(filter?: Record<string, any>): Promise<number> {
    if (!this.supabase) throw new Error("Supabase not configured")
    let query = this.supabase.from(this.tableName).select("*", { count: "exact", head: true })
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query = query.eq(key, value)
        }
      })
    }
    const { count, error } = await query
    if (error) throw error
    return count || 0
  }
}
