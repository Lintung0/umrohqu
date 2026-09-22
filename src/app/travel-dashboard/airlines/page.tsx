"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Plane, Globe, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Airline {
  id: string
  name: string
  iata_code: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export default function AirlinesPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Maskapai</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data maskapai penerbangan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Maskapai"
        columns={[
          {
            key: "name",
            header: "Nama Maskapai",
            sortable: true,
            width: "200px",
          },
          {
            key: "iata_code",
            header: "Kode IATA",
            sortable: true,
            width: "120px",
            render: (row: any) => row.iata_code || "-"
          },
          {
            key: "logo_url",
            header: "Logo",
            sortable: false,
            width: "100px",
            render: (row: any) => row.logo_url ? (
              <img src={row.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain" />
            ) : "-"
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
        createUrl="/travel-dashboard/airlines/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}