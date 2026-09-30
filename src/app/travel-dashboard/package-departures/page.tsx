"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { MapPin, Calendar, Users, ChevronRight, ChevronLeft } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface PackageDeparture {
  id: string
  package_id: string
  branch_id: string | null
  departure_city: string
  departure_date: string
  quota: number
  price_adjustment: number
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
  branch?: {
    name: string
    city: string
  }
}

export default function PackageDeparturesPage() {
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

  const fetchDepartures = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("package_departures")
      .select(`
        *,
        package:packages(name),
        branch:branches(name, city)
      `, { count: "exact" })
      .eq("package.tenant_id", tenantId)

    if (search) {
      query = query.or(`package.name.ilike.%${search}%,departure_city.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("departure_date", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as PackageDeparture[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keberangkatan Paket</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola jadwal keberangkatan multi-kota per paket</p>
        </div>
      </div>

      <DataTable
        title="Daftar Keberangkatan"
        columns={[
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "250px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "departure_city",
            header: "Kota Keberangkatan",
            sortable: true,
            width: "150px",
          },
          {
            key: "departure_date",
            header: "Tanggal Berangkat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.departure_date), "dd MMM yyyy", { locale: id }),
          },
          {
            key: "branch.name",
            header: "Cabang",
            sortable: false,
            width: "150px",
            render: (row: any) => row.branch?.name || "-"
          },
          {
            key: "branch.city",
            header: "Kota Cabang",
            sortable: false,
            width: "120px",
            render: (row: any) => row.branch?.city || "-"
          },
          {
            key: "quota",
            header: "Kuota",
            sortable: true,
            width: "100px",
            render: (row: any) => `${row.quota} kursi`
          },
          {
            key: "price_adjustment",
            header: "Adjust Harga",
            sortable: true,
            width: "150px",
            render: (row: any) => formatRupiah(row.price_adjustment || 0)
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchDepartures}
        createUrl="/travel-dashboard/package-departures/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}