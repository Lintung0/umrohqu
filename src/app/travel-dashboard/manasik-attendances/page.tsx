"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Calendar, Users, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ManasikAttendance {
  id: string
  session_id: string
  participant_id: string
  status: "present" | "absent" | "excused"
  created_at: string
  session?: {
    session_date: string
    start_time: string
    location: string
    program?: {
      name: string
    }
  }
  participant?: {
    full_name: string
    booking?: {
      package?: {
        name: string
      }
    }
  }
}

export default function ManasikAttendancesPage() {
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

  const fetchAttendances = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("manasik_attendances")
      .select(`
        *,
        session:manasik_sessions(session_date, start_time, location, program:manasik_programs(name, package:packages(tenant_id))),
        participant:booking_participants(full_name)
      `, { count: "exact" })
      .eq("session.program.package.tenant_id", tenantId)

    if (search) {
      query = query.or(`participant.full_name.ilike.%${search}%,session.program.name.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as ManasikAttendance[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presensi Manasik</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola kehadiran jamaah di sesi manasik</p>
        </div>
      </div>

      <DataTable
        title="Daftar Presensi Manasik"
        columns={[
          {
            key: "session.session_date",
            header: "Tanggal",
            sortable: true,
            width: "150px",
            render: (row: any) => row.session?.session_date ? format(new Date(row.session.session_date), "dd MMM yyyy", { locale: id }) : "-"
          },
          {
            key: "session.start_time",
            header: "Waktu",
            sortable: true,
            width: "120px",
            render: (row: any) => row.session?.start_time || "-"
          },
          {
            key: "session.location",
            header: "Lokasi",
            sortable: false,
            width: "200px",
            render: (row: any) => row.session?.location || "-"
          },
          {
            key: "session.program.name",
            header: "Program",
            sortable: false,
            width: "200px",
            render: (row: any) => row.session?.program?.name || "-"
          },
          {
            key: "participant.full_name",
            header: "Jamaah",
            sortable: false,
            width: "200px",
            render: (row: any) => row.participant?.full_name || "-"
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            width: "150px",
            render: (row: any) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.status === "present" ? "bg-emerald-50 text-emerald-700" :
                row.status === "absent" ? "bg-red-50 text-red-700" :
                "bg-amber-50 text-amber-700"
              }`}>
                {row.status === "present" && <CheckCircle className="w-3 h-3" />}
                {row.status === "absent" && <XCircle className="w-3 h-3" />}
                {row.status === "excused" && <AlertCircle className="w-3 h-3" />}
                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
              </span>
            ),
          },
        ]}
        fetchData={fetchAttendances}
        pageSize={10}
        exportable
      />
    </div>
  )
}