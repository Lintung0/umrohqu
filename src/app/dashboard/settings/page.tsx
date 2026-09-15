"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Mail, Phone, Calendar, Camera, Loader2, Check, Sun, Moon, UserRound, Palette, Star } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const STARS = [
  { top: "14%", left: "10%", size: 2, delay: "0s" },
  { top: "24%", left: "30%", size: 1.5, delay: "1.1s" },
  { top: "12%", left: "52%", size: 2.5, delay: "0.4s" },
  { top: "30%", left: "68%", size: 1.5, delay: "1.8s" },
  { top: "16%", left: "84%", size: 2, delay: "0.9s" },
  { top: "45%", left: "20%", size: 1.5, delay: "2.3s" },
  { top: "48%", left: "42%", size: 2, delay: "0.7s" },
  { top: "52%", left: "58%", size: 1.5, delay: "2.9s" },
  { top: "42%", left: "90%", size: 2, delay: "1.5s" },
  { top: "60%", left: "78%", size: 1.5, delay: "3.4s" },
]

function Cloud({ fill, className, opacity = 1 }: { fill: string; className?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      style={{ opacity }}
      aria-hidden
    >
      <ellipse cx="28" cy="42" rx="26" ry="16" fill={fill} />
      <ellipse cx="54" cy="35" rx="22" ry="15" fill={fill} />
      <ellipse cx="76" cy="44" rx="21" ry="13" fill={fill} />
      <rect x="15" y="40" width="70" height="14" rx="7" fill={fill} />
    </svg>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const [tab, setTab] = useState<"account" | "appearance">("account")
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
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          {tab === "account" ? "Kelola informasi profil Anda" : "Pilih tampilan siang atau malam"}
        </p>
      </div>

      {/* Menu tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setTab("account")}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            tab === "account" ? "bg-card shadow-sm text-emerald-700" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserRound className="w-4 h-4" /> Pengaturan Akun
        </button>
        <button
          type="button"
          onClick={() => setTab("appearance")}
          className={cn(
            "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            tab === "appearance" ? "bg-card shadow-sm text-emerald-700" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-4 h-4" /> Tampilan
        </button>
      </div>

      {tab === "account" ? (
        <>
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
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
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
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
        </>
      ) : (
        /* ===== Tampilan ===== */
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6">
          <h2 className="font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600" /> Tampilan Aplikasi
          </h2>
          <div className="mb-6" />

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Ganti tema siang malam"
            className="relative block w-full max-w-[360px] h-20 rounded-full overflow-hidden border border-border shadow-inner select-none"
          >
            {/* Langit siang */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-100 to-amber-200 transition-opacity duration-700",
                isDark ? "opacity-0" : "opacity-100"
              )}
            />
            {/* Langit malam */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#1c2054] to-slate-800 transition-opacity duration-700",
                isDark ? "opacity-100" : "opacity-0"
              )}
            />

            {/* Bintang */}
            <div className={cn("absolute inset-0 transition-opacity duration-700", isDark ? "opacity-100" : "opacity-0")}>
              {STARS.map((s, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-slate-100 animate-[twinkle_3.5s_ease-in-out_infinite]"
                  style={{
                    top: s.top,
                    left: s.left,
                    width: s.size,
                    height: s.size,
                    boxShadow: "0 0 6px rgba(255,255,255,0.9)",
                    animationDelay: s.delay,
                  }}
                />
              ))}
            </div>

            {/* Awan siang */}
            <div className={cn("absolute inset-0 transition-opacity duration-700", isDark ? "opacity-0" : "opacity-100")}>
              <Cloud fill="rgba(255,255,255,0.95)" className="absolute -left-2 top-1 w-24 h-14 animate-[drift-x_7s_ease-in-out_infinite]" />
              <Cloud fill="rgba(255,255,255,0.8)" className="absolute left-[38%] -top-1 w-16 h-10 animate-[drift-x_5s_ease-in-out_infinite_reverse]" />
              <Cloud fill="rgba(255,255,255,0.85)" className="absolute -right-3 top-6 w-20 h-12 animate-[drift-x_6s_ease-in-out_infinite]" />
            </div>

            {/* Awan malam */}
            <div className={cn("absolute inset-0 transition-opacity duration-700", isDark ? "opacity-60" : "opacity-0")}>
              <Cloud fill="#2a2f5e" className="absolute -left-3 bottom-0 w-28 h-16 animate-[drift-x_9s_ease-in-out_infinite]" />
              <Cloud fill="#303568" className="absolute left-[45%] -top-2 w-20 h-12 animate-[drift-x_6s_ease-in-out_infinite_reverse]" />
            </div>

            {/* Knob */}
            <div
              className={cn(
                "absolute top-3 bottom-3 left-3 w-14 rounded-full transition-[left] duration-500 ease-in-out",
                isDark ? "left-[calc(100%-4.25rem)]" : "left-3"
              )}
            >
              {/* Knob matahari */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center transition-[opacity,transform] duration-500",
                  isDark ? "opacity-0 scale-90" : "opacity-100 scale-100"
                )}
                style={!isDark ? { boxShadow: "0 0 30px rgba(251,191,36,0.85)" } : undefined}
              >
                <Sun
                  className="w-7 h-7 text-white"
                  style={{ animation: "spin 18s linear infinite" }}
                />
              </div>
              {/* Knob bulan sabit */}
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900/90 to-slate-900/90 flex items-center justify-center transition-[opacity,transform] duration-500 scale-90",
                  isDark ? "opacity-100 scale-100" : "opacity-0"
                )}
                style={isDark ? { boxShadow: "0 0 26px rgba(196,181,253,0.55)" } : undefined}
              >
                <Moon className="w-7 h-7 text-amber-100 fill-amber-100" />
              </div>
            </div>
          </button>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-emerald-600" />
            Tema saat ini: {isDark ? "Malam" : "Siang"}
          </p>
        </div>
      )}
    </div>
  )
}