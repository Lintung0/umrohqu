"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { z } from "zod"
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Package,
  Image as ImageIcon,
  MapPin,
  Clock,
  DollarSign,
  Hotel,
  FileText,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/shared/image-upload"
import CommaInput from "@/components/shared/comma-input"
import CityAutocomplete from "@/components/shared/city-autocomplete"

const packageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  type: z.enum(["reguler", "plus", "vip", "furoda"]),
  price: z.coerce.number().min(1, "Harga wajib diisi"),
  original_price: z.coerce.number().optional().nullable(),
  quota: z.coerce.number().min(1, "Kuota wajib diisi"),
  duration_days: z.coerce.number().min(1, "Durasi hari wajib diisi"),
  duration_nights: z.coerce.number().min(1, "Durasi malam wajib diisi"),
  departure_cities: z.array(z.string()).min(1, "Minimal 1 kota keberangkatan"),
  airline: z.string().min(1, "Maskapai wajib diisi"),
  hotel_makkah: z.string().optional().nullable(),
  hotel_makkah_stars: z.coerce.number().optional().nullable(),
  hotel_madinah: z.string().optional().nullable(),
  hotel_madinah_stars: z.coerce.number().optional().nullable(),
  description: z.string().optional().nullable(),
  itinerary: z.string().optional().nullable(),
  facilities: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
  terms: z.array(z.string()).optional(),
  cancellation_policy: z.string().optional().nullable(),
  image_url: z.string().url("URL tidak valid").optional().or(z.literal("")),
  is_active: z.boolean(),
})

const PACKAGE_TYPES = [
  { value: "reguler", label: "Reguler" },
  { value: "plus", label: "Plus" },
  { value: "vip", label: "VIP" },
  { value: "furoda", label: "Furoda" },
]

const AIRLINES = [
  "Garuda Indonesia",
  "Saudi Airlines",
  "Turkish Airlines",
  "Batik Air",
  "Lion Air",
  "Royal Jordanian",
]

const POPULAR_CITIES = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Makassar",
  "Semarang",
  "Yogyakarta",
  "Palembang",
  "Manado",
  "Balikpapan",
  "Banjarmasin",
  "Pekanbaru",
  "Padang",
  "Lampung",
  "Solo",
  "Malang",
  "Denpasar",
  "Pontianak",
]

export default function EditPackagePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  const [packageId, setPackageId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [originalSlug, setOriginalSlug] = useState("")

  const [name, setName] = useState("")
  const [type, setType] = useState<string>("reguler")
  const [price, setPrice] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [quota, setQuota] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [durationNights, setDurationNights] = useState("")
  const [departureCities, setDepartureCities] = useState<string[]>([])
  const [airline, setAirline] = useState("")
  const [hotelMakkah, setHotelMakkah] = useState("")
  const [hotelMakkahStars, setHotelMakkahStars] = useState("")
  const [hotelMadinah, setHotelMadinah] = useState("")
  const [hotelMadinahStars, setHotelMadinahStars] = useState("")
  const [description, setDescription] = useState("")
  const [itinerary, setItinerary] = useState("")
  const [facilities, setFacilities] = useState<string[]>([])
  const [includes, setIncludes] = useState<string[]>([])
  const [excludes, setExcludes] = useState<string[]>([])
  const [terms, setTerms] = useState<string[]>([])
  const [cancellationPolicy, setCancellationPolicy] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single()
      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id)
      }

      const { data: pkg, error } = await supabase
        .from("packages")
        .select("*")
        .eq("slug", slug)
        .is("deleted_at", null)
        .single()

      if (error || !pkg) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setPackageId(pkg.id)
      setOriginalSlug(pkg.slug || "")
      setName(pkg.name || "")
      setType(pkg.type || "reguler")
      setPrice(pkg.price?.toString() || "")
      setOriginalPrice(pkg.original_price?.toString() || "")
      setQuota(pkg.quota?.toString() || "")
      setDurationDays(pkg.duration_days?.toString() || "")
      setDurationNights(
        pkg.duration_nights?.toString() ||
          (pkg.duration_days ? String(Number(pkg.duration_days) - 1) : "")
      )
      setDepartureCities(pkg.departure_cities || (pkg.departure_city ? [pkg.departure_city] : []))
      setAirline(pkg.airline || "")
      setHotelMakkah(pkg.hotel_makkah || "")
      setHotelMakkahStars(pkg.hotel_makkah_stars?.toString() || "")
      setHotelMadinah(pkg.hotel_madinah || "")
      setHotelMadinahStars(pkg.hotel_madinah_stars?.toString() || "")
      setDescription(pkg.description || "")
      setFacilities(pkg.facilities || [])
      setIncludes(pkg.includes || [])
      setExcludes(pkg.excludes || [])
      setTerms(pkg.terms || [])
      setCancellationPolicy(pkg.cancellation_policy || "")
      setImageUrl(pkg.image_url || "")
      setIsActive(pkg.is_active ?? pkg.status === "published")

      if (pkg.itinerary && Array.isArray(pkg.itinerary)) {
        const lines = pkg.itinerary.map((item: any) =>
          typeof item === "string" ? item : item.text || item.day || JSON.stringify(item)
        )
        setItinerary(lines.join("\n"))
      }

      setLoading(false)
    }
    load()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const result = packageSchema.safeParse({
      name,
      type,
      price,
      original_price: originalPrice || null,
      quota,
      duration_days: durationDays,
      duration_nights: durationNights,
      departure_cities: departureCities,
      airline,
      hotel_makkah: hotelMakkah || null,
      hotel_makkah_stars: hotelMakkahStars || null,
      hotel_madinah: hotelMadinah || null,
      hotel_madinah_stars: hotelMadinahStars || null,
      description: description || null,
      itinerary: itinerary || null,
      facilities,
      includes,
      excludes,
      terms,
      cancellation_policy: cancellationPolicy || null,
      image_url: imageUrl || "",
      is_active: isActive,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      toast.error("Periksa kembali form yang diisi")
      return
    }

    setSaving(true)

    const itineraryArray = itinerary
      ? itinerary
          .split("\n")
          .filter((l) => l.trim())
          .map((line) => ({ text: line.trim() }))
      : null

    const { error } = await supabase
      .from("packages")
      .update({
        name,
        type,
        price: result.data.price,
        original_price: result.data.original_price || null,
        is_promo: !!originalPrice,
        quota: result.data.quota,
        available: result.data.quota,
        duration_days: result.data.duration_days,
        departure_cities: departureCities,
        departure_city: departureCities[0] || null,
        airline,
        hotel_makkah: hotelMakkah || null,
        hotel_makkah_stars: hotelMakkahStars ? Number(hotelMakkahStars) : null,
        hotel_madinah: hotelMadinah || null,
        hotel_madinah_stars: hotelMadinahStars ? Number(hotelMadinahStars) : null,
        hotel_info: {
          makkah: hotelMakkah || null,
          makkah_stars: hotelMakkahStars ? Number(hotelMakkahStars) : null,
          madinah: hotelMadinah || null,
          madinah_stars: hotelMadinahStars ? Number(hotelMadinahStars) : null,
        },
        description: description || null,
        itinerary: itineraryArray,
        facilities: facilities.length ? facilities : null,
        includes: includes.length ? includes : null,
        excludes: excludes.length ? excludes : null,
        terms: terms.length ? terms : null,
        cancellation_policy: cancellationPolicy || null,
        image_url: imageUrl || null,
        is_active: isActive,
        status: isActive ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageId)

    if (error) {
      toast.error("Gagal mengupdate paket: " + error.message)
    } else {
      toast.success("Paket berhasil diupdate!")
      router.push("/travel-dashboard/packages")
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Hapus paket "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeleting(true)
    const { error } = await supabase
      .from("packages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", packageId)
    if (error) {
      toast.error("Gagal menghapus paket")
    } else {
      toast.success("Paket berhasil dihapus")
      router.push("/travel-dashboard/packages")
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/travel-dashboard/packages"
            className="p-2 rounded-xl border border-border hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Paket Tidak Ditemukan</h1>
            <p className="text-muted-foreground mt-1">
              Paket yang Anda cari tidak tersedia atau sudah dihapus
            </p>
          </div>
        </div>
      </div>
    )
  }

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    ) : null

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/travel-dashboard/packages"
          className="p-2 rounded-xl border border-border hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Paket</h1>
          <p className="text-muted-foreground mt-1">
            Perbarui informasi paket umroh
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informasi Dasar */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Informasi Dasar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Nama Paket *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Umroh Reguler 12 Hari"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("name")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Tipe Paket *
              </label>
              <div className="flex gap-2 flex-wrap">
                {PACKAGE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      type === t.value
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-50 border border-border text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {fieldError("type")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-gray-50 border border-border text-muted-foreground"
                }`}
              >
                {isActive ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {isActive ? "Aktif" : "Nonaktif"}
              </button>
            </div>
          </div>
        </div>

        {/* Harga & Kuota */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Harga & Kuota</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Harga per Orang (Rp) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("price")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Harga Asli / Promo (Rp)
              </label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Opsional, untuk menampilkan harga coret"
                min={0}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("original_price")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Kuota Peserta *
              </label>
              <input
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="0"
                min={1}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("quota")}
            </div>
          </div>
        </div>

        {/* Durasi & Keberangkatan */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Durasi & Keberangkatan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Durasi (Hari) *
              </label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="Contoh: 12"
                min={1}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("duration_days")}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Durasi (Malam) *
              </label>
              <input
                type="number"
                value={durationNights}
                onChange={(e) => setDurationNights(e.target.value)}
                placeholder="Contoh: 11"
                min={1}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
              {fieldError("duration_nights")}
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Kota Keberangkatan *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {departureCities.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() =>
                        setDepartureCities(
                          departureCities.filter((c) => c !== city)
                        )
                      }
                      className="hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_CITIES.filter(
                  (c) => !departureCities.includes(c)
                ).slice(0, 6).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      setDepartureCities([...departureCities, city])
                    }
                    className="px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    + {city}
                  </button>
                ))}
              </div>
              <CityAutocomplete
                value=""
                onChange={(val) => {
                  if (val && !departureCities.includes(val)) {
                    setDepartureCities([...departureCities, val])
                  }
                }}
                placeholder="Cari kota keberangkatan..."
                countryFilter="id"
              />
              {fieldError("departure_cities")}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Maskapai *
              </label>
              <div className="flex gap-2 flex-wrap">
                {AIRLINES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAirline(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      airline === a
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-50 border border-border text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {fieldError("airline")}
            </div>
          </div>
        </div>

        {/* Hotel */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Informasi Hotel</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Hotel Makkah
              </label>
              <input
                type="text"
                value={hotelMakkah}
                onChange={(e) => setHotelMakkah(e.target.value)}
                placeholder="Nama hotel di Makkah"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bintang Makkah
              </label>
              <div className="flex gap-2">
                {[3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setHotelMakkahStars(
                        hotelMakkahStars === String(s) ? "" : String(s)
                      )
                    }
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      hotelMakkahStars === String(s)
                        ? "bg-amber-500 text-white"
                        : "bg-gray-50 border border-border text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {"★".repeat(s)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Hotel Madinah
              </label>
              <input
                type="text"
                value={hotelMadinah}
                onChange={(e) => setHotelMadinah(e.target.value)}
                placeholder="Nama hotel di Madinah"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Bintang Madinah
              </label>
              <div className="flex gap-2">
                {[3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setHotelMadinahStars(
                        hotelMadinahStars === String(s) ? "" : String(s)
                      )
                    }
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      hotelMadinahStars === String(s)
                        ? "bg-amber-500 text-white"
                        : "bg-gray-50 border border-border text-muted-foreground hover:bg-gray-100"
                    }`}
                  >
                    {"★".repeat(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deskripsi & Itinerary */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Deskripsi & Itinerary</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat tentang paket umroh..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Itinerary (satu aktivitas per baris)
              </label>
              <textarea
                value={itinerary}
                onChange={(e) => setItinerary(e.target.value)}
                placeholder={"Hari 1: Keberangkatan dari Jakarta\nHari 2: Tiba di Madinah, ziarah\nHari 3: Shalat di Masjid Nabawi\n..."}
                rows={8}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground resize-none font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Fasilitas & Layanan */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Fasilitas & Layanan</h2>
          </div>
          <div className="space-y-4">
            <CommaInput
              label="Fasilitas"
              value={facilities}
              onChange={setFacilities}
              placeholder="Contoh: Visa, Tiket, Hotel, Transport"
              icon={Package}
            />
            <CommaInput
              label="Termasuk (Include)"
              value={includes}
              onChange={setIncludes}
              placeholder="Contoh: Tiket pesawat, Hotel bintang 4, Makan 3x"
              icon={CheckCircle}
            />
            <CommaInput
              label="Tidak Termasuk (Exclude)"
              value={excludes}
              onChange={setExcludes}
              placeholder="Contoh: Tips guide, Laundry, Pengeluaran pribadi"
              icon={XCircle}
            />
          </div>
        </div>

        {/* Terms & Kebijakan */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Syarat & Kebijakan</h2>
          </div>
          <div className="space-y-4">
            <CommaInput
              label="Syarat & Ketentuan"
              value={terms}
              onChange={setTerms}
              placeholder="Contoh: Passport minimal 6 bulan berlaku"
              icon={FileText}
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Kebijakan Pembatalan
              </label>
              <textarea
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Contoh: Pembatalan H-30: refund 50%, H-14: tidak ada refund"
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>
        </div>

        {/* Gambar */}
        <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Gambar</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              URL Gambar atau Upload
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
            {fieldError("image_url")}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-border p-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {deleting ? "Menghapus..." : "Hapus Paket"}
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/travel-dashboard/packages"
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving || !tenantId}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
