"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bed, Building, Users, ChevronRight, Crown } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface RoomTemplate {
  id: string
  package_id: string
  hotel_id: string | null
  room_number: string
  room_type: "single" | "double" | "triple" | "quad"
  capacity: number
  floor: number | null
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
  hotel?: {
    name: string
  }
}

export default function RoomTemplatesPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Template Kamar</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola template kamar hotel per paket</p>
        </div>
      </div>

      <DataTable
        title="Daftar Template Kamar"
        columns={[
          {
            key: "room_number",
            header: "No. Kamar",
            sortable: true,
            width: "120px",
          },
          {
            key: "room_type",
            header: "Tipe",
            sortable: true,
            width: "120px",
            render: (row: any) => {
              const types: Record<string, string> = {
                single: "Single (1)",
                double: "Double (2)",
                triple: "Triple (3)",
                quad: "Quad (4)",
              }
              return types[row.room_type] || row.room_type
            }
          },
          {
            key: "capacity",
            header: "Kapasitas",
            sortable: true,
            width: "100px",
            render: (row: any) => `${row.capacity} orang`
          },
          {
            key: "floor",
            header: "Lantai",
            sortable: true,
            width: "100px",
            render: (row: any) => row.floor || "-"
          },
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "hotel.name",
            header: "Hotel",
            sortable: false,
            width: "200px",
            render: (row: any) => row.hotel?.name || "-"
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
        createUrl="/travel-dashboard/room-templates/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}