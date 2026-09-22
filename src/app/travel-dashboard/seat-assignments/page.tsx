"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bus, Users, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SeatAssignment {
  id: string
  participant_id: string
  bus_seat_id: string
  created_at: string
  participant?: {
    full_name: string
    booking?: {
      package?: {
        name: string
      }
    }
  }
  bus_seat?: {
    seat_number: string
    bus_template?: {
      bus_number: string
      package?: {
        name: string
      }
    }
  }
}

export default function SeatAssignmentsPage() {
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

  const fetchSeatAssignments = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("seat_assignments")
      .select(`
        *,
        participant:booking_participants(full_name, booking:bookings(package:packages(name))),
        bus_seat:bus_seats(seat_number, bus_template:bus_templates(bus_number))
      `, { count: "exact" })
      .eq("participant.booking.package.tenant_id", tenantId)

    if (search) {
      query = query.or(`participant.full_name.ilike.%${search}%,bus_seat.seat_number.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as SeatAssignment[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Penempatan Kursi Bus</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola penempatan jamaah di kursi bus</p>
        </div>
      </div>

      <DataTable
        title="Daftar Penempatan Kursi"
        columns={[
          {
            key: "participant.full_name",
            header: "Jamaah",
            sortable: false,
            width: "200px",
            render: (row: any) => row.participant?.full_name || "-"
          },
          {
            key: "bus_seat.seat_number",
            header: "No. Kursi",
            sortable: false,
            width: "120px",
            render: (row: any) => row.bus_seat?.seat_number || "-"
          },
          {
            key: "bus_seat.bus_template.bus_number",
            header: "No. Bus",
            sortable: false,
            width: "120px",
            render: (row: any) => row.bus_seat?.bus_template?.bus_number || "-"
          },
          {
            key: "bus_seat.bus_template.package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.bus_seat?.bus_template?.package?.name || "-"
          },
        ]}
        fetchData={fetchSeatAssignments}
        pageSize={10}
        exportable
      />
    </div>
  )
}