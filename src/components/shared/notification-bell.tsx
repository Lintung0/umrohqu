"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Bell, BellRing, CheckCheck, ArrowRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/constants"
import { onNotificationsChanged, emitNotificationsChanged } from "@/lib/notify/events"

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

export default function NotificationBell() {
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const ActiveIcon = items.length > 0 && unread > 0 ? BellRing : Bell

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setItems([])
      setUnread(0)
      setLoaded(true)
      return
    }
    // Generate notifikasi "segera berangkat" (≤7 hari) bila ada, lazy dari client.
    fetch("/api/notifications/upcoming-departure", { method: "POST" }).catch(() => {})
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, body, is_read, read_at, link_url, created_at, template_key")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ])
    const rows = (data as unknown as AppNotification[]) || []
    setItems(rows)
    setUnread(count || 0)
    setLoaded(true)
  }

  useEffect(() => {
    load()
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const offNotif = onNotificationsChanged(() => load())
    document.addEventListener("mousedown", onDoc)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      offNotif()
    }
  }, [pathname])

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    setUnread(0)
    emitNotificationsChanged()
  }

  async function openItem(item: AppNotification) {
    if (!item.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", item.id)
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)))
      setUnread((u) => Math.max(0, u - 1))
      emitNotificationsChanged()
    }
    setOpen(false)
    if (item.link_url) {
      router.push(item.link_url)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          if (!loaded) load()
          setOpen((o) => !o)
        }}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-xl text-ivory-ink/60 hover:text-emerald-dark hover:bg-ivory transition-colors",
          open && "bg-ivory text-emerald-dark"
        )}
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <ActiveIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-ivory-card border border-ivory-border rounded-2xl shadow-lg shadow-emerald-deep/10 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="relative px-4 py-3 flex items-center justify-between border-b border-ivory-border bg-ivory">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-dark flex items-center justify-center">
                  <Bell className="w-4 h-4 text-gold-light" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-emerald-dark">Notifikasi</p>
                  <p className="text-[11px] text-ivory-ink/70">
                    {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
                  </p>
                </div>
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-dark hover:text-emerald-deep hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tandai dibaca
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-ivory-border">
              {items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-ivory flex items-center justify-center">
                    <Info className="w-6 h-6 text-ivory-ink/40" />
                  </div>
                  <p className="text-sm font-medium text-ivory-ink/70">Belum ada notifikasi</p>
                  <p className="text-xs text-ivory-ink/50 mt-1">Notifikasi terbaru akan muncul di sini</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-ivory",
                      !item.is_read && "bg-ivory-soft"
                    )}
                  >
                    {!item.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-dark shrink-0" />}
                    <div className="min-w-0">
                      <p className={cn("text-sm text-ivory-ink", !item.is_read ? "font-semibold" : "font-medium")}>
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="text-xs text-ivory-ink/70 mt-0.5 line-clamp-2">{item.body}</p>
                      )}
                      <p className="text-[11px] text-ivory-ink/50 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-emerald-dark bg-ivory border-t border-ivory-border hover:bg-ivory-soft transition-colors"
            >
              Lihat Semua Notifikasi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
