import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { enrichPackagesWithDetail } from "@/lib/package-detail-fields"
import PackageDetailClient, { type PackageDetail, type ReviewRow } from "./package-detail-client"
import type { Metadata } from "next"
import type { Package } from "@/lib/types"

export const revalidate = 3600

interface PackageMetaRow {
  id: string
  name: string
  description: string | null
  price: number
  travel: { name: string | null } | { name: string | null }[] | null
}

interface PackageGalleryRow {
  image_url: string | null
  media_type: string | null
}

interface ReviewerRow {
  id: string
  full_name: string | null
}

type FetchedPackage = Omit<PackageDetail, "travel"> & {
  travel: PackageDetail["travel"] | PackageDetail["travel"][] | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()

  let pkg: PackageMetaRow | null = null
  try {
    const { data: pkgData, error } = await supabase
      .from("packages")
      .select("name, description, price, id, travel:tenants(name)")
      .eq("slug", slug)
      .in("status", ["active", "ongoing"])
      .single()
    if (!error && pkgData) {
      pkg = pkgData as unknown as PackageMetaRow
    }
  } catch {
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

  const travelRef = Array.isArray(pkg.travel) ? pkg.travel[0] : pkg.travel
  const travelName = travelRef?.name || "UmrahQu"
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

  let pkg: FetchedPackage | null = null
  try {
    const { data: pkgData, error } = await supabase
      .from("packages")
      .select("*, travel:tenants(id, name, slug, status, is_verified, logo_url, brand_color, description)")
      .eq("slug", slug)
      .in("status", ["active", "ongoing"])
      .single()
    if (!error && pkgData) {
      pkg = pkgData as unknown as FetchedPackage
    }
  } catch {
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

  const pkgImages: PackageGalleryRow[] = pkgImagesData || []

  const enriched = await enrichPackagesWithDetail(supabase, [pkg as unknown as Package])
  pkg = (enriched?.[0] as unknown as FetchedPackage) ?? pkg

  const reviews: ReviewRow[] = []

  const reviewerIds = [...new Set(reviews.map((r) => r.customer_id).filter(Boolean))]
  let reviewerMap: Record<string, string> = {}
  if (reviewerIds.length > 0) {
    const { data: reviewers } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", reviewerIds)
    if (reviewers) {
      reviewerMap = Object.fromEntries(reviewers.map((r: ReviewerRow) => [r.id, r.full_name ?? ""]))
    }
  }

  const images = pkgImages.map((i) => i.image_url).filter((u): u is string => typeof u === "string")

  const galleryItems = pkgImages
    .filter((g): g is PackageGalleryRow & { image_url: string } => typeof g.image_url === "string")
    .map((i) => ({ url: i.image_url, type: (i.media_type === "video" ? "video" : "image") as "image" | "video" }))

  const travel = Array.isArray(pkg.travel) ? (pkg.travel[0] ?? null) : pkg.travel

  return (
    <PackageDetailClient
      pkg={{ ...pkg, travel }}
      images={images}
      galleryItems={galleryItems}
      reviews={reviews}
      reviewerMap={reviewerMap}
    />
  )
}