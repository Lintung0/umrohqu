"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Bell, BellRing, CheckCheck, RefreshCw, ChevronRight, ChevronLeft, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/constants"
import { emitNotificationsChanged } from "@/lib/notify/events"

interface AppNotification {
  id: string
  title: string
  body: string | null
  is_read: boolean
  read_at: string | null
  link_url: string | null
  created_at: string
  template_key?: string
}

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "unread", label: "Belum Dibaca" },
  { value: "read", label: "Dibaca" },
] as const

const PAGE_SIZE = 10

function pageNumbers(total: number, current: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push("…")
    out.push(p)
    prev = p
  }
  return out
}

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    fetch("/api/notifications/upcoming-departure", { method: "POST" }).catch(() => {})
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, is_read, read_at, link_url, created_at, template_key")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    setItems((data as unknown as AppNotification[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.is_read)
    if (filter === "read") return items.filter((n) => n.is_read)
    return items
  }, [items, filter])

  const unreadCount = items.filter((n) => !n.is_read).length

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  )

  function goPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
    document.getElementById("notif-list")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    emitNotificationsChanged()
  }

  async function openItem(item: AppNotification) {
    if (!item.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", item.id)
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)))
      emitNotificationsChanged()
    }
    if (item.link_url) {
      router.push(item.link_url)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-emerald-deep text-white p-6 sm:p-8">
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="notif-islamic" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <polygon points="22,2 26,17 41,17 29,27 33,42 22,32 11,42 15,27 3,17 18,17" fill="none" stroke="#D4A843" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#notif-islamic)" />
        </svg>
        <div className="relative flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-emerald-dark border border-gold/30 flex items-center justify-center">
            {items.length > 0 && unreadCount > 0 ? <BellRing className="w-7 h-7 text-gold" /> : <Bell className="w-7 h-7 text-gold" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-emerald-100/70 mb-1">Pemberitahuan</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifikasi</h1>
            <p className="text-emerald-100/80 mt-1 text-sm sm:text-base">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1) }}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === f.value
                  ? "bg-emerald-dark text-ivory-soft"
                  : "bg-ivory-card border border-ivory-border text-muted-foreground hover:text-emerald-dark hover:border-emerald-dark/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-emerald-dark border border-emerald-dark/25 bg-ivory-card hover:bg-gold/10 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
          )}
          <button
            onClick={() => load()}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-ivory-border bg-ivory-card text-emerald-deep hover:text-emerald-dark hover:border-emerald-dark/30 transition-colors cursor-pointer"
            aria-label="Muat ulang"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-ivory-card border border-ivory-border rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-ivory-card border border-ivory-border rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-dark/10 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-emerald-dark" />
          </div>
          <p className="font-medium text-emerald-deep">Tidak ada notifikasi</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "semua" ? "Belum ada notifikasi untuk Anda" : "Tidak ada notifikasi pada filter ini"}
          </p>
        </div>
      ) : (
        <div id="notif-list" className="space-y-3 scroll-mt-24">
          {paged.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className={cn(
                "group w-full flex items-start gap-4 text-left p-4 bg-ivory-card border rounded-2xl transition-colors cursor-pointer",
                item.is_read
                  ? "border-ivory-border"
                  : "border-gold/50"
              )}
            >
              <span
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  item.is_read
                    ? "bg-ivory-border/50 text-muted-foreground"
                    : "bg-emerald-dark text-gold"
                )}
              >
                {item.is_read ? <Bell className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!item.is_read && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                  <p className={cn("text-sm truncate", item.is_read ? "text-muted-foreground font-medium" : "text-emerald-deep font-semibold")}>
                    {item.title}
                  </p>
                </div>
                {item.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.body}</p>}
                <p className="text-[11px] text-muted-foreground/80 mt-1.5">{timeAgo(item.created_at)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 group-hover:text-emerald-dark transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div className="bg-ivory-card border border-ivory-border rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </p>
          <div className="flex items-center justify-center flex-wrap gap-1.5">
            <button
              onClick={() => goPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Halaman sebelumnya"
              className="w-11 h-11 rounded-xl border border-ivory-border bg-ivory text-emerald-deep flex items-center justify-center hover:border-emerald-dark/40 transition-colors disabled:opacity-40 disabled:cursor-default cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers(totalPages, safePage).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="w-8 text-center text-muted-foreground text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  aria-label={`Halaman ${p}`}
                  aria-current={p === safePage ? "page" : undefined}
                  className={cn(
                    "min-w-11 h-11 px-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer",
                    p === safePage
                      ? "bg-emerald-dark text-ivory-soft border-emerald-dark"
                      : "bg-ivory border-ivory-border text-emerald-deep hover:border-emerald-dark/40"
                  )}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Halaman berikutnya"
              className="w-11 h-11 rounded-xl border border-ivory-border bg-ivory text-emerald-deep flex items-center justify-center hover:border-emerald-dark/40 transition-colors disabled:opacity-40 disabled:cursor-default cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
