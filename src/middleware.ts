import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = [
  "/",
  "/search",
  "/package",
  "/travel",
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
]

const SKIP_SUBDOMAIN_HOSTS = ["www", "api", "localhost", "127.0.0.1"]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/"
    return pathname === route || pathname.startsWith(route + "/")
  })
}

function getSubdomain(hostname: string): string | null {
  const parts = hostname.split(".")
  if (parts.length < 3) return null
  const sub = parts[0]
  if (SKIP_SUBDOMAIN_HOSTS.includes(sub)) return null
  return sub
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
    if (!role || !["super_admin", "marketplace_admin", "marketplace_billing", "marketplace_support"].includes(role)) {
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
