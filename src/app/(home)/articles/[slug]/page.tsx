"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, User } from "lucide-react"
import { useEffect, useState } from "react"
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

export default function ArticleDetailPage() {
  const params = useParams()
  const [article, setArticle] = useState<ArticleRow | null>(null)
  const [related, setRelated] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("articles")
      .select("id, title, slug, content, category, author, published_at, image_url")
      .eq("slug", params.slug)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setArticle(data as ArticleRow);
          const { data: rel } = await supabase
            .from("articles")
            .select("id, title, slug, category, author, published_at, image_url")
            .not("id", "eq", data.id)
            .not("published_at", "is", null)
            .limit(2);
          setRelated((rel as ArticleRow[]) || []);
        }
        setLoading(false);
      });
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold">Artikel tidak ditemukan</h1>
          <Link href="/articles" className="text-emerald-600 hover:underline">← Kembali ke artikel</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        <Link href="/articles" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke artikel
        </Link>

        <article className="bg-white rounded-2xl border border-border overflow-hidden">
          {article.image_url && (
            <div className="w-full h-64 relative">
              <Image src={article.image_url} alt={article.title} fill className="object-cover" />
            </div>
          )}
          <div className="p-6 lg:p-8 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {article.category && (
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{article.category}</span>
              )}
              {article.published_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(article.published_at).toLocaleDateString("id-ID")}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {article.author || "Redaksi UmrahQu"}</span>
            </div>
            <div className="border-t border-border pt-4 text-muted-foreground leading-relaxed whitespace-pre-line">
              {article.content || ""}
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold mb-4">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  {a.image_url && (
                    <div className="w-full h-32 relative">
                      <Image src={a.image_url} alt={a.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    {a.category && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{a.category}</span>}
                    <h3 className="font-semibold text-sm mt-2">{a.title}</h3>
                    {a.published_at && <p className="text-xs text-muted-foreground mt-1">{new Date(a.published_at).toLocaleDateString("id-ID")}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
