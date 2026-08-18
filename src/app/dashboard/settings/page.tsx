"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Mail, Phone, Calendar, Camera, Loader2, Check } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
      setName(user?.user_metadata?.full_name || "")
      setPhone(user?.user_metadata?.phone || "")
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, phone },
    })
    if (error) {
      toast.error(t("toast.error") + ": " + error.message)
    } else {
      setSaved(true)
      toast.success(t("toast.profile_updated"))
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  const avatarUrl = authUser?.user_metadata?.avatar_url
  const joined = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-"
  const email = authUser?.email || ""
  const initials = name ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "U"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi profil Anda</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name || "Avatar"}
                width={72}
                height={72}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-border rounded-full flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
              title="Ganti foto profil"
            >
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div>
            <p className="font-semibold">{name || "Pengguna"}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Member sejak {joined}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white border border-border rounded-xl shadow-sm divide-y divide-border">
        <div className="p-5">
          <h2 className="font-semibold mb-4">Informasi Pribadi</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                disabled
                className="mt-1.5 bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email tidak dapat diubah dari halaman ini</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Telepon</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxx"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> Tersimpan
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  )
}
