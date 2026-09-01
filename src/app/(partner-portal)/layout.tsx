import Logo from "@/components/logo"

export const metadata = {
  title: "UmrahQu - Daftar Travel Partner",
}

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-emerald-900 via-slate-800 to-emerald-900 text-white flex flex-col items-center relative overflow-hidden">

      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/12 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-emerald-400/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col items-center flex-1">

        {/* Logo */}
        <div className="mb-8 [&_a>img]:brightness-0 [&_a>img]:invert [&_a>img]:h-8 [&_a>img]:opacity-80 hover:[&_a>img]:opacity-100 transition-opacity">
          <Logo variant="light" />
        </div>

        {children}

        {/* Footer */}
        <div className="mt-auto pt-12 pb-4 text-center">
          <p className="text-xs text-white/20">
            &copy; 2026 UmrahQu. Seluruh hak cipta.
          </p>
        </div>
      </div>
    </main>
  )
}
