import { IslamicPattern } from "@/components/ui/islamic-pattern"
import Logo from "@/components/logo"
import { createClient } from "@/lib/supabase/server"

export async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const [pkgs, travellers] = await Promise.all([
    supabase.from("packages").select("id", { count: "exact", head: true }).in("status", ["active", "ongoing"]),
    supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active"),
  ])

  const stats = [
    { value: travellers.count ?? 0, label: "Travel Mitra Terverifikasi" },
    { value: pkgs.count ?? 0, label: "Paket Umrah Aktif" },
  ]

  return (
    <div className="flex min-h-dvh">
      {/* Left panel — brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-emerald-deep lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 text-white">
          <IslamicPattern opacity={0.04} />
        </div>

        <div className="relative z-10">
          <Logo variant="light" />
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Temukan Paket Umrah{" "}
            <span className="text-gold-light">Sempurna</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Bergabung dengan jamaah yang telah mempercayakan perjalanan ibadah mereka bersama UmrahQu.
          </p>
          <div className="flex items-center gap-8 pt-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10 bg-white/20" />}
                <div>
                  <div className="text-2xl font-bold text-gold-light">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/30">
          &copy; 2026 UmrahQu. Seluruh hak cipta.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}