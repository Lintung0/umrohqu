"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ClipboardCheck, CheckCircle, ArrowRight } from "lucide-react"

interface TenantRow {
  id: string
  name: string
  slug: string
  contact_email: string | null
  status: string
  created_at: string
}

export default function AdminOnboardingPage() {
  const supabase = createClient()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("tenants").select("id, name, slug, contact_email, status, created_at").is("deleted_at", null).order("created_at", { ascending: false })
      setTenants((data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  const pending = tenants.filter((t) => t.status === "pending")
  const verified = tenants.filter((t) => t.status === "verified")

  const steps = [
    { step: 1, label: "Pendaftaran", desc: "Travel mengisi form", done: true },
    { step: 2, label: "Verifikasi Data", desc: "Tim cek dokumen", done: true },
    { step: 3, label: "Setup Website", desc: "Pilih template & branding", done: false },
    { step: 4, label: "Training", desc: "Onboarding penggunaan", done: false },
    { step: 5, label: "Go Live", desc: "Website aktif", done: false },
  ]

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboarding Mitra</h1>
        <p className="text-muted-foreground mt-1">Pantau proses onboarding travel baru</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold mb-4">Alur Onboarding</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, idx) => (
            <div key={s.step} className="flex items-center gap-2 shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${s.done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                {s.step}
              </div>
              <div className="text-xs">
                <p className="font-medium">{s.label}</p>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
              {idx < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Menunggu Verifikasi ({pending.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {pending.length === 0 && <p className="p-5 text-sm text-muted-foreground">Tidak ada travel yang menunggu verifikasi</p>}
          {pending.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-600">{t.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.contact_email}</p>
              </div>
              <a href="/admin/verification" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
                Proses Verifikasi
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Baru Diverifikasi</h2>
        </div>
        <div className="divide-y divide-border">
          {verified.length === 0 && <p className="p-5 text-sm text-muted-foreground">Belum ada travel terverifikasi</p>}
          {verified.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-600">{t.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">Bergabung: {new Date(t.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Terverifikasi
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
