"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CenterPopupProps {
  show: boolean
  message: string
  onClose?: () => void
  duration?: number
  variant?: "success" | "warning"
  actionLabel?: string
  actionHref?: string
}

export function CenterPopup({ show, message, onClose, duration = 2200, variant = "success", actionLabel, actionHref }: CenterPopupProps) {
  const [visible, setVisible] = useState(false)
  const [animatingOut, setAnimatingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (show) {
      setVisible(true)
      setAnimatingOut(false)
      const timer = setTimeout(() => {
        setAnimatingOut(true)
        setTimeout(() => {
          setVisible(false)
          onClose?.()
        }, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!visible) return null

  const isWarning = variant === "warning"

  function handleAction() {
    setVisible(false)
    onClose?.()
    if (actionHref) router.push(actionHref)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "flex flex-col items-center gap-2.5 bg-white rounded-2xl px-8 py-5 shadow-2xl border border-gray-100 transition-all duration-300",
          animatingOut
            ? "opacity-0 scale-90"
            : "opacity-100 scale-100 animate-in zoom-in-95 duration-200"
        )}
      >
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isWarning ? "bg-amber-100" : "bg-emerald-100")}>
          {isWarning ? (
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          ) : (
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 text-center max-w-[200px]">{message}</p>
        {actionLabel && actionHref && (
          <button
            type="button"
            onClick={handleAction}
            className={cn(
              "pointer-events-auto mt-1 w-full max-w-[200px] rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors",
              isWarning ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}