"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Wallet, Calendar, BadgeCheck, Clock } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AgentCommission, AgentCommissionTrigger } from "@/lib/types"

interface AgentCommissionRow extends AgentCommission {
  agent?: {
    user: {
      full_name: string
      email: string
    }
  }
  booking?: {
    booking_code: string
  }
  package?: {
    name: string
  }
}

const TRIGGER_LABEL: Record<AgentCommissionTrigger, string> = {
  on_dp: "Saat DP",
  on_paid: "Saat Lunas",
  on_departure: "Saat Berangkat",
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  paid: { label: "Terbayar", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Dibatalkan", className: "bg-slate-100 text-slate-500" },
}

export default function AgentCommissionsPage() {
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

  const fetchCommissions = async ({ page, limit, search, sortBy, sortOrder }: {
    page: number
    limit: number
    search: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    filters?: Record<string, any>
  }) => {
    if (!tenantId) return { data: [], total: 0 }

    let query = supabase
      .from("commissions")
      .select(`
        *,
        agent:agents(user:users(full_name, email)),
        booking:bookings(booking_code, package:packages(name))
      `, { count: "exact" })
      .eq("tenant_id", tenantId)

    if (search) {
      query = query.or(`booking.booking_code.ilike.%${search}%,agent.user.full_name.ilike.%${search}%`)
    }

    if (sortBy) {
      query = query.order(sortBy as any, { ascending: sortOrder === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, count } = await query
    return { data: (data as unknown as AgentCommissionRow[]) || [], total: count || 0 }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Komisi Agen</h1>
          <p className="text-sm text-slate-500 mt-1">Lacak komisi agen dari setiap pemesanan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Komisi"
        columns={[
          {
            key: "agent.user.full_name",
            header: "Agen",
            sortable: false,
            width: "200px",
            render: (row: any) => row.agent?.user?.full_name || "-",
          },
          {
            key: "booking.booking_code",
            header: "Kode Pesanan",
            sortable: false,
            width: "150px",
            render: (row: any) => `#${row.booking?.booking_code || "-"}`,
          },
          {
            key: "booking.package.name",
            header: "Paket",
            sortable: false,
            width: "200px",
            render: (row: any) => row.booking?.package?.name || "-",
          },
          {
            key: "amount",
            header: "Nominal",
            sortable: true,
            width: "150px",
            render: (row: any) => <span className="font-medium text-slate-900">{formatRupiah(row.amount)}</span>,
          },
          {
            key: "trigger",
            header: "Pemicu",
            sortable: true,
            width: "160px",
            render: (row: any) => (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium">
                <Wallet className="w-3 h-3" />
                {TRIGGER_LABEL[row.trigger as AgentCommissionTrigger] || row.trigger}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            width: "130px",
            render: (row: any) => {
              const style = STATUS_STYLE[row.status] || STATUS_STYLE.pending
              const Icon = row.status === "paid" ? BadgeCheck : Clock
              return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.className}`}>
                  <Icon className="w-3 h-3" />
                  {style.label}
                </span>
              )
            },
          },
          {
            key: "created_at",
            header: "Dibuat",
            sortable: true,
            width: "180px",
            render: (row: any) => format(new Date(row.created_at), "dd MMM yyyy", { locale: id }),
          },
        ]}
        fetchData={fetchCommissions}
        pageSize={10}
        exportable
      />
    </div>
  )
}