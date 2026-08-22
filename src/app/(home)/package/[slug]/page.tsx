import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import PackageDetailClient from "./package-detail-client"
import type { Metadata } from "next"

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()

  let pkg: any = null
  try {
    const { data: pkgData, error } = await supabase
      .from("packages")
      .select("name, description, price, id, travel:tenants(name)")
      .eq("slug", slug)
      .in("status", ["active", "ongoing"])
      .single()
    if (!error && pkgData) {
      pkg = pkgData
    }
  } catch (e) {
    // error caught, pkg stays null
  }

  if (!pkg) {
    return notFound()
  }

  const { data: coverImg } = (await supabase
    .from("package_gallery")
    .select("image_url")
    .eq("package_id", pkg.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle()) || { data: null }

  const travelName = (pkg.travel as any)?.name || "UmrahQu"
  const description = pkg.description || "Paket umroh " + pkg.name + " dari " + travelName + " mulai dari Rp " + (pkg.price || 0).toLocaleString("id-ID")
  const ogImage = coverImg?.image_url

  return {
    title: pkg.name + " - UmrahQu",
    description,
    openGraph: {
      title: pkg.name,
      description,
      images: ogImage ? [ogImage] : [],
      type: "website",
    },
  }
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  let pkg: any = null
  try {
    const { data: pkgData, error } = await supabase
      .from("packages")
      .select("*, travel:tenants(id, name, slug, status, is_verified, logo_url, city, description)")
      .eq("slug", slug)
      .in("status", ["active", "ongoing"])
      .single()
    if (!error && pkgData) {
      pkg = pkgData
    }
  } catch (e) {
    // error caught, pkg stays null
  }

  if (!pkg) {
    notFound()
  }

  const { data: pkgImagesData } = await supabase
    .from("package_gallery")
    .select("image_url, media_type")
    .eq("package_id", pkg.id)
    .order("sort_order", { ascending: true })

  const pkgImages: any[] = pkgImagesData || []

  const reviews: any[] = []

  const reviewerIds = [...new Set(reviews.map((r: any) => r.customer_id).filter(Boolean))]
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

  const images = pkgImages.map((i: any) => i.image_url).filter(Boolean) as string[]

  const galleryItems = pkgImages

  return (
    <PackageDetailClient
      pkg={pkg}
      images={images}
      galleryItems={galleryItems}
      reviews={reviews}
      reviewerMap={reviewerMap}
    />
  )
}