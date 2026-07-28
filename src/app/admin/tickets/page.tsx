"use client"

import { useState, useEffect } from "react"
import { Search, Headphones, Clock, CheckCircle, AlertTriangle, MessageSquare, Loader2, X, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TicketRow {
  id: string
  tenant_id: string
  subject: string
  description: string | null
  category: string
  priority: string
  status: string
  created_at: string
  response?: string | null
  tenants?: { name: string } | null
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
}

const CATEGORY_MAP: Record<string, string> = {
  technical: "Teknis",
  billing: "Billing",
  onboarding: "Onboarding",
  general: "Umum",
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [replyTicket, setReplyTicket] = useState<TicketRow | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchTickets = () => {
    const supabase = createClient()
    supabase
      .from("support_tickets")
      .select("id, tenant_id, subject, description, category, priority, status, created_at, response, tenants(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data || []).map((d: any) => ({
          ...d,
          tenants: Array.isArray(d.tenants) ? d.tenants[0] : d.tenants,
        }))
        setTickets(rows as TicketRow[])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    if (newStatus !== "open" && !replyMessage.trim()) {
      toast.error("Masukkan pesan balasan terlebih dahulu")
      return
    }

    setUpdatingStatus(true)
    const supabase = createClient()

    const update: Record<string, any> = { status: newStatus }

    if (replyMessage.trim()) {
      const existingResponse = tickets.find((t) => t.id === ticketId)?.response
      const timestamp = new Date().toLocaleString("id-ID")
      const newEntry = `[${timestamp}] ${replyMessage.trim()}`
      update.response = existingResponse ? `${existingResponse}\n\n${newEntry}` : newEntry
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(update)
      .eq("id", ticketId)

    setUpdatingStatus(false)

    if (error) {
      toast.error("Gagal memperbarui tiket")
      return
    }

    toast.success(`Tiket berhasil diubah ke "${STATUS_MAP[newStatus]?.label || newStatus}"`)
    setReplyTicket(null)
    setReplyMessage("")
    fetchTickets()
  }

  const filtered = tickets.filter((t) => {
    const tenantName = (t.tenants as any)?.name || ""
    const matchSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || tenantName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="h-6 bg-muted rounded animate-pulse w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tiket Kendala</h1>
        <p className="text-muted-foreground mt-1">Tangani kendala dan pertanyaan dari travel & pengguna</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: tickets.filter((t) => t.status === "open").length, color: "text-blue-600" },
          { label: "In Progress", value: tickets.filter((t) => t.status === "in_progress").length, color: "text-yellow-600" },
          { label: "Resolved", value: tickets.filter((t) => t.status === "resolved").length, color: "text-green-600" },
          { label: "Total", value: tickets.length, color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari tiket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "Semua" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ticket) => {
          const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium
          const status = STATUS_MAP[ticket.status] || STATUS_MAP.open
          const tenantName = (ticket.tenants as any)?.name || "-"
          return (
            <div key={ticket.id} className="bg-white rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ticket.category === "technical" ? "bg-blue-100 text-blue-600" :
                  ticket.category === "billing" ? "bg-amber-100 text-amber-600" :
                  ticket.category === "onboarding" ? "bg-purple-100 text-purple-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{ticket.subject}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>{tenantName}</span>
                    <span>Kategori: {CATEGORY_MAP[ticket.category] || ticket.category}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ticket.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReplyTicket(ticket)
                    setReplyMessage("")
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Balas
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {replyTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-lg">Balas Tiket</h2>
              <button
                onClick={() => {
                  setReplyTicket(null)
                  setReplyMessage("")
                }}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subjek</p>
                <p className="font-semibold text-sm">{replyTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deskripsi</p>
                <p className="text-sm text-muted-foreground">{replyTicket.description || "-"}</p>
              </div>
              {replyTicket.response && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Respon Sebelumnya</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{replyTicket.response}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pesan Balasan</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Tulis balasan..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-border space-y-3">
              <p className="text-xs text-muted-foreground">Ubah Status</p>
              <div className="flex gap-2 flex-wrap">
                {(["in_progress", "resolved", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusUpdate(replyTicket.id, s)}
                    disabled={updatingStatus}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                      replyTicket.status === s
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-border hover:bg-gray-50"
                    }`}
                  >
                    {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {STATUS_MAP[s]?.label || s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
