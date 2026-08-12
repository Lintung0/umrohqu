import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import PackageDetailClient from "./package-detail-client"
import type { Metadata } from "next"

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: pkg } = await supabase
    .from("packages")
    .select("name, description, price, image_url, travel:tenants(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!pkg) {
    return { title: "Paket Tidak Ditemukan - UmrahQu" }
  }

  const travelName = (pkg.travel as any)?.name || "UmrahQu"
  const description = pkg.description || `Paket umroh ${pkg.name} dari ${travelName} mulai dari Rp ${(pkg.price || 0).toLocaleString("id-ID")}`

  return {
    title: `${pkg.name} - UmrahQu`,
    description,
    openGraph: {
      title: pkg.name,
      description,
      images: pkg.image_url ? [pkg.image_url] : [],
      type: "website",
    },
  }
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: pkg } = await supabase
    .from("packages")
    .select("*, travel:tenants(id, name, slug, status, is_verified, logo_url, city, description)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  const { data: pkgImages } = await supabase
    .from("package_gallery")
    .select("image_url, media_type")
    .eq("package_id", pkg?.id)
    .order("sort_order", { ascending: true })

  if (!pkg) {
    console.error("[PACKAGE DETAIL] Not found for slug:", slug)
    notFound()
  }

  // Get reviews for this package via bookings join
  const { data: pkgBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("package_id", pkg.id)
  const pkgBookingIds = (pkgBookings || []).map((b: any) => b.id)

  const { data: reviews } = pkgBookingIds.length > 0
    ? await supabase
        .from("reviews")
        .select("id, rating, review, created_at, customer_id")
        .in("booking_id", pkgBookingIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null }

  const reviewerIds = [...new Set((reviews || []).map((r: any) => r.customer_id).filter(Boolean))]
  let reviewerMap: Record<string, string> = {}
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", reviewerIds)
    if (reviewers) {
      reviewerMap = Object.fromEntries(reviewers.map((r: any) => [r.id, r.full_name]))
    }
  }

  const images = [
    pkg.image_url,
    ...(pkgImages || []).map((i: any) => i.image_url),
  ].filter(Boolean) as string[]

  const galleryItems = [
    ...(pkg.image_url ? [{ url: pkg.image_url, type: "image" as const }] : []),
    ...(pkgImages || []).map((i: any) => ({
      url: i.image_url,
      type: (i.media_type || "image") as "image" | "video",
    })),
  ].filter((item) => item.url) as { url: string; type: "image" | "video" }[]

  return (
    <PackageDetailClient
      pkg={pkg}
      reviews={(reviews as any) || []}
      reviewerMap={reviewerMap}
      images={images}
      galleryItems={galleryItems}
    />
  )
}
