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
        fetchData={async (params) => ({ data: [], total: 0 })}
        createUrl="/travel-dashboard/manasik-sessions/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}