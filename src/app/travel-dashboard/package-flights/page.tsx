"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Plane, MapPin, Calendar, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface PackageFlight {
  id: string
  package_id: string
  airline_id: string | null
  flight_type: "outbound" | "return"
  departure_city: string
  arrival_city: string
  departure_time: string
  arrival_time: string
  flight_number: string | null
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
  airline?: {
    name: string
    iata_code: string | null
  }
}

export default function PackageFlightsPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Penerbangan Paket</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola jadwal penerbangan per paket</p>
        </div>
      </div>

      <DataTable
        title="Daftar Penerbangan Paket"
        columns={[
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "flight_type",
            header: "Jenis",
            sortable: true,
            width: "120px",
            render: (row: any) => row.flight_type === "outbound" ? "Pergi" : "Pulang"
          },
          {
            key: "airline.name",
            header: "Maskapai",
            sortable: false,
            width: "180px",
            render: (row: any) => row.airline?.name || "-"
          },
          {
            key: "flight_number",
            header: "No. Penerbangan",
            sortable: true,
            width: "150px",
            render: (row: any) => row.flight_number || "-"
          },
          {
            key: "departure_city",
            header: "Kota Asal",
            sortable: false,
            width: "120px",
          },
          {
            key: "arrival_city",
            header: "Kota Tujuan",
            sortable: false,
            width: "120px",
          },
          {
            key: "departure_time",
            header: "Waktu Berangkat",
            sortable: true,
            width: "150px",
            render: (row: any) => row.departure_time
          },
          {
            key: "arrival_time",
            header: "Waktu Tiba",
            sortable: true,
            width: "150px",
            render: (row: any) => row.arrival_time
          },
        ]}
        fetchData={async (params) => ({ data: [], total: 0 })}
        createUrl="/travel-dashboard/package-flights/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}