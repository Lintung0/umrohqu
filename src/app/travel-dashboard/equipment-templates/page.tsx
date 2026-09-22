"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/travel/OperationalDataTable"
import { Box, ChevronRight, Ruler, Package } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface EquipmentTemplate {
  id: string
  package_id: string
  name: string
  requires_size: boolean
  size_options: string[] | null
  created_at: string
  updated_at: string
  package?: {
    name: string
  }
}

export default function EquipmentTemplatesPage() {
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
          <h1 className="text-2xl font-bold text-slate-900">Template Perlengkapan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola master perlengkapan paket (koper, kain ihram, seragam, buku doa, dll)</p>
        </div>
      </div>

      <DataTable
        title="Daftar Template Perlengkapan"
        columns={[
          {
            key: "name",
            header: "Nama Perlengkapan",
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
            key: "requires_size",
            header: "Butuh Ukuran",
            sortable: true,
            width: "120px",
            render: (row: any) => (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                row.requires_size
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-50 text-slate-600"
              }`}>
                {row.requires_size ? "Ya" : "Tidak"}
              </span>
            ),
          },
          {
            key: "size_options",
            header: "Opsi Ukuran",
            sortable: false,
            width: "200px",
            render: (row: any) => row.size_options?.join(", ") || "-"
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
        createUrl="/travel-dashboard/equipment-templates/new"
        pageSize={10}
        exportable
      />
    </div>
  )
}