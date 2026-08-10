"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { User as UserIcon, Lock, Bell, CreditCard, Save, Upload, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

export default function TravelSettingsPage() {
  const supabase = createClient()
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState("")
  const [tenantEmail, setTenantEmail] = useState("")
  const [tenantPhone, setTenantPhone] = useState("")
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase.from("users").select("tenant_id").eq("id", user.id).single()
        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id)
          const { data: tenant } = await supabase.from("tenants").select("name, contact_email, contact_phone").eq("id", profile.tenant_id).single()
          if (tenant) {
            setTenantName(tenant.name || "")
            setTenantEmail(tenant.contact_email || "")
            setTenantPhone(tenant.contact_phone || "")
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveProfile() {
    if (!tenantId) return
    setSaving(true)
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: tenantName,
          contact_email: tenantEmail || null,
          contact_phone: tenantPhone || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t("toast.error"))
      } else {
        toast.success(t("toast.profile_updated"))
      }
    } catch {
      toast.error(t("toast.error"))
    }
    setSaving(false)
  }

  async function handleChangePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(t("toast.error") + ": " + error.message)
    } else {
      toast.success(t("toast.password_changed"))
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  const tabs = [
    { key: "profile" as const, label: "Profil", icon: UserIcon },
    { key: "password" as const, label: "Password", icon: Lock },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Atur profil dan preferensi akun travel</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold">Informasi Travel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nama Travel</label>
              <input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Telepon</label>
              <input
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t.common.save}
            </button>
          </div>
        </div>
      )}

      {activeTab === "password" && (
        <PasswordTab onChangePassword={handleChangePassword} />
      )}
    </div>
  )
}

function PasswordTab({ onChangePassword }: { onChangePassword: (pw: string) => Promise<void> }) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (newPw !== confirm) {
      toast.error(t("auth.password_mismatch"))
      return
    }
    if (newPw.length < 6) {
      toast.error(t("auth.password_min", { min: 6 }))
      return
    }
    setSaving(true)
    await onChangePassword(newPw)
    setCurrent("")
    setNewPw("")
    setConfirm("")
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
      <h2 className="font-semibold">{t.auth.password}</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.auth.password}</label>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.auth.confirm_password}</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving || !newPw}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t.common.save}
        </button>
      </div>
    </div>
  )
}
