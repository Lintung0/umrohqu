"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { User as UserIcon, Mail, Phone, Calendar, Camera, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function SettingsPage() {
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
      toast.error("Gagal menyimpan: " + error.message)
    } else {
      setSaved(true)
      toast.success("Profil berhasil diperbarui")
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  const avatarUrl = authUser?.user_metadata?.avatar_url
  const joined = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-"
  const email = authUser?.email || ""

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
        <p className="text-muted-foreground mt-1">Kelola informasi profil Anda</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name || "Avatar"}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            )}
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors"
              title="Ganti foto profil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="font-semibold">{name || "Pengguna"}</p>
            <p className="text-sm text-muted-foreground">Member sejak {joined}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-semibold">Informasi Pribadi</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            Nama Lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-muted/50 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Email tidak dapat diubah dari halaman ini</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Telepon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">✓ Tersimpan</span>
          )}
        </div>
      </form>
    </div>
  )
}
