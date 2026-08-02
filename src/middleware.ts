import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = [
  "/",
  "/search",
  "/package",
  "/travel",
  "/compare",
  "/promotions",
  "/articles",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/api/auth",
  "/api/xendit",
  "/api/wallet",
  "/api/tenant/setup-fee-callback",
  "/auth/callback",
]

const SKIP_SUBDOMAIN_HOSTS = ["www", "api", "localhost", "127.0.0.1"]

const CUSTOM_DOMAIN_CACHE = new Map<string, { tenantId: string; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/"
    return pathname === route || pathname.startsWith(route + "/")
  })
}

function getSubdomain(hostname: string): string | null {
  const parts = hostname.split(".")

  if (hostname.endsWith(".vercel.app")) {
    if (parts.length === 3) return null
    if (parts.length === 4) {
      const sub = parts[0]
      if (SKIP_SUBDOMAIN_HOSTS.includes(sub)) return null
      return sub
    }
  }

  if (parts.length < 3) return null
  const sub = parts[0]
  if (SKIP_SUBDOMAIN_HOSTS.includes(sub)) return null
  return sub
}

function isIpOrLocalhost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { hostname, protocol } = request.nextUrl
  const { pathname } = request.nextUrl

  const subdomain = getSubdomain(hostname)

  if (subdomain) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, name, logo_url, brand_color, custom_domain, description")
      .eq("slug", subdomain)
      .eq("status", "verified")
      .single()

    if (!tenant) {
      const url = request.nextUrl.clone()
      url.pathname = "/404"
      return NextResponse.rewrite(url)
    }

    const response = NextResponse.rewrite(
      new URL(`/travel-site/${tenant.id}${pathname === "/" ? "" : pathname}`, request.url)
    )
    response.headers.set("x-tenant-id", tenant.id)
    response.headers.set("x-tenant-data", JSON.stringify(tenant))
    return response
  }

  if (!isIpOrLocalhost(hostname)) {
    const cached = CUSTOM_DOMAIN_CACHE.get(hostname)
    if (cached && cached.expiresAt > Date.now()) {
      const response = NextResponse.rewrite(
        new URL(`/travel-site/${cached.tenantId}${pathname === "/" ? "" : pathname}`, request.url)
      )
      response.headers.set("x-tenant-id", cached.tenantId)
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: customTenant } = await supabase
      .from("tenants")
      .select("id, slug, name, logo_url, brand_color, custom_domain, description")
      .eq("custom_domain", hostname)
      .eq("status", "verified")
      .single()

    if (customTenant) {
      CUSTOM_DOMAIN_CACHE.set(hostname, {
        tenantId: customTenant.id,
        expiresAt: Date.now() + CACHE_TTL_MS,
      })

      const response = NextResponse.rewrite(
        new URL(`/travel-site/${customTenant.id}${pathname === "/" ? "" : pathname}`, request.url)
      )
      response.headers.set("x-tenant-id", customTenant.id)
      response.headers.set("x-tenant-data", JSON.stringify(customTenant))
      return response
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isPublicRoute(pathname)) {
    if (user && (pathname === "/login" || pathname === "/register")) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role as string | undefined

  if (pathname.startsWith("/admin")) {
    if (!role || !["super_admin", "marketplace_admin", "marketplace_finance", "marketplace_operational"].includes(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (pathname.startsWith("/travel-dashboard")) {
    if (!role || !["travel_admin", "travel_staff"].includes(role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.png|logo.png|logo-icon.png|icons/.*|images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
