"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Building2, MapPin, Phone, Building, CheckCircle, XCircle } from "lucide-react"
import { formatRupiah, cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Branch {
  id: string
  tenant_id: string
  name: string
  city: string
  address: string
  phone: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export default function BranchesPage() {
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

  const fetchBranches = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("branches")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
    }

    if (filters?.status === "active") {
      query = query.eq("is_primary", true)
    } else if (filters?.status === "inactive") {
      query = query.eq("is_primary", false)
    }

    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const from = (page - 1) * 10
    const to = from + 10 - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error
    return { data: (data as any) || [], total: count || 0 }
  }

  const columns = [
    { key: "name", header: "Nama Cabang", sortable: true, width: "200px" },
    { key: "city", header: "Kota", sortable: true, width: "150px" },
    { key: "address", header: "Alamat", sortable: false },
    { key: "phone", header: "Telepon", sortable: false, width: "180px", render: (row: any) => row.phone || "-" },
    {
      key: "is_primary",
      header: "Status",
      sortable: true,
      width: "120px",
      render: (row: any) => (
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          row.is_primary
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-50 text-slate-600"
        )}>
          {row.is_primary ? (
            <>
              <CheckCircle className="w-3 h-3" /> Utama
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" /> Cabang
            </>
          )}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Dibuat",
      sortable: true,
      width: "180px",
      render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Cabang</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data cabang operasional travel</p>
        </div>
      </div>

      <DataTable
        title="Daftar Cabang"
        columns={[
          { key: "name", header: "Nama Cabang", sortable: true, width: "200px" },
          { key: "city", header: "Kota", sortable: true, width: "150px" },
          { key: "address", header: "Alamat", sortable: false },
          { key: "phone", header: "Telepon", sortable: false, width: "180px", render: (row: any) => row.phone || "-" },
          {
            key: "is_primary",
            header: "Status",
            sortable: true,
            width: "120px",
            render: (row: any) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.is_primary
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-50 text-slate-600"
              }`}>
                {row.is_primary ? (
                  <>
                    <CheckCircle className="w-3 h-3" /> Utama
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" /> Cabang
                  </>
                )}
              </span>
            ),
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchBranches}
        createUrl="/travel-dashboard/branches/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}