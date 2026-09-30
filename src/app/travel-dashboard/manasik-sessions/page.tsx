"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Calendar, Clock, MapPin, Users, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ManasikSession {
  id: string
  program_id: string
  session_date: string
  start_time: string
  location: string
  muthawif_id: string | null
  materials_url: string | null
  created_at: string
  updated_at: string
  program?: {
    name: string
  }
  muthawif?: {
    user?: {
      full_name: string
    }
  }
}

export default function ManasikSessionsPage() {
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

  const fetchSessions = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("manasik_sessions")
      .select(`
        *,
        program:manasik_programs(name, package:packages(tenant_id)),
        muthawif:muthawifs(user:users(full_name))
      `, { count: "exact" })
      .eq("program.package.tenant_id", tenantId)

    if (search) {
      query = query.or(`program.name.ilike.%${search}%,location.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("session_date", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as ManasikSession[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sesi Manasik</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola jadwal sesi bimbingan manasik</p>
        </div>
      </div>

      <DataTable
        title="Daftar Sesi Manasik"
        columns={[
          {
            key: "program.name",
            header: "Program",
            sortable: false,
            width: "200px",
            render: (row: any) => row.program?.name || "-"
          },
          {
            key: "session_date",
            header: "Tanggal",
            sortable: true,
            width: "150px",
            render: (row: any) => format(new Date(row.session_date), "dd MMM yyyy", { locale: id }),
          },
          {
            key: "start_time",
            header: "Waktu",
            sortable: true,
            width: "120px",
            render: (row: any) => row.start_time
          },
          {
            key: "location",
            header: "Lokasi",
            sortable: false,
            width: "200px",
          },
          {
            key: "muthawif",
            header: "Muthawif",
            sortable: false,
            width: "180px",
            render: (row: any) => row.muthawif?.user?.full_name || "Belum ditugaskan"
          },
          {
            key: "materials_url",
            header: "Materi",
            sortable: false,
            width: "120px",
            render: (row: any) => row.materials_url ? "Tersedia" : "Belum ada"
          },
        ]}
        fetchData={fetchSessions}
        createUrl="/travel-dashboard/manasik-sessions/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}