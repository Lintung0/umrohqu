"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bed, MapPin, Users, ChevronRight, Building } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface RoomAssignment {
  id: string
  participant_id: string
  room_template_id: string
  location: "makkah" | "madinah"
  created_at: string
  participant?: {
    full_name: string
    booking?: {
      package?: {
        name: string
      }
    }
  }
  room_template?: {
    room_number: string
    room_type: string
    hotel?: {
      name: string
    }
  }
}

export default function RoomAssignmentsPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Penempatan Kamar</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola penempatan jamaah di kamar hotel</p>
        </div>
      </div>

      <DataTable
        title="Daftar Penempatan Kamar"
        columns={[
          {
            key: "participant.full_name",
            header: "Jamaah",
            sortable: false,
            width: "200px",
            render: (row: any) => row.participant?.full_name || "-"
          },
          {
            key: "room_template.room_number",
            header: "No. Kamar",
            sortable: false,
            width: "120px",
            render: (row: any) => row.room_template?.room_number || "-"
          },
          {
            key: "room_template.room_type",
            header: "Tipe Kamar",
            sortable: false,
            width: "120px",
            render: (row: any) => {
              const types: Record<string, string> = {
                single: "Single (1)",
                double: "Double (2)",
                triple: "Triple (3)",
                quad: "Quad (4)",
              }
              return types[row.room_template?.room_type] || "-"
            }
          },
          {
            key: "room_template.hotel.name",
            header: "Hotel",
            sortable: false,
            width: "200px",
            render: (row: any) => row.room_template?.hotel?.name || "-"
          },
          {
            key: "location",
            header: "Lokasi",
            sortable: true,
            width: "120px",
            render: (row: any) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.location === "makkah"
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
              }`}>
                {row.location === "makkah" ? "Makkah" : "Madinah"}
              </span>
            ),
          },
        ]}
        fetchData={async (params) => ({ data: [], total: 0 })}
        pageSize={10}
        exportable
      />
    </div>
  )
}