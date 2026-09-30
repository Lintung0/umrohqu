"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { UserCheck, MapPin, Phone, Mail, CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AgentCommissionTrigger } from "@/lib/types"

interface Agent {
  id: string
  user_id: string
  branch_id: string | null
  referral_code: string
  commission_amount: number
  commission_trigger: AgentCommissionTrigger
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

export default function AgentsPage() {
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

  const fetchAgents = async ({ page, limit, search, sortBy, sortOrder, filters }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("agents")
      .select(`
        *,
        user:users(full_name, email, phone),
        branch:branches(name)
      `, { count: "exact" })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)

    if (search) {
      query = query.or(`referral_code.ilike.%${search}%,user.full_name.ilike.%${search}%,user.email.ilike.%${search}%`)
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Agen</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data agen mitra penjualan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Agen"
        columns={[
          {
            key: "user.full_name",
            header: "Nama Agen",
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
            key: "referral_code",
            header: "Kode Referal",
            sortable: true,
            width: "150px",
          },
          {
            key: "branch.name",
            header: "Cabang",
            sortable: false,
            width: "150px",
            render: (row: any) => row.branch?.name || "-"
          },
          {
            key: "commission_amount",
            header: "Komisi",
            sortable: true,
            width: "150px",
            render: (row: any) => formatRupiah(row.commission_amount)
          },
          {
            key: "commission_trigger",
            header: "Trigger",
            sortable: true,
            width: "150px",
            render: (row: any) => {
              const triggers: Record<string, string> = {
                on_dp: "DP Dibayar",
                on_paid: "Lunas",
                on_departure: "Keberangkatan",
              }
              return triggers[row.commission_trigger] || row.commission_trigger
            }
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchAgents}
        createUrl="/travel-dashboard/agents/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}