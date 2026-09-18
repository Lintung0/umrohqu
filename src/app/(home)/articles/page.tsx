"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ArticleRow {
  id: string
  title: string
  slug: string
  content: string | null
  category: string | null
  author: string | null
  published_at: string | null
  image_url: string | null
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("articles")
      .select("id, title, slug, content, category, author, published_at, image_url")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setArticles((data as ArticleRow[]) || []);
        setLoading(false);
      });
  }, [])

  const categories = ["Semua", ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))]

  const filtered = articles.filter((a) => {
    if (category !== "Semua" && a.category !== category) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-emerald-600 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Blog & Artikel</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-6 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                </div>
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
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold">Blog & Artikel</h1>
          <p className="text-emerald-100">Tips, panduan, dan informasi seputar umrah</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat!)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat ? "bg-emerald-600 text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">Tidak ada artikel ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="w-full h-40 bg-muted relative">
                  {article.image_url && (
                    <Image
                      src={article.image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {article.category && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {article.category}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-sm leading-snug group-hover:text-emerald-600 transition-colors">
                    {article.title}
                  </h2>
                  {article.published_at && (
                    <p className="text-xs text-muted-foreground pt-1">
                      {article.author || "Redaksi UmrahQu"} · {new Date(article.published_at).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
