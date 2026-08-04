import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color?: string
  href?: string
  variant?: "gradient" | "bordered"
  gradient?: string
}

export default function StatCard({ icon: Icon, label, value, subtitle, color, href, variant = "bordered", gradient }: StatCardProps) {
  const content = (
    <div className={`rounded-2xl p-5 transition-shadow ${
      variant === "gradient"
        ? `bg-gradient-to-br ${gradient || "from-emerald-500 to-emerald-700"} text-white hover:shadow-lg`
        : "bg-white border border-border hover:shadow-md"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          variant === "gradient" ? "bg-white/20" : color || "bg-emerald-100 text-emerald-600"
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-2xl font-bold ${variant === "gradient" ? "" : ""}`}>{value}</p>
          <p className={`text-sm ${variant === "gradient" ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
        </div>
      </div>
      {subtitle && (
        <p className={`text-xs mt-2 ${variant === "gradient" ? "opacity-70" : "text-muted-foreground"}`}>{subtitle}</p>
      )}
      {href && variant === "bordered" && (
        <div className="flex items-center gap-1 text-xs text-primary mt-3 group-hover:underline">
          Lihat Semua <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}
