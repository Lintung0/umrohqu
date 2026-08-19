"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
  hideLabel?: boolean
}

export function PasswordInput({
  label,
  value,
  onChange,
  error,
  autoComplete,
  hideLabel,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && label && (
        <label className="text-[15px] font-semibold tracking-tight text-auth-secondary-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex min-h-[52px] items-center overflow-hidden rounded-[14px] border-[1.5px] transition-[border-color,box-shadow] duration-150",
          error
            ? "border-auth-error bg-auth-error-light"
            : "bg-auth-input-bg",
          error
            ? "border-auth-error"
            : focused
              ? "border-auth-primary shadow-[0_0_0_3px_rgba(42,125,79,0.13)]"
              : "border-auth-border",
        )}
      >
        <div className={cn("flex items-center pl-3.5", focused ? "text-auth-primary" : "text-auth-muted-foreground")}>
          <Lock size={18} />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Masukkan kata sandi"
          autoComplete={autoComplete}
          className="flex-1 border-none bg-transparent px-3 py-3.5 text-[16px] text-auth-foreground outline-none placeholder:text-auth-muted-foreground/60"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="flex cursor-pointer items-center border-none bg-transparent px-3.5 pl-2 text-auth-muted-foreground"
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-auth-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  )
}
