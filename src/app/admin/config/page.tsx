"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DollarSign, Save, Info, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/constants"
import { toast } from "sonner"

interface FeeConfig {
  id: string
  portal_fee_per_person: number
  subdomain_fee_per_person: number
  custom_domain_fee_per_person: number
  service_fee_percent: number
  service_fee_flat: number
  setup_fee: number
  tax_percent: number
}

export default function AdminConfigPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<FeeConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("fee_config").select("*").limit(1).single()
      if (data) setConfig(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!config) return
    setSaving(true)
    const { error } = await supabase.from("fee_config").update({
      portal_fee_per_person: config.portal_fee_per_person,
      subdomain_fee_per_person: config.subdomain_fee_per_person,
      custom_domain_fee_per_person: config.custom_domain_fee_per_person,
      service_fee_percent: config.service_fee_percent,
      service_fee_flat: config.service_fee_flat,
      setup_fee: config.setup_fee,
      tax_percent: config.tax_percent,
    }).eq("id", config.id)
    if (error) toast.error("Gagal menyimpan: " + error.message)
    else toast.success("Konfigurasi berhasil disimpan")
    setSaving(false)
  }

  if (loading || !config) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Konfigurasi Biaya</h1>
        <p className="text-muted-foreground mt-1">Atur biaya platform, service fee, dan konfigurasi pembayaran</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold">Biaya Platform per Channel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Portal Utama (Rp/orang)</label>
            <input type="number" value={config.portal_fee_per_person} onChange={(e) => setConfig({ ...config, portal_fee_per_person: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Subdomain (Rp/orang)</label>
            <input type="number" value={config.subdomain_fee_per_person} onChange={(e) => setConfig({ ...config, subdomain_fee_per_person: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Custom Domain (Rp/orang)</label>
            <input type="number" value={config.custom_domain_fee_per_person} onChange={(e) => setConfig({ ...config, custom_domain_fee_per_person: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">Service Fee Transaksi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1.5">Persen (%)</label>
            <input type="number" step="0.1" value={config.service_fee_percent} onChange={(e) => setConfig({ ...config, service_fee_percent: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Flat Fee Minimum (Rp)</label>
            <input type="number" value={config.service_fee_flat} onChange={(e) => setConfig({ ...config, service_fee_flat: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          Biaya layanan: <strong>{config.service_fee_percent}%</strong> atau <strong>{formatRupiah(config.service_fee_flat)}</strong> (mana yang lebih besar)
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Biaya Setup & Pajak</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1.5">Setup Fee (Rp)</label>
            <input type="number" value={config.setup_fee} onChange={(e) => setConfig({ ...config, setup_fee: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">PPN (%)</label>
            <input type="number" step="0.1" value={config.tax_percent} onChange={(e) => setConfig({ ...config, tax_percent: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Konfigurasi
        </button>
      </div>
    </div>
  )
}
