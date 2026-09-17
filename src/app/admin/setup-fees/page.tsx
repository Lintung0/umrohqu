"use client"

import { useState, useEffect } from "react"
import { Wallet, Save, Loader2, ExternalLink } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

interface TenantRow {
  id: string
  name: string
  created_at: string
  status: string
}

interface FeeConfigRow {
  setup_fee: number
}

export default function AdminSetupFeesPage() {
  const [setupFee, setSetupFee] = useState(0)
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: feeConfig } = await supabase
        .from("fee_config")
        .select("setup_fee")
        .single()

      if (feeConfig) {
        setSetupFee((feeConfig as FeeConfigRow).setup_fee || 0)
      }

      const { data: tnts } = await supabase
        .from("tenants")
        .select("id, name, created_at, status")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      setTenants((tnts as TenantRow[]) || [])
      setLoading(false)
    }
    fetch()
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("fee_config")
      .upsert({ id: "default", setup_fee: setupFee }, { onConflict: "id" })
    if (error) {
      toast.error("Gagal menyimpan biaya pemasangan")
    } else {
      toast.success("Biaya pemasangan berhasil diperbarui")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="bg-white rounded-2xl border border-border p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse w-full mb-3" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Biaya Setup</h1>
        <p className="text-muted-foreground mt-1">Kelola biaya pendaftaran untuk travel baru</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Setup Fee Saat Ini</h2>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-emerald-700">{formatRupiah(setupFee)}</p>
          <p className="text-sm text-emerald-600 mt-1">per travel (satu kali)</p>
        </div>
        <div className="max-w-md">
          <label className="block text-sm font-medium mb-1.5">Ubah Setup Fee</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rp</span>
            <input
              type="number"
              value={setupFee}
              onChange={(e) => setSetupFee(Number(e.target.value))}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Status Pembayaran Setup</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Travel</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal Daftar</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(tenant.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tenant.status === "active" ? "bg-green-100 text-green-700" :
                      tenant.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {tenant.status === "active" ? "Lunas" : tenant.status === "pending" ? "Belum Bayar" : "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invoices?tenant=${tenant.id}`}
                      className="text-sm text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      Lihat Invoice <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
