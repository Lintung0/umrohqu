"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PrimaryButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}

export function PrimaryButton({
  children,
  onClick,
  loading,
  type = "button",
  disabled,
  className,
}: PrimaryButtonProps) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={cn(
        "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-none text-[16px] font-bold text-white transition-[background,transform] duration-150",
        loading || disabled ? "cursor-not-allowed bg-auth-primary-muted" : "cursor-pointer",
        className,
      )}
      style={{
        background: loading || disabled ? undefined : pressed ? "#1E5E3B" : "#2A7D4F",
        boxShadow: pressed || loading || disabled ? "none" : "0 2px 12px rgba(42,125,79,0.27)",
        transform: pressed ? "scale(0.99)" : "scale(1)",
      }}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}
