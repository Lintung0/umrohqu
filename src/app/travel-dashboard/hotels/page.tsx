"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Hotel, MapPin, Building, Star, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Hotel {
  id: string
  tenant_id: string
  name: string
  city: string
  address: string
  facilities: string[] | null
  distance_to_haram_meters: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export default function HotelsPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Hotel</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data hotel mitra travel</p>
        </div>
      </div>

      <DataTable
        title="Daftar Hotel"
        columns={[
          {
            key: "name",
            header: "Nama Hotel",
            sortable: true,
            width: "200px",
          },
          {
            key: "city",
            header: "Kota",
            sortable: true,
            width: "150px",
          },
          {
            key: "address",
            header: "Alamat",
            sortable: false,
          },
          {
            key: "facilities",
            header: "Fasilitas",
            sortable: false,
            width: "200px",
            render: (row: any) => row.facilities?.join(", ") || "-"
          },
          {
            key: "distance_to_haram_meters",
            header: "Jarak ke Haram",
            sortable: true,
            width: "150px",
            render: (row: any) => row.distance_to_haram_meters ? `${row.distance_to_haram_meters} m` : "-"
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
        createUrl="/travel-dashboard/hotels/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}