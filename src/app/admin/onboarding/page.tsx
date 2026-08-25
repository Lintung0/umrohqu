"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ClipboardCheck, CheckCircle, ArrowRight, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TenantRow {
  id: string
  name: string
  slug: string
  contact_email: string | null
  status: string
  created_at: string
  config: Record<string, any> | null
  logo_url: string | null
}

const ONBOARDING_STEPS = [
  { step: 1, label: "Pendaftaran", desc: "Travel mengisi form pendaftaran" },
  { step: 2, label: "Verifikasi Data", desc: "Tim memverifikasi dokumen" },
  { step: 3, label: "Pemasangan Situs", desc: "Pilih template & branding" },
  { step: 4, label: "Pelatihan", desc: "Pengenalan penggunaan sistem" },
  { step: 5, label: "Situs Aktif", desc: "Website aktif & menerima booking" },
]

function getOnboardingStep(tenant: TenantRow): number {
  if (tenant.status === "pending") return 1
  const step = Number(tenant.config?.onboarding_step)
  if (step >= 1 && step <= 5) return step
  if (tenant.status === "active") return 2
  return 1
}

function ProgressRing({ step, total = 5 }: { step: number; total?: number }) {
  const pct = (step / total) * 100
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none" stroke="#10b981" strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-emerald-700">{step}/{total}</span>
      </div>
    </div>
  )
}

export default function AdminOnboardingPage() {
  const supabase = createClient()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadTenants() {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, contact_email, status, created_at, config, logo_url")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
    setTenants((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { loadTenants() }, [])

  async function updateOnboardingStep(tenantId: string, newStep: number) {
    setUpdatingId(tenantId)
    const tenant = tenants.find((t) => t.id === tenantId)
    if (!tenant) { setUpdatingId(null); return }

    const updatedConfig = { ...(tenant.config || {}), onboarding_step: newStep }

    const { error } = await supabase
      .from("tenants")
      .update({ config: updatedConfig })
      .eq("id", tenantId)

    if (error) {
      toast.error("Gagal update: " + error.message)
    } else {
      setTenants((prev) =>
        prev.map((t) => t.id === tenantId ? { ...t, config: updatedConfig } : t)
      )
      toast.success(`${tenant.name} dipindahkan ke langkah ${newStep}`)
    }
    setUpdatingId(null)
  }

  const pending = tenants.filter((t) => t.status === "pending")
  const active = tenants.filter((t) => t.status === "active")
  const allOnboarding = tenants.filter((t) => t.status !== "pending")

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
          {ONBOARDING_STEPS.map((s, idx) => (
            <div key={s.step} className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-400">
                {s.step}
              </div>
              <div className="text-xs">
                <p className="font-medium">{s.label}</p>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
              {idx < ONBOARDING_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Menunggu Verifikasi ({pending.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {pending.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-600">{t.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.contact_email}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Langkah 1
                </span>
                <a href="/admin/verification" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors">
                  Proses Verifikasi
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Proses Onboarding ({allOnboarding.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {allOnboarding.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">Belum ada travel dalam proses onboarding</p>
          )}
          {allOnboarding.map((t) => {
            const currentStep = getOnboardingStep(t)
            const isExpanded = expandedId === t.id
            const isUpdating = updatingId === t.id

            return (
              <div key={t.id} className="p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <ProgressRing step={currentStep} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.contact_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {ONBOARDING_STEPS[currentStep - 1]?.label}
                      </span>
                      {currentStep < 5 && (
                        <span className="text-xs text-emerald-600">
                          → {ONBOARDING_STEPS[currentStep]?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep < 5 && (
                      <button
                        onClick={() => updateOnboardingStep(t.id, currentStep + 1)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Advance"}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-20 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Setel langkah onboarding:</p>
                    <div className="flex flex-wrap gap-2">
                      {ONBOARDING_STEPS.map((s) => (
                        <button
                          key={s.step}
                          onClick={() => updateOnboardingStep(t.id, s.step)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            currentStep === s.step
                              ? "bg-emerald-600 text-white"
                              : s.step < currentStep
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {s.step}. {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
