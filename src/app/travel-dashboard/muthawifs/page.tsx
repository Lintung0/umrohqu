"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { UsersRound, MapPin, Award, Calendar, BadgeCheck, BadgeX } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Muthawif {
  id: string
  user_id: string
  branch_id: string | null
  certification_no: string | null
  specialization: string | null
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    email: string
    phone: string | null
  }
  branch?: {
    name: string
  }
}

export default function MuthawifsPage() {
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

  const fetchMuthawifs = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("muthawifs")
      .select(`
        *,
        user:users(full_name, email, phone),
        branch:branches(name)
      `, { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("is_active", true)

    if (search) {
      query = query.or(`user.full_name.ilike.%${search}%,user.email.ilike.%${search}%,specialization.ilike.%${search}%,certification_no.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as Muthawif[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Muthawif</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data pembimbing manasik & ibadah</p>
        </div>
      </div>

      <DataTable
        title="Daftar Muthawif"
        columns={[
          {
            key: "user.full_name",
            header: "Nama Muthawif",
            sortable: false,
            width: "200px",
            render: (row: any) => row.user?.full_name || "-"
          },
          {
            key: "user.email",
            header: "Email",
            sortable: false,
            width: "200px",
            render: (row: any) => row.user?.email || "-"
          },
          {
            key: "certification_no",
            header: "No. Sertifikasi",
            sortable: true,
            width: "180px",
            render: (row: any) => row.certification_no || "-"
          },
          {
            key: "specialization",
            header: "Spesialisasi",
            sortable: false,
            width: "200px",
            render: (row: any) => row.specialization || "-"
          },
          {
            key: "branch.name",
            header: "Cabang",
            sortable: false,
            width: "150px",
            render: (row: any) => row.branch?.name || "-"
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchMuthawifs}
        createUrl="/travel-dashboard/muthawifs/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}