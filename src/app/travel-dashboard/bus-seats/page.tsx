"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bus, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface BusSeat {
  id: string
  bus_template_id: string
  seat_number: string
  created_at: string
  bus_template?: {
    bus_number: string
    package?: {
      name: string
    }
  }
}

export default function BusSeatsPage() {
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kursi Bus</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar kursi per bus template</p>
        </div>
      </div>

      <DataTable
        title="Daftar Kursi Bus"
        columns={[
          {
            key: "seat_number",
            header: "No. Kursi",
            sortable: true,
            width: "120px",
          },
          {
            key: "bus_template.bus_number",
            header: "No. Bus",
            sortable: false,
            width: "120px",
            render: (row: any) => row.bus_template?.bus_number || "-"
          },
          {
            key: "bus_template.package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.bus_template?.package?.name || "-"
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={async (params) => ({ data: [], total: 0 })}
        pageSize={10}
        exportable
      />
    </div>
  )
}