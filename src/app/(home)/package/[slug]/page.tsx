import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import PackageDetailClient from "./package-detail-client"

export const dynamic = "force-dynamic"

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: pkg } = await supabase
    .from("packages")
    .select("*, travel:tenants(id, name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!pkg) {
    console.error("[PACKAGE DETAIL] Not found for slug:", slug)
    notFound()
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, review, created_at, customer:users(full_name)")
    .eq("tenant_id", pkg.tenant_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <PackageDetailClient
      pkg={pkg}
      reviews={(reviews as any) || []}
    />
  )
}
