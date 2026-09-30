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
    package_hotel?: {
      hotel?: {
        name: string
      }
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

  const fetchRoomAssignments = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("room_assignments")
      .select(`
        *,
        participant:participants(full_name, booking:bookings(package:packages(name))),
        room_template:room_templates(room_number, room_type, package_hotel:package_hotels(hotel:hotels(name)))
      `, { count: "exact" })
      .eq("participant.booking.package.tenant_id", tenantId)

    if (search) {
      query = query.or(`participant.full_name.ilike.%${search}%,room_template.room_number.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as RoomAssignment[]) || [], total: count || 0 }
  }

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
            render: (row: any) => row.room_template?.package_hotel?.hotel?.name || "-"
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
        fetchData={fetchRoomAssignments}
        pageSize={10}
        exportable
      />
    </div>
  )
}