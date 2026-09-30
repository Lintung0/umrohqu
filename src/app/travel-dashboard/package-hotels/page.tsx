"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Bed, Building, Calendar, MapPin, Star, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface PackageHotel {
  id: string
  package_id: string
  hotel_id: string
  check_in_date: string
  check_out_date: string
  night_count: number
  sort_order: number
  created_at: string
  package?: {
    name: string
  }
  hotel?: {
    name: string
    city: string
  }
}

export default function PackageHotelsPage() {
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

  const fetchPackageHotels = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("package_hotels")
      .select(`
        *,
        package:packages(name),
        hotel:hotels(name, city)
      `, { count: "exact" })
      .eq("package.tenant_id", tenantId)

    if (search) {
      query = query.or(`package.name.ilike.%${search}%,hotel.name.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as PackageHotel[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotel Paket</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola hotel yang terkait dengan paket umrah</p>
        </div>
      </div>

      <DataTable
        title="Daftar Hotel Paket"
        columns={[
          {
            key: "package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.package?.name || "-"
          },
          {
            key: "hotel.name",
            header: "Hotel",
            sortable: false,
            width: "200px",
            render: (row: any) => row.hotel?.name || "-"
          },
          {
            key: "hotel.city",
            header: "Kota Hotel",
            sortable: false,
            width: "120px",
            render: (row: any) => row.hotel?.city || "-"
          },
          {
            key: "check_in_date",
            header: "Check-in",
            sortable: true,
            width: "150px",
            render: (row: any) => format(new Date(row.check_in_date), "dd MMM yyyy", { locale: id }),
          },
          {
            key: "check_out_date",
            header: "Check-out",
            sortable: true,
            width: "150px",
            render: (row: any) => format(new Date(row.check_out_date), "dd MMM yyyy", { locale: id }),
          },
          {
            key: "night_count",
            header: "Malam",
            sortable: true,
            width: "100px",
            render: (row: any) => `${row.night_count} malam`
          },
          {
            key: "sort_order",
            header: "Urutan",
            sortable: true,
            width: "100px",
            render: (row: any) => `#${row.sort_order}`
          },
        ]}
        fetchData={fetchPackageHotels}
        createUrl="/travel-dashboard/package-hotels/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}