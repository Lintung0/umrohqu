"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Calendar, Users, Award, UserRound, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ManasikProgram {
  id: string
  package_id: string
  name: string
  lead_muthawif_id: string | null
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
  lead_muthawif?: {
    user?: {
      full_name: string
    }
  }
}

export default function ManasikProgramsPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Program Manasik</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola program bimbingan manasik per paket</p>
        </div>
      </div>

      <DataTable
        title="Daftar Program Manasik"
        columns={[
          {
            key: "name",
            header: "Nama Program",
            sortable: true,
            width: "200px",
          },
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "lead_muthawif",
            header: "Muthawif Pembina",
            sortable: false,
            width: "200px",
            render: (row: any) => row.lead_muthawif?.user?.full_name || "Belum ditugaskan"
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
        createUrl="/travel-dashboard/manasik-programs/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}