"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import PackageCard from "@/components/shared/package-card"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { MapPin, Phone, Mail, ExternalLink, Loader2 } from "lucide-react"
import type { Tenant, Package } from "@/lib/types"

export default function TravelSitePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const supabase = createClient()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [tenantRes, pkgRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", tenantId).single(),
        supabase.from("packages").select("*").eq("tenant_id", tenantId).eq("status", "active").order("created_at", { ascending: false }),
      ])

      setTenant(tenantRes.data as Tenant | null)
      setPackages((pkgRes.data as Package[]) || [])
      setLoading(false)
    }
    fetchData()
  }, [tenantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Travel tidak ditemukan</p>
      </div>
    )
  }

  const brandColor = tenant.brand_color || tenant.config?.brand_color || "#0D7C5F"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero header */}
      <section className="relative overflow-hidden py-16 px-6" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd, ${brandColor}aa)` }}>
        <div className="absolute inset-0 text-white"><IslamicPattern opacity={0.03} /></div>
        <div className="relative max-w-5xl mx-auto text-center">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-white/20" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-white/10 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white/20">
              {tenant.name.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{tenant.name}</h1>
          <p className="text-white/60 max-w-lg mx-auto">{tenant.description || "Biro perjalanan umroh & haji terpercaya"}</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/50">
            {tenant.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {tenant.city}</span>}
            {tenant.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</span>}
            {tenant.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {tenant.contact_email}</span>}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Paket Umroh</h2>
          <p className="text-sm text-muted-foreground mt-1">Pilih paket terbaik dari {tenant.name}</p>
        </div>
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} showTravel={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>Belum ada paket tersedia</p>
          </div>
        )}
      </section>
    </div>
  )
}
