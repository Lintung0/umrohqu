"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { ModernIslamicTemplate } from "@/components/travel-site/templates"
import { CleanMinimalTemplate } from "@/components/travel-site/templates"
import { RoyalGoldTemplate } from "@/components/travel-site/templates"
import type { Tenant, Package } from "@/lib/types"

const TEMPLATE_MAP: Record<string, React.ComponentType<{ tenant: Tenant; packages: Package[]; themeConfig?: Record<string, unknown> }>> = {
  "c0000000-0000-0000-0000-000000000001": ModernIslamicTemplate,
  "c0000000-0000-0000-0000-000000000002": CleanMinimalTemplate,
  "c0000000-0000-0000-0000-000000000003": RoyalGoldTemplate,
}

export default function TravelSitePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const supabase = createClient()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [themeConfig, setThemeConfig] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [tenantRes, pkgRes, websiteRes] = await Promise.all([
        supabase.from("tenants").select("*").eq("id", tenantId).single(),
        supabase.from("packages").select("*").eq("tenant_id", tenantId).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("tenant_websites").select("template_id, theme_config").eq("tenant_id", tenantId).single(),
      ])

      setTenant(tenantRes.data as Tenant | null)
      setPackages((pkgRes.data as Package[]) || [])

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

  const TemplateComponent = TEMPLATE_MAP[templateId || ""] || ModernIslamicTemplate

  return <TemplateComponent tenant={tenant} packages={packages} themeConfig={themeConfig} />
}
