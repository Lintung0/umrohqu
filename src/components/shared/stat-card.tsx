import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
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
  trend?: { value: number; label: string }
}

export default function StatCard({ icon: Icon, label, value, subtitle, color, href, variant = "bordered", gradient, trend }: StatCardProps) {
  const content = (
    <div className={`group rounded-2xl p-5 shadow-sm transition-all duration-300 ${
      variant === "gradient"
        ? `bg-gradient-to-br ${gradient || "from-emerald-500 to-emerald-700"} text-white hover:shadow-xl hover:shadow-emerald-600/20 hover:-translate-y-0.5`
        : "bg-white border border-slate-200 hover:shadow-lg hover:shadow-emerald-100/40 hover:border-emerald-200 hover:-translate-y-0.5"
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={`text-sm font-medium ${variant === "gradient" ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          variant === "gradient" ? "bg-white/20" : color || "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover:from-emerald-500 group-hover:to-emerald-700 group-hover:text-white transition-colors"
        }`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {trend && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
              trend.value >= 0
                ? variant === "gradient" ? "text-white/90" : "text-emerald-600"
                : variant === "gradient" ? "text-white/90" : "text-red-500"
            }`}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
          )}
          {subtitle && (
            <p className={`text-xs ${variant === "gradient" ? "opacity-70" : "text-muted-foreground"}`}>{subtitle}</p>
          )}
        </div>
      )}
      {href && !trend && !subtitle && variant === "bordered" && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 mt-3 group-hover:underline">
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
