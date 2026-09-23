"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import { enrichTenantsWithDetail } from "@/lib/tenant-detail-fields"
import { Loader2 } from "lucide-react"
import { TEMPLATE_MAP } from "@/components/travel-site/templates"
import { PackageDocumentationSection } from "@/components/shared/package-documentation"
import type { Tenant, Package } from "@/lib/types"

export default function TravelSitePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const supabase = createClient()

  const [tenant, setTenant] = useState<(Tenant & Record<string, unknown>) | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [docPackages, setDocPackages] = useState<Package[]>([])
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [themeConfig, setThemeConfig] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [tenantRes, pkgRes, websiteRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", tenantId).single(),
        supabase.from("packages").select("*").eq("tenant_id", tenantId).neq("type", "haji").in("status", ["active", "ongoing", "completed"]).order("created_at", { ascending: false }),
        supabase.from("websites").select("template_id, theme_config").eq("tenant_id", tenantId).single(),
      ])

      const baseTenant = tenantRes.data as Tenant | null
      const enrichedTenant = baseTenant ? (await enrichTenantsWithDetail(supabase, [baseTenant]))[0] ?? null : null
      setTenant(enrichedTenant as (Tenant & Record<string, unknown>) | null)
      const allPackages = ((await enrichPackagesWithDetail(supabase, (pkgRes.data as Package[]) || [])) || []) as Package[]
      setPackages(allPackages.filter((p) => p.status === "active" || p.status === "ongoing"))
      setDocPackages(allPackages.filter((p) => p.images && p.images.length > 0))

      if (websiteRes.data) {
        setTemplateId(websiteRes.data.template_id)
        setThemeConfig(websiteRes.data.theme_config || {})
      }

      setLoading(false)
    }
    fetchData()
  }, [tenantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50/30 to-white">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-emerald-50/30 to-white">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <p className="text-lg font-medium text-gray-900">Travel tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">Periksa kembali URL yang Anda kunjungi</p>
      </div>
    )
  }

  const TemplateComponent = TEMPLATE_MAP[templateId || ""] || TEMPLATE_MAP["c0000000-0000-0000-0000-000000000001"]

  return (
    <>
      <TemplateComponent tenant={tenant} packages={packages} themeConfig={themeConfig} />
      <PackageDocumentationSection packages={docPackages} title="Dokumentasi Perjalanan" />
    </>
  )
}
