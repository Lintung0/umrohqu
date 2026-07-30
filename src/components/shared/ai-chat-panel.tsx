"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Bot, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Package } from "@/lib/types"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AiChatPanelProps {
  packages: Package[]
}

const QUICK_QUESTIONS = [
  "Mana yang paling recommended?",
  "Bandingkan harga per hari",
  "Cocok untuk keluarga?",
  "Hotel terbaik yang mana?",
]

export default function AiChatPanel({ packages }: AiChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Halo! Saya siap bantu kamu membandingkan paket umrah. Tanyakan apa aja tentang paket-paket yang sedang kamu bandingkan, misalnya mana yang paling hemat, hotel terbaik, atau rekomendasi untuk keluarga.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    if (packages.length === 0) {
      setError("Pilih minimal 1 paket dulu untuk bertanya pada AI.")
      return
    }

    setError("")
    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const res = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packages,
        message: text,
        history,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal terhubung ke AI" }))
      setError(err.error || "Terjadi kesalahan")
      setLoading(false)
      return
    }

    const reader = res.body?.getReader()
    if (!reader) {
      setError("Tidak bisa membaca respons")
      setLoading(false)
      return
    }

    const decoder = new TextDecoder()
    let accumulated = ""

    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: accumulated }
        return updated
      })
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {!isOpen && packages.length > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold">Tanya AI</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-semibold">Tanya AI — Rekomendasi Paket</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-md"
                        : "bg-white border border-border/60 rounded-tl-md shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content || (i === messages.length - 1 && loading ? <span className="animate-pulse">Mengetik...</span> : "")}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {messages.length === 1 && packages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Coba tanyakan:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs bg-white border border-border/60 rounded-full px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanya tentang paket ini..."
                  rows={1}
                  className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  style={{ minHeight: 40, maxHeight: 120 }}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                AI menggunakan Google Gemini. Jawaban tidak selalu akurat.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
