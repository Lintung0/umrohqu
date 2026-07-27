"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronUp, HelpCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("custom_pages")
      .select("id, title, content, category")
      .eq("page_type", "faq")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setFaqs(data.map((d) => ({
            id: d.id,
            question: d.title,
            answer: d.content || "",
            category: d.category || "Umum",
          })));
        }
        setLoading(false);
      });
  }, [])

  const categories = ["Semua", ...Array.from(new Set(faqs.map((f) => f.category)))]

  const filtered = faqs.filter((f) => {
    if (category !== "Semua" && f.category !== category) return false
    if (search && !f.question.toLowerCase().includes(search.toLowerCase()) && !f.answer.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-emerald-600 text-white py-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <HelpCircle className="w-12 h-12 mx-auto opacity-80" />
            <h1 className="text-3xl font-bold">Pertanyaan Umum</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto p-6 -mt-8">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-5">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <HelpCircle className="w-12 h-12 mx-auto opacity-80" />
          <h1 className="text-3xl font-bold">Pertanyaan Umum</h1>
          <p className="text-emerald-100">Temukan jawaban atas pertanyaan yang sering ditanyakan</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 -mt-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Tidak ada pertanyaan ditemukan</p>
            </div>
          ) : (
            filtered.map((faq) => (
              <div key={faq.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{faq.category}</span>
                    <span className="font-medium text-sm">{faq.question}</span>
                  </div>
                  {openId === faq.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <p className="font-semibold text-emerald-800">Belum menemukan jawaban?</p>
          <p className="text-sm text-emerald-700 mt-1">Hubungi kami via WhatsApp di <strong>+62 82232169960</strong></p>
        </div>
      </div>
    </div>
  )
}
