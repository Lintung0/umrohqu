"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bus, Users, ChevronRight, Settings } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface BusTemplate {
  id: string
  package_id: string
  bus_number: string
  capacity: number
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
}

export default function BusTemplatesPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    async function getTenantId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single()
      if (profile) setTenantId(profile.tenant_id)
    }
    getTenantId()
  }, [])

  const fetchBusTemplates = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("bus_templates")
      .select(`
        *,
        package:packages(name)
      `, { count: "exact" })
      .eq("package.tenant_id", tenantId)

    if (search) {
      query = query.or(`package.name.ilike.%${search}%,bus_number.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as BusTemplate[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Template Bus</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola template armada bus per paket</p>
        </div>
      </div>

      <DataTable
        title="Daftar Template Bus"
        columns={[
          {
            key: "bus_number",
            header: "No. Bus",
            sortable: true,
            width: "150px",
          },
          {
            key: "capacity",
            header: "Kapasitas",
            sortable: true,
            width: "120px",
            render: (row: any) => `${row.capacity} kursi`
          },
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchBusTemplates}
        createUrl="/travel-dashboard/bus-templates/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}