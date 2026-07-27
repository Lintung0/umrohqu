"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Star, MapPin, Clock, Users, Plane, Hotel, Shield, CheckCircle,
  XCircle, BadgeCheck, Zap, Calendar, BookmarkPlus, BookmarkCheck, GitCompare, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRupiah } from "@/lib/constants"

interface PackageDetail {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  quota: number
  departure_city: string | null
  departure_date: string | null
  duration_days: number | null
  airline: string | null
  hotel_info: any
  facilities: any
  status: string
  image_url: string | null
  tenant_id: string
  travel: { id: string; name: string; slug: string; verified?: boolean } | null
}

interface ReviewRow {
  id: string
  rating: number
  review: string | null
  created_at: string
  customer: { full_name: string } | null
}

const TAB_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "facilities", label: "Fasilitas" },
  { id: "reviews", label: "Ulasan" },
]

export default function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")
  const [pkg, setPkg] = useState<PackageDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const supabase = createClient()

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data: pkgData } = await supabase
        .from("packages")
        .select("*, travel:tenants(id, name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .single()

      if (!pkgData) {
        setLoading(false)
        return
      }

      setPkg(pkgData as any)

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("id, rating, review, created_at, customer:users(full_name)")
        .eq("tenant_id", pkgData.tenant_id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20)

      setReviews((reviewData as any) || [])

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: wl } = await supabase
          .from("wishlists")
          .select("id")
          .eq("user_id", user.id)
          .eq("package_id", pkgData.id)
          .maybeSingle()
        if (wl) {
          setIsWishlisted(true)
          setWishlistId(wl.id)
        }
      }

      setLoading(false)
    }
    load()
  }, [slug])

  async function toggleWishlist() {
    if (!pkg) return
    setTogglingWishlist(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = "/login"
      return
    }

    if (isWishlisted && wishlistId) {
      await supabase.from("wishlists").delete().eq("id", wishlistId)
      setIsWishlisted(false)
      setWishlistId(null)
    } else {
      const { data } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, package_id: pkg.id })
        .select("id")
        .single()
      if (data) {
        setIsWishlisted(true)
        setWishlistId(data.id)
      }
    }
    setTogglingWishlist(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!pkg) notFound()

  const hotelInfo = (pkg.hotel_info || {}) as any
  const facilitiesList: string[] = Array.isArray(pkg.facilities)
    ? pkg.facilities
    : typeof pkg.facilities === "object" && pkg.facilities?.includes
      ? pkg.facilities.includes
      : []
  const excludesList: string[] = typeof pkg.facilities === "object" && pkg.facilities?.excludes
    ? pkg.facilities.excludes
    : []

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <main className="min-h-screen bg-zinc-50/50">
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-primary transition-colors">Cari Paket</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{pkg.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden">
              {pkg.image_url ? (
                <Image src={pkg.image_url} alt={pkg.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-2xl font-bold leading-tight">{pkg.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                  {pkg.duration_days && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pkg.duration_days} Hari</span>}
                  {pkg.departure_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(pkg.departure_date).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>}
                  {avgRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)} ({reviews.length} ulasan)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Travel Info */}
            {pkg.travel && (
              <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between">
                <Link href={`/travel/${pkg.travel.id}`} className="flex items-center gap-3 group">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-600">{pkg.travel.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm group-hover:text-primary transition-colors">
                      {pkg.travel.name}
                      {pkg.travel.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                </Link>
                <Link href={`/travel/${pkg.travel.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">Lihat Travel</Button>
                </Link>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border overflow-x-auto">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-5">
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pkg.airline && (
                        <div className="bg-muted/40 rounded-xl p-3">
                          <Plane className="w-4 h-4 text-primary mb-1.5" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maskapai</p>
                          <p className="text-xs font-semibold mt-0.5">{pkg.airline}</p>
                        </div>
                      )}
                      {pkg.duration_days && (
                        <div className="bg-muted/40 rounded-xl p-3">
                          <Clock className="w-4 h-4 text-primary mb-1.5" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Durasi</p>
                          <p className="text-xs font-semibold mt-0.5">{pkg.duration_days} Hari</p>
                        </div>
                      )}
                      {hotelInfo.makkah && (
                        <div className="bg-muted/40 rounded-xl p-3">
                          <Hotel className="w-4 h-4 text-primary mb-1.5" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hotel Makkah</p>
                          <p className="text-xs font-semibold mt-0.5 leading-snug">{hotelInfo.makkah}</p>
                        </div>
                      )}
                      {hotelInfo.madinah && (
                        <div className="bg-muted/40 rounded-xl p-3">
                          <Hotel className="w-4 h-4 text-primary mb-1.5" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hotel Madinah</p>
                          <p className="text-xs font-semibold mt-0.5 leading-snug">{hotelInfo.madinah}</p>
                        </div>
                      )}
                    </div>
                    {pkg.departure_city && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Kota Keberangkatan</h3>
                        <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium w-fit">
                          <MapPin className="w-3 h-3" />{pkg.departure_city}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "facilities" && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {facilitiesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" /> Sudah Termasuk
                        </h3>
                        <ul className="space-y-2">
                          {facilitiesList.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {excludesList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" /> Tidak Termasuk
                        </h3>
                        <ul className="space-y-2">
                          {excludesList.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {facilitiesList.length === 0 && excludesList.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8 sm:col-span-2">Info fasilitas belum tersedia.</p>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-5">
                    {reviews.length > 0 ? (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{avgRating.toFixed(1)}</div>
                            <div className="flex gap-0.5 justify-center mt-1">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{reviews.length} ulasan</div>
                          </div>
                        </div>
                        {reviews.map((r) => (
                          <div key={r.id} className="border-b border-border pb-5 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-600">
                                  {r.customer?.full_name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{r.customer?.full_name || "Pengguna"}</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map((s) => (
                                      <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                                </div>
                              </div>
                            </div>
                            {r.review && <p className="text-sm text-muted-foreground leading-relaxed">{r.review}</p>}
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">Belum ada ulasan untuk paket ini.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-2xl p-5 sticky top-24 space-y-4">
              <div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-primary">{formatRupiah(pkg.price)}</p>
                </div>
                <p className="text-xs text-muted-foreground">per orang · belum termasuk service fee</p>
              </div>

              {pkg.quota > 0 && (
                <div className="bg-muted/40 rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" /> Sisa Kursi
                    </span>
                    <span className="font-bold">{pkg.quota}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {pkg.duration_days && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs">Durasi: <span className="font-medium text-foreground">{pkg.duration_days} Hari</span></span>
                  </div>
                )}
                {pkg.airline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plane className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs">Maskapai: <span className="font-medium text-foreground">{pkg.airline}</span></span>
                  </div>
                )}
                {pkg.departure_city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs">Dari: <span className="font-medium text-foreground">{pkg.departure_city}</span></span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <Link href={`/checkout?package=${pkg.id}`}>
                  <Button className="w-full h-11 font-semibold">
                    Pesan Sekarang
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 ${isWishlisted ? "border-emerald-500 text-emerald-600 bg-emerald-50" : ""}`}
                    onClick={toggleWishlist}
                    disabled={togglingWishlist}
                  >
                    {togglingWishlist ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isWishlisted ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    {isWishlisted ? "Tersimpan" : "Simpan"}
                  </Button>
                  <Link href={`/compare?pkg=${pkg.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <GitCompare className="w-3.5 h-3.5" /> Bandingkan
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                {[
                  { icon: Shield, text: "Pembayaran 100% aman" },
                  { icon: BadgeCheck, text: "Travel terverifikasi Kemenag" },
                  { icon: CheckCircle, text: "Visa & asuransi terjamin" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
