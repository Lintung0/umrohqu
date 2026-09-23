"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Package, Box, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ParticipantEquipment {
  id: string
  participant_id: string
  equipment_template_id: string
  size: string | null
  quantity: number
  status: "pending" | "ready" | "distributed" | "returned"
  created_at: string
  updated_at: string
  participant?: {
    full_name: string
    booking?: {
      package?: {
        name: string
      }
    }
  }
  equipment_template?: {
    name: string
  }
}

export default function ParticipantEquipmentPage() {
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

  const fetchParticipantEquipment = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("participant_equipment")
      .select(`
        *,
        participant:participants(full_name, booking:bookings(package:packages(name))),
        equipment_template:equipment_templates(name)
      `, { count: "exact" })
      .eq("participant.booking.package.tenant_id", tenantId)

    if (search) {
      query = query.or(`participant.full_name.ilike.%${search}%,equipment_template.name.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as ParticipantEquipment[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Perlengkapan Jamaah</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola penyerahan perlengkapan ke jamaah individual</p>
        </div>
      </div>

      <DataTable
        title="Daftar Perlengkapan Jamaah"
        columns={[
          {
            key: "participant.full_name",
            header: "Jamaah",
            sortable: false,
            width: "200px",
            render: (row: any) => row.participant?.full_name || "-"
          },
          {
            key: "participant.booking.package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.participant?.booking?.package?.name || "-"
          },
          {
            key: "equipment_template.name",
            header: "Perlengkapan",
            sortable: false,
            width: "180px",
            render: (row: any) => row.equipment_template?.name || "-"
          },
          {
            key: "size",
            header: "Ukuran",
            sortable: false,
            width: "100px",
            render: (row: any) => row.size || "-"
          },
          {
            key: "quantity",
            header: "Jumlah",
            sortable: true,
            width: "100px",
            render: (row: any) => row.quantity
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            width: "150px",
            render: (row: any) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.status === "distributed" ? "bg-emerald-50 text-emerald-700" :
                row.status === "ready" ? "bg-blue-50 text-blue-700" :
                row.status === "returned" ? "bg-purple-50 text-purple-700" :
                "bg-amber-50 text-amber-700"
              }`}>
                {row.status === "pending" && <Clock className="w-3 h-3" />}
                {row.status === "ready" && <CheckCircle className="w-3 h-3" />}
                {row.status === "distributed" && <CheckCircle className="w-3 h-3" />}
                {row.status === "returned" && <CheckCircle className="w-3 h-3" />}
                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
              </span>
            ),
          },
        ]}
        fetchData={fetchParticipantEquipment}
        pageSize={10}
        exportable
      />
    </div>
  )
}